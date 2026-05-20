/** @odoo-module **/

import { Component, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

export class AidooNoClaude extends Component {
    static template = "aidoo.NoClaude";
    static props = {
        mcpUrl: { type: String, optional: true },
    };

    setup() {
        this.notification = useService("notification");
        this.state = useState({ copied: false });
    }

    async connectClaude() {
        const url = this.props.mcpUrl || "https://mcp.aidoo.fr/mcp";
        try {
            await navigator.clipboard.writeText(url);
            this.state.copied = true;
            this.notification.add("MCP URL copied to clipboard.", { type: "success" });
            setTimeout(() => (this.state.copied = false), 1800);
        } catch (_err) {
            // silent — opening the connector page is still useful
        }
        window.open("https://claude.ai/customize/connectors", "_blank", "noopener");
    }
}
