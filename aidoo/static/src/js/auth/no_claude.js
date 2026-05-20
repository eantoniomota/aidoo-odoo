/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";

const CONNECTOR_NAME = "Aidoo";
const CONNECTOR_URL = "https://mcp.aidoo.fr/mcp";

export class AidooNoClaude extends Component {
    static template = "aidoo.NoClaude";
    static props = {
        mcpUrl: { type: String, optional: true },
    };

    setup() {
        this.notification = useService("notification");
        this.state = useState({
            copiedField: null, // "name" | "url" | "opening"
        });
        this.labels = {
            title: _t("Connect Aidoo to Claude"),
            body: _t("Your Aidoo workspace is ready. To start using AI workflows, add Aidoo as a custom connector in Claude with the details below."),
            connectorIntro: _t("In Claude, add a custom connector with:"),
            nameLabel: _t("Name"),
            urlLabel: _t("URL"),
            copyTitle: _t("Copy"),
            copiedNotice: _t("Copied to clipboard."),
            ctaIdle: _t("Open Claude connectors"),
            ctaOpening: _t("Opening Claude…"),
            footer: _t("The MCP URL (https://mcp.aidoo.fr/mcp) will also be copied to your clipboard when you click the button above."),
        };
    }

    get connectorName() {
        return CONNECTOR_NAME;
    }

    get connectorUrl() {
        return this.props.mcpUrl || CONNECTOR_URL;
    }

    async copyValue(value, field) {
        try {
            await navigator.clipboard.writeText(value);
            this.state.copiedField = field;
            this.notification.add(this.labels.copiedNotice, { type: "success" });
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

    async connectClaude() {
        await this.copyValue(this.connectorUrl, "opening");
        window.open("https://claude.ai/customize/connectors", "_blank", "noopener");
    }
}
