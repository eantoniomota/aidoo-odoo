/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { t as _t } from "../i18n/translations";

export class ClaudeTab extends Component {
    static template = "aidoo.ClaudeTab";
    static props = {
        mcpUrl: { type: String, optional: true },
    };

    setup() {
        this.notification = useService("notification");
        this.state = useState({ copiedField: null });
        this.labels = {
            intro: _t("Add Aidoo as a custom connector in Claude so it can talk to your Odoo. Authentication is automatic (OAuth)."),
            connectorIntro: _t("In Claude, add a custom connector with:"),
            nameLabel: _t("Name"),
            urlLabel: _t("URL"),
            copyTitle: _t("Copy"),
            openClaude: _t("Open Claude connectors"),
            footer: _t("Authentication opens an Aidoo login window — no API key to paste."),
            copyDone: _t("Copied to clipboard."),
        };
        this.connectorName = "Aidoo";
    }

    get connectorUrl() {
        return this.props.mcpUrl || "https://mcp.aidoo.fr/mcp";
    }

    async copyValue(value, field) {
        try {
            await navigator.clipboard.writeText(value);
            this.state.copiedField = field;
            this.notification.add(this.labels.copyDone, { type: "success" });
            setTimeout(() => {
                if (this.state.copiedField === field) {
                    this.state.copiedField = null;
                }
            }, 1500);
        } catch (_err) {
            /* silent */
        }
    }

    copyName() {
        return this.copyValue(this.connectorName, "name");
    }

    copyUrl() {
        return this.copyValue(this.connectorUrl, "url");
    }

    async openClaudeConnectors() {
        await this.copyValue(this.connectorUrl, "opening");
        window.open("https://claude.ai/customize/connectors", "_blank", "noopener");
    }
}
