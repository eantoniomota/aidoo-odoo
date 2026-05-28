import logging

from odoo import _, api, fields, models
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)

API_BASE_URL_PARAM = "aidoo.api_base_url"
API_KEY_PARAM = "aidoo.api_key_encrypted"
DEFAULT_API_BASE_URL = "https://api.aidoo.ai"


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    aidoo_api_base_url = fields.Char(
        string="Aidoo API base URL",
        config_parameter=API_BASE_URL_PARAM,
        default=DEFAULT_API_BASE_URL,
        help="Base URL of the Aidoo API. Defaults to https://api.aidoo.ai.",
    )
    aidoo_api_key_set = fields.Boolean(
        string="API key configured",
        compute="_compute_aidoo_api_key_set",
    )
    aidoo_manual_api_key = fields.Char(
        string="API key",
        help=(
            "Paste the connection key generated on aidoo.ai → "
            "Settings → Odoo module (format: aid_odoo_…)."
        ),
    )
    aidoo_user_lang = fields.Selection(
        string="Interface language",
        selection="_aidoo_get_lang_selection",
        default=lambda self: self.env.user.lang,
        help=(
            "Language used for the Aidoo systray and panels. Changing it "
            "updates your Odoo language preference."
        ),
    )

    @api.depends_context("uid")
    def _compute_aidoo_api_key_set(self):
        params = self.env["ir.config_parameter"].sudo()
        encrypted = params.get_param(API_KEY_PARAM, "")
        for rec in self:
            rec.aidoo_api_key_set = bool(encrypted)

    # ------------------------------------------------------------------
    # Interface language for the current Odoo user
    # ------------------------------------------------------------------

    @api.model
    def _aidoo_get_lang_selection(self):
        langs = self.env["res.lang"].search([("active", "=", True)])
        return [(l.code, l.name) for l in langs]

    @api.model
    def get_values(self):
        # Hook into Odoo's TransientModel mechanic so the language picker
        # always opens on the current user's actual language.
        res = super().get_values()
        res["aidoo_user_lang"] = self.env.user.lang
        return res

    # ------------------------------------------------------------------
    # Helpers consumed by controllers/tests
    # ------------------------------------------------------------------

    @api.model
    def aidoo_get_api_base_url(self):
        return (
            self.env["ir.config_parameter"].sudo().get_param(API_BASE_URL_PARAM)
            or DEFAULT_API_BASE_URL
        ).rstrip("/")

    @api.model
    def aidoo_get_api_key(self):
        encrypted = self.env["ir.config_parameter"].sudo().get_param(API_KEY_PARAM, "")
        if not encrypted:
            return ""
        return self.env["aidoo.encryption"].decrypt(encrypted)

    @api.model
    def aidoo_store_api_key(self, api_key):
        if not api_key:
            _logger.warning("[Aidoo] aidoo_store_api_key called with empty key — skipping")
            return
        try:
            encrypted = self.env["aidoo.encryption"].encrypt(api_key)
        except Exception as exc:
            _logger.exception("[Aidoo] Encryption failed: %s", exc)
            raise UserError(_(
                "Could not encrypt the Aidoo API key. "
                "Check the server logs and that the 'cryptography' Python package is installed."
            )) from exc
        self.env["ir.config_parameter"].sudo().set_param(API_KEY_PARAM, encrypted)
        _logger.info("[Aidoo] API key stored successfully (len=%d).", len(api_key))

    @api.model
    def aidoo_clear_credentials(self):
        self.env["ir.config_parameter"].sudo().set_param(API_KEY_PARAM, "")

    # ------------------------------------------------------------------
    # Inverse for manual key (writes the encrypted version)
    # ------------------------------------------------------------------

    def set_values(self):
        super().set_values()
        for rec in self:
            raw = rec.aidoo_manual_api_key or ""
            _logger.info(
                "[Aidoo] set_values: manual_api_key provided=%s (len=%d)",
                bool(raw), len(raw),
            )
            if raw:
                key = raw.strip()
                if not key.startswith("aid_odoo_"):
                    _logger.warning(
                        "[Aidoo] set_values: rejected key (bad prefix, len=%d)", len(key)
                    )
                    raise UserError(_(
                        "The API key must start with 'aid_odoo_'. "
                        "Generate one on aidoo.ai → Settings → Odoo module."
                    ))
                self.aidoo_store_api_key(key)
                rec.aidoo_manual_api_key = False

            # Apply the language change to the current Odoo user. Refresh of
            # the page is needed for the change to be visible everywhere.
            if rec.aidoo_user_lang and rec.aidoo_user_lang != self.env.user.lang:
                self.env.user.sudo().lang = rec.aidoo_user_lang
                # Make sure the aidoo .po for that language is loaded —
                # otherwise the panel falls back to English even though the
                # user just selected French.
                from .. import _reload_aidoo_translations
                _reload_aidoo_translations(self.env)

    # ------------------------------------------------------------------
    # Disconnect button
    # ------------------------------------------------------------------

    def action_aidoo_disconnect(self):
        self.aidoo_clear_credentials()
        return {
            "type": "ir.actions.client",
            "tag": "reload",
        }

    def action_aidoo_reload_translations(self):
        """Re-load the .po files of the aidoo module for every active language.
        Useful when languages were activated after the module was installed.
        """
        if not self.env.user.has_group("aidoo.group_aidoo_admin"):
            raise UserError(_(
                "Only Aidoo administrators can reload the translations."
            ))
        from .. import _reload_aidoo_translations
        _reload_aidoo_translations(self.env)
        return {
            "type": "ir.actions.client",
            "tag": "display_notification",
            "params": {
                "title": _("Aidoo"),
                "message": _("Translations reloaded. Refresh the page to see them applied."),
                "type": "success",
                "sticky": False,
            },
        }
