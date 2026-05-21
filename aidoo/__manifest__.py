{
    "name": "Aidoo",
    "version": "18.0.1.0.9",
    "summary": "Bring the Aidoo AI assistant inside Odoo: workflows, executions and contextual actions.",
    "description": """
Aidoo — AI assistant for Odoo
=============================

This module connects Odoo to the Aidoo platform (https://aidoo.fr) and adds an
Aidoo button in the Odoo systray.

Features:
- Recent executions for the connected user.
- Launch Aidoo workflows from Odoo with a dynamic variable form.
- Context-aware: compatible workflows are highlighted on the current record.
- Secure: API key encrypted with AES-256-GCM, scoped per Odoo instance.

Requires an Aidoo account at https://app.aidoo.fr.
""",
    "author": "PLANOR",
    "maintainer": "PLANOR",
    "support": "support@aidoo.fr",
    "website": "https://aidoo.fr",
    "license": "LGPL-3",
    "category": "Productivity/AI",
    "depends": ["base", "web"],
    "external_dependencies": {
        "python": ["cryptography"],
    },
    "data": [
        "security/aidoo_security.xml",
        "security/ir.model.access.csv",
        "data/ir_config_parameter.xml",
        "views/res_config_settings_views.xml",
    ],
    "assets": {
        "web.assets_backend": [
            "aidoo/static/src/scss/aidoo.scss",
            "aidoo/static/src/js/i18n/translations.js",
            "aidoo/static/src/js/aidoo_service.js",
            "aidoo/static/src/js/systray/aidoo_systray.js",
            "aidoo/static/src/js/systray/aidoo_systray.xml",
            "aidoo/static/src/js/panel/aidoo_panel.js",
            "aidoo/static/src/js/panel/aidoo_panel.xml",
            "aidoo/static/src/js/panel/executions_tab.js",
            "aidoo/static/src/js/panel/executions_tab.xml",
            "aidoo/static/src/js/panel/workflows_tab.js",
            "aidoo/static/src/js/panel/workflows_tab.xml",
            "aidoo/static/src/js/panel/workflow_form.js",
            "aidoo/static/src/js/panel/workflow_form.xml",
            "aidoo/static/src/js/panel/claude_tab.js",
            "aidoo/static/src/js/panel/claude_tab.xml",
            "aidoo/static/src/js/auth/invited.js",
            "aidoo/static/src/js/auth/invited.xml",
            "aidoo/static/src/js/auth/no_claude.js",
            "aidoo/static/src/js/auth/no_claude.xml",
        ],
    },
    "images": [
        "static/description/banner.png",
        "static/description/01-aidoo-in-odoo.png",
        "static/description/02-aidoo-dashboard.png",
        "static/description/03-workflow-editor.png",
        "static/description/04-claude-prompt.png",
    ],
    "installable": True,
    "application": False,
    "post_init_hook": "post_init_hook",
}
