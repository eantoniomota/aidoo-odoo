import json
import logging
from urllib import request as urlrequest
from urllib import parse as urlparse
from urllib.error import HTTPError, URLError

from odoo import http, release
from odoo.http import request

_logger = logging.getLogger(__name__)

DEFAULT_TIMEOUT = 15  # seconds

_AIDOO_USER_AGENT = (
    f"Mozilla/5.0 (compatible; Aidoo-Odoo/{release.major_version}; "
    "+https://aidoo.ai)"
)


class AidooController(http.Controller):
    """BFF (Backend For Frontend) — relays requests from the OWL panel to api.aidoo.ai.

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
            "api_key": Settings.aidoo_get_api_key(),
        }

    def _ensure_connected(self):
        cfg = self._aidoo_settings()
        if not cfg["api_key"]:
            return None
        return cfg

    def _aidoo_request(self, method, path, params=None, payload=None):
        cfg = self._ensure_connected()
        if cfg is None:
            return {"error": "not_configured", "status": 412}

        url = f"{cfg['base_url']}/v1/odoo{path}"
        if params:
            url = f"{url}?{urlparse.urlencode({k: v for k, v in params.items() if v is not None})}"

        data = None
        headers = {
            "Authorization": f"Bearer {cfg['api_key']}",
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
            "User-Agent": _AIDOO_USER_AGENT,
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

    # ------------------------------------------------------------------
    # Disconnect (admin only)
    # ------------------------------------------------------------------

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
    # Builder SSO endpoints
    #
    # The Odoo user's email is sent to api.aidoo.ai which mints a 60-second
    # bootstrap token if the email matches an Aidoo member of the company.
    # The OWL component then injects this token into the iframe via
    # postMessage (Option D in the SSO design). On mapping failure we return
    # the signup_url so the SPA can fall back to the OIDC code flow.
    # ------------------------------------------------------------------

    @http.route("/aidoo/builder/dashboards", type="json", auth="user")
    def builder_dashboards(self, **_kw):
        return self._aidoo_request(
            "GET",
            "/builder/dashboards",
            params={"email": self._current_email()},
        )

    @http.route("/aidoo/builder/sso-token", type="json", auth="user")
    def builder_sso_token(self, **_kw):
        return self._aidoo_request(
            "POST",
            "/builder/sso-exchange",
            payload={"email": self._current_email()},
        )

    # ------------------------------------------------------------------
    # Bootstrap: lightweight endpoint to know if the systray should appear
    # ------------------------------------------------------------------

    @http.route("/aidoo/bootstrap", type="json", auth="user")
    def bootstrap(self, **_kw):
        cfg = self._aidoo_settings()
        is_admin = request.env.user.has_group("aidoo.group_aidoo_admin")
        return {
            "configured": bool(cfg["api_key"]),
            "base_url": cfg["base_url"],
            "isAdmin": is_admin,
            "signupUrl": "https://app.aidoo.ai/register",
            "builderUrl": "https://builder.aidoo.ai",
        }
