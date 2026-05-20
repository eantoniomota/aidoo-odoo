from odoo.tests.common import TransactionCase


class TestAidooSettings(TransactionCase):
    def setUp(self):
        super().setUp()
        self.Settings = self.env["res.config.settings"]
        self.Settings.aidoo_clear_credentials()

    def test_store_and_read_api_key(self):
        self.Settings.aidoo_store_api_key("aid_odoo_prod_secret")
        self.assertEqual(self.Settings.aidoo_get_api_key(), "aid_odoo_prod_secret")
        param = self.env["ir.config_parameter"].sudo().get_param(
            "aidoo.api_key_encrypted"
        )
        self.assertNotIn("aid_odoo_prod_secret", param or "")

    def test_clear_credentials(self):
        self.Settings.aidoo_store_api_key("aid_odoo_prod_secret")
        self.Settings.aidoo_clear_credentials()
        self.assertFalse(self.Settings.aidoo_get_api_key())

    def test_default_base_url(self):
        self.assertTrue(self.Settings.aidoo_get_api_base_url().startswith("http"))
