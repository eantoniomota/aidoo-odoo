/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class ClaudeTab extends Component {
    static template = "aidoo.ClaudeTab";
    static props = {
        mcpUrl: { type: String, optional: true },
    };

    setup() {
        this.notification = useService("notification");
        this.state = useState({ copied: false });
    }

    get mcpUrl() {
        return this.props.mcpUrl || "https://mcp.aidoo.fr/mcp";
    }

    async copyMcpUrl() {
        try {
            await navigator.clipboard.writeText(this.mcpUrl);
            this.state.copied = true;
            this.notification.add("MCP URL copied to clipboard.", { type: "success" });
            setTimeout(() => (this.state.copied = false), 1800);
        } catch (_err) {
            /* silent */
        }
    }

    async openClaudeConnectors() {
        await this.copyMcpUrl();
        window.open("https://claude.ai/customize/connectors", "_blank", "noopener");
    }
}
