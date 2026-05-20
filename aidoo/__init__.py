import logging

from . import models
from . import controllers

_logger = logging.getLogger(__name__)


def post_init_hook(env):
    """Force-load translations for every active language right after install
    or upgrade. Without this, the module's .po files are only loaded for
    languages that were already active when the module was first installed,
    and the UI stays in English even on a French Odoo.
    """
    _reload_aidoo_translations(env)


def _reload_aidoo_translations(env):
    """Reload the aidoo module terms for every active res.lang.

    Logs the langs that were processed so administrators can see what
    happened in the server log if the UI still shows English.
    """
    langs = env["res.lang"].search([("active", "=", True)]).mapped("code")
    if not langs:
        _logger.info("aidoo: no active languages — translations not reloaded")
        return
    try:
        env["ir.module.module"]._load_module_terms(
            ["aidoo"], langs, overwrite=True
        )
        _logger.info(
            "aidoo: translations reloaded for langs=%s", ", ".join(langs)
        )
    except Exception as exc:  # noqa: BLE001 — best-effort, must not break install
        _logger.warning(
            "aidoo: failed to reload translations for langs=%s — %s",
            ", ".join(langs), exc,
        )
