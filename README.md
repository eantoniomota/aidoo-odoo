# Aidoo — Odoo module

Native Odoo integration for [Aidoo](https://aidoo.ai), the AI assistant for Odoo ERP.

This addon adds a systray button in Odoo that lets users interact with their Aidoo
workflows, exécutions and AI-driven actions without leaving Odoo.

## Branches

| Branch | Odoo version |
|--------|--------------|
| `17.0` | Odoo 17 |
| `18.0` | Odoo 18 |
| `19.0` | Odoo 19 (this branch) |

## Features

- Aidoo icon in the Odoo systray (top right).
- Recent executions for the connected user.
- Launch Aidoo workflows with a dynamic form (variables defined in Aidoo).
- Context-aware: on a record, compatible workflows are highlighted and the
  current record is pre-filled.
- Encrypted API key storage in `ir.config_parameter`.
- Compatible with Odoo Community and Enterprise.

## Install

1. Drop the `aidoo/` folder into your Odoo addons path.
2. Update the apps list and install **Aidoo**.
3. Go to **Settings → General Settings → Aidoo** and connect your Odoo instance
   to an Aidoo account.

## License

LGPL-3
