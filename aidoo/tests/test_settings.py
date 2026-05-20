from odoo.tests.common import TransactionCase


class TestAidooSettings(TransactionCase):
    def setUp(self):
        super().setUp()
        self.Settings = self.env["res.config.settings"]
        self.Settings.aidoo_clear_credentials()

    def test_store_and_read_credentials(self):
        self.Settings.aidoo_store_credentials(
            slug="abc123", api_key="aid_odoo_secret", name="Acme"
        )
        self.assertEqual(self.Settings.aidoo_get_slug(), "abc123")
        self.assertEqual(self.Settings.aidoo_get_api_key(), "aid_odoo_secret")
        param = self.env["ir.config_parameter"].sudo().get_param(
            "aidoo.api_key_encrypted"
        )
        self.assertNotIn("aid_odoo_secret", param or "")

    def test_clear_credentials(self):
        self.Settings.aidoo_store_credentials("x", "y")
        self.Settings.aidoo_clear_credentials()
        self.assertFalse(self.Settings.aidoo_get_slug())
        self.assertFalse(self.Settings.aidoo_get_api_key())

    def test_default_base_url(self):
        self.assertTrue(self.Settings.aidoo_get_api_base_url().startswith("http"))
