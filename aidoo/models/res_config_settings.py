from odoo import _, api, fields, models
from odoo.exceptions import UserError

API_BASE_URL_PARAM = "aidoo.api_base_url"
SLUG_PARAM = "aidoo.slug"
API_KEY_PARAM = "aidoo.api_key_encrypted"
INSTANCE_NAME_PARAM = "aidoo.instance_name"
DEFAULT_API_BASE_URL = "https://api.aidoo.fr"


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    aidoo_api_base_url = fields.Char(
        string="Aidoo API base URL",
        config_parameter=API_BASE_URL_PARAM,
        default=DEFAULT_API_BASE_URL,
        help="Base URL of the Aidoo API. Defaults to https://api.aidoo.fr.",
    )
    aidoo_instance_slug = fields.Char(
        string="Instance slug",
        config_parameter=SLUG_PARAM,
        readonly=True,
        help="Unique identifier of this Odoo instance on the Aidoo platform.",
    )
    aidoo_instance_name = fields.Char(
        string="Instance name",
        config_parameter=INSTANCE_NAME_PARAM,
        help="Human-readable name for this Odoo instance on the Aidoo dashboard.",
    )
    aidoo_api_key_set = fields.Boolean(
        string="API key configured",
        compute="_compute_aidoo_api_key_set",
    )
    aidoo_manual_api_key = fields.Char(
        string="API key",
        help=(
            "Paste an Aidoo Odoo-instance API key (aid_odoo_…) here to connect manually. "
            "Leave empty and use the 'Connect to Aidoo' button to register automatically."
        ),
    )

    @api.depends_context("uid")
    def _compute_aidoo_api_key_set(self):
        params = self.env["ir.config_parameter"].sudo()
        encrypted = params.get_param(API_KEY_PARAM, "")
        for rec in self:
            rec.aidoo_api_key_set = bool(encrypted)

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
    def aidoo_get_slug(self):
        return self.env["ir.config_parameter"].sudo().get_param(SLUG_PARAM, "")

    @api.model
    def aidoo_get_api_key(self):
        encrypted = self.env["ir.config_parameter"].sudo().get_param(API_KEY_PARAM, "")
        if not encrypted:
            return ""
        return self.env["aidoo.encryption"].decrypt(encrypted)

    @api.model
    def aidoo_store_credentials(self, slug, api_key, name=None):
        params = self.env["ir.config_parameter"].sudo()
        encrypted = self.env["aidoo.encryption"].encrypt(api_key)
        params.set_param(SLUG_PARAM, slug or "")
        params.set_param(API_KEY_PARAM, encrypted)
        if name:
            params.set_param(INSTANCE_NAME_PARAM, name)

    @api.model
    def aidoo_clear_credentials(self):
        params = self.env["ir.config_parameter"].sudo()
        params.set_param(SLUG_PARAM, "")
        params.set_param(API_KEY_PARAM, "")
        params.set_param(INSTANCE_NAME_PARAM, "")

    # ------------------------------------------------------------------
    # Inverse for manual key (writes the encrypted version)
    # ------------------------------------------------------------------

    def set_values(self):
        super().set_values()
        for rec in self:
            if rec.aidoo_manual_api_key:
                if not rec.aidoo_instance_slug:
                    raise UserError(_(
                        "Provide the instance slug before saving the API key. "
                        "Use 'Connect to Aidoo' to obtain a slug automatically."
                    ))
                self.aidoo_store_credentials(
                    rec.aidoo_instance_slug,
                    rec.aidoo_manual_api_key,
                    rec.aidoo_instance_name,
                )
                rec.aidoo_manual_api_key = False

    # ------------------------------------------------------------------
    # Button: open registration wizard / disconnect
    # ------------------------------------------------------------------

    def action_aidoo_disconnect(self):
        self.aidoo_clear_credentials()
        return {
            "type": "ir.actions.client",
            "tag": "reload",
        }
