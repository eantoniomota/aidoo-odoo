import json
import logging
from urllib import request as urlrequest
from urllib import parse as urlparse
from urllib.error import HTTPError, URLError

from odoo import http
from odoo.http import request

_logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 15  # seconds


class AidooController(http.Controller):
    """BFF (Backend For Frontend) — relays requests from the OWL panel to api.aidoo.fr.

    The Odoo session cookie authenticates the user. The Aidoo API key is read
    server-side from ``ir.config_parameter`` (decrypted on the fly), so the
    raw key never reaches the browser.
    """

    # ------------------------------------------------------------------
    # HTTP helpers
    # ------------------------------------------------------------------

    def _aidoo_settings(self):
        Settings = request.env["res.config.settings"].sudo()
        return {
            "base_url": Settings.aidoo_get_api_base_url(),
            "slug": Settings.aidoo_get_slug(),
            "api_key": Settings.aidoo_get_api_key(),
        }

    def _ensure_connected(self):
        cfg = self._aidoo_settings()
        if not cfg["slug"] or not cfg["api_key"]:
            return None
        return cfg

    def _aidoo_request(self, method, path, params=None, payload=None):
        cfg = self._ensure_connected()
        if cfg is None:
            return {"error": "not_configured", "status": 412}

        url = f"{cfg['base_url']}/v1/odoo/{cfg['slug']}{path}"
        if params:
            url = f"{url}?{urlparse.urlencode({k: v for k, v in params.items() if v is not None})}"

        data = None
        headers = {
            "Authorization": f"Bearer {cfg['api_key']}",
            "Accept": "application/json",
        }
        if payload is not None:
            data = json.dumps(payload).encode("utf-8")
            headers["Content-Type"] = "application/json"

        req = urlrequest.Request(url=url, data=data, method=method, headers=headers)
        try:
            with urlrequest.urlopen(req, timeout=DEFAULT_TIMEOUT) as resp:
                body = resp.read().decode("utf-8") or "{}"
                return json.loads(body)
        except HTTPError as e:
            try:
                body = e.read().decode("utf-8")
                parsed = json.loads(body) if body else {}
            except Exception:
                parsed = {"error": str(e)}
            parsed["status"] = e.code
            return parsed
        except URLError as e:
            _logger.warning("Aidoo API unreachable: %s", e)
            return {"error": "unreachable", "status": 503}

    def _current_email(self):
        user = request.env.user
        return (user.login or user.email or "").strip().lower()

    def _active_context(self, payload):
        if not payload:
            return {}
        return {
            "model": payload.get("model"),
            "resId": payload.get("res_id") or payload.get("resId"),
        }

    # ------------------------------------------------------------------
    # Registration (admin)
    # ------------------------------------------------------------------

    @http.route("/aidoo/register", type="json", auth="user")
    def register(self, name=None, odoo_database=None, **_kw):
        if not request.env.user.has_group("aidoo.group_aidoo_admin"):
            return {"error": "forbidden", "status": 403}

        Settings = request.env["res.config.settings"].sudo()
        base_url = Settings.aidoo_get_api_base_url()
        odoo_url = request.httprequest.host_url.rstrip("/")
        payload = {
            "odooUrl": odoo_url,
            "odooDatabase": odoo_database or request.env.cr.dbname,
            "name": name or (request.env.user.company_id.name or "Odoo"),
        }
        # NOTE: registration of a new instance is done by the user's Aidoo
        # account (JWT), not by an instance key — that's the bootstrap step.
        # The OWL settings page POSTs the user's Aidoo JWT here in `aidoo_jwt`.
        aidoo_jwt = _kw.get("aidoo_jwt")
        if not aidoo_jwt:
            return {"error": "missing_aidoo_jwt", "status": 400}

        company_id = _kw.get("aidoo_company_id")
        if not company_id:
            return {"error": "missing_aidoo_company_id", "status": 400}

        url = f"{base_url.rstrip('/')}/api/companies/{company_id}/odoo-instances"
        data = json.dumps(payload).encode("utf-8")
        req = urlrequest.Request(
            url=url,
            data=data,
            method="POST",
            headers={
                "Authorization": f"Bearer {aidoo_jwt}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )
        try:
            with urlrequest.urlopen(req, timeout=DEFAULT_TIMEOUT) as resp:
                result = json.loads(resp.read().decode("utf-8") or "{}")
        except HTTPError as e:
            try:
                body = e.read().decode("utf-8")
                return {"error": json.loads(body).get("error", str(e)), "status": e.code}
            except Exception:
                return {"error": str(e), "status": e.code}
        except URLError as e:
            return {"error": "unreachable", "status": 503, "details": str(e)}

        slug = result.get("slug")
        api_key = result.get("apiKey")
        if not slug or not api_key:
            return {"error": "invalid_response", "status": 502}

        Settings.aidoo_store_credentials(slug, api_key, payload["name"])
        return {"slug": slug, "name": payload["name"]}

    @http.route("/aidoo/disconnect", type="json", auth="user")
    def disconnect(self, **_kw):
        if not request.env.user.has_group("aidoo.group_aidoo_admin"):
            return {"error": "forbidden", "status": 403}
        request.env["res.config.settings"].sudo().aidoo_clear_credentials()
        return {"ok": True}

    # ------------------------------------------------------------------
    # Proxy endpoints (authenticated Odoo user, no admin requirement)
    # ------------------------------------------------------------------

    @http.route("/aidoo/proxy/me", type="json", auth="user")
    def proxy_me(self, **_kw):
        return self._aidoo_request("GET", "/me", params={"email": self._current_email()})

    @http.route("/aidoo/proxy/executions", type="json", auth="user")
    def proxy_executions(self, model=None, res_id=None, limit=None, **_kw):
        return self._aidoo_request(
            "GET",
            "/executions",
            params={
                "email": self._current_email(),
                "model": model,
                "resId": res_id,
                "limit": limit,
            },
        )

    @http.route("/aidoo/proxy/workflows", type="json", auth="user")
    def proxy_workflows(self, model=None, **_kw):
        return self._aidoo_request(
            "GET",
            "/workflows",
            params={"email": self._current_email(), "model": model},
        )

    @http.route("/aidoo/proxy/workflows/<string:workflow_id>/schema", type="json", auth="user")
    def proxy_workflow_schema(self, workflow_id, **_kw):
        return self._aidoo_request(
            "GET",
            f"/workflows/{workflow_id}/schema",
            params={"email": self._current_email()},
        )

    @http.route("/aidoo/proxy/workflows/<string:workflow_id>/run", type="json", auth="user")
    def proxy_workflow_run(self, workflow_id, variables=None, **_kw):
        return self._aidoo_request(
            "POST",
            f"/workflows/{workflow_id}/run",
            params={"email": self._current_email()},
            payload={"variables": variables or {}},
        )

    # ------------------------------------------------------------------
    # Bootstrap: lightweight endpoint to know if the systray should appear
    # ------------------------------------------------------------------

    @http.route("/aidoo/bootstrap", type="json", auth="user")
    def bootstrap(self, **_kw):
        cfg = self._aidoo_settings()
        return {
            "configured": bool(cfg["slug"] and cfg["api_key"]),
            "base_url": cfg["base_url"],
            "slug": cfg["slug"] or None,
        }
