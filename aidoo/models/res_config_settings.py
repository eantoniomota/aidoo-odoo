from odoo import _, api, fields, models
from odoo.exceptions import UserError

API_BASE_URL_PARAM = "aidoo.api_base_url"
API_KEY_PARAM = "aidoo.api_key_encrypted"
DEFAULT_API_BASE_URL = "https://api.aidoo.fr"


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    aidoo_api_base_url = fields.Char(
        string="Aidoo API base URL",
        config_parameter=API_BASE_URL_PARAM,
        default=DEFAULT_API_BASE_URL,
        help="Base URL of the Aidoo API. Defaults to https://api.aidoo.fr.",
    )
    aidoo_api_key_set = fields.Boolean(
        string="API key configured",
        compute="_compute_aidoo_api_key_set",
    )
    aidoo_manual_api_key = fields.Char(
        string="API key",
        help=(
            "Paste the connection key generated on app.aidoo.fr → "
            "Settings → Odoo module (format: aid_odoo_…)."
        ),
    )
    aidoo_user_lang = fields.Selection(
        string="Interface language",
        selection="_aidoo_get_lang_selection",
        compute="_compute_aidoo_user_lang",
        inverse="_inverse_aidoo_user_lang",
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

    @api.depends_context("uid")
    def _compute_aidoo_user_lang(self):
        for rec in self:
            rec.aidoo_user_lang = self.env.user.lang

    def _inverse_aidoo_user_lang(self):
        for rec in self:
            if rec.aidoo_user_lang and rec.aidoo_user_lang != self.env.user.lang:
                # Apply to the current user only — Aidoo never silently
                # changes the language of other users.
                self.env.user.sudo().lang = rec.aidoo_user_lang

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
            return
        encrypted = self.env["aidoo.encryption"].encrypt(api_key)
        self.env["ir.config_parameter"].sudo().set_param(API_KEY_PARAM, encrypted)

    @api.model
    def aidoo_clear_credentials(self):
        self.env["ir.config_parameter"].sudo().set_param(API_KEY_PARAM, "")

    # ------------------------------------------------------------------
    # Inverse for manual key (writes the encrypted version)
    # ------------------------------------------------------------------

    def set_values(self):
        super().set_values()
        for rec in self:
            if rec.aidoo_manual_api_key:
                key = rec.aidoo_manual_api_key.strip()
                if not key.startswith("aid_odoo_"):
                    raise UserError(_(
                        "The API key must start with 'aid_odoo_'. "
                        "Generate one on app.aidoo.fr → Settings → Odoo module."
                    ))
                self.aidoo_store_api_key(key)
                rec.aidoo_manual_api_key = False

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
            "tag": "reload",
        }
