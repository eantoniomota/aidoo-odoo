from . import models
from . import controllers


def post_init_hook(env):
    """Force-load translations for every active language right after install
    or upgrade. Without this, the module's .po files are only loaded for
    languages that were already active when the module was first installed,
    and the UI stays in English even on a French Odoo.
    """
    _reload_aidoo_translations(env)


def _reload_aidoo_translations(env):
    """Reload the aidoo module terms for every active res.lang."""
    langs = env["res.lang"].search([("active", "=", True)]).mapped("code")
    if not langs:
        return
    env["ir.module.module"]._load_module_terms(["aidoo"], langs, overwrite=True)
