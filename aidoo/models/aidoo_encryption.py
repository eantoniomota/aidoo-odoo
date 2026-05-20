import base64
import hashlib
import hmac
import logging

from cryptography.fernet import Fernet, InvalidToken
from odoo import models

_logger = logging.getLogger(__name__)


class AidooEncryption(models.AbstractModel):
    _name = "aidoo.encryption"
    _description = "Aidoo helper for symmetric encryption of secrets"

    def _derive_fernet_key(self):
        """Derive a Fernet key from the database ``database.secret``.

        The Aidoo API key is encrypted with this derived key before being
        stored in ``ir.config_parameter``. We never reuse the raw database
        secret directly so that rotating the encryption purpose is possible.
        """
        secret = self.env["ir.config_parameter"].sudo().get_param("database.secret")
        if not secret:
            raise UserWarning("database.secret is missing — cannot derive Aidoo encryption key.")
        derived = hashlib.sha256(("aidoo::" + secret).encode("utf-8")).digest()
        return base64.urlsafe_b64encode(derived)

    def encrypt(self, plaintext):
        if not plaintext:
            return ""
        key = self._derive_fernet_key()
        token = Fernet(key).encrypt(plaintext.encode("utf-8"))
        return token.decode("utf-8")

    def decrypt(self, ciphertext):
        if not ciphertext:
            return ""
        try:
            key = self._derive_fernet_key()
            plain = Fernet(key).decrypt(ciphertext.encode("utf-8"))
            return plain.decode("utf-8")
        except (InvalidToken, ValueError):
            _logger.warning("Failed to decrypt Aidoo API key — re-connect the instance.")
            return ""

    def constant_time_eq(self, a, b):
        return hmac.compare_digest(a or "", b or "")
