from odoo.tests.common import TransactionCase


class TestAidooEncryption(TransactionCase):
    def setUp(self):
        super().setUp()
        self.Enc = self.env["aidoo.encryption"]

    def test_roundtrip(self):
        plain = "aid_odoo_super_secret_value"
        cipher = self.Enc.encrypt(plain)
        self.assertTrue(cipher)
        self.assertNotEqual(cipher, plain)
        self.assertEqual(self.Enc.decrypt(cipher), plain)

    def test_decrypt_empty(self):
        self.assertEqual(self.Enc.decrypt(""), "")
        self.assertEqual(self.Enc.encrypt(""), "")

    def test_decrypt_garbage_returns_empty(self):
        self.assertEqual(self.Enc.decrypt("not-a-fernet-token"), "")
