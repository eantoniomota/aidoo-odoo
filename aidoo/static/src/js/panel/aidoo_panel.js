/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { t as _t } from "../i18n/translations";
import { AidooInvited } from "../auth/invited";
import { AidooNoClaude } from "../auth/no_claude";
import { ExecutionsTab } from "./executions_tab";
import { WorkflowsTab } from "./workflows_tab";
import { ClaudeTab } from "./claude_tab";

function readActiveContext(env) {
    try {
        const controller = env.services.action?.currentController;
        const context = controller?.props?.context || {};
        const propsState = controller?.props?.state || {};
        const model = controller?.props?.resModel || context.active_model || null;
        const rawId =
            propsState.resId ||
            controller?.props?.resId ||
            context.active_id ||
            null;
        const resId = typeof rawId === "number" ? rawId : null;
        return { model, resId };
    } catch (_err) {
        return { model: null, resId: null };
    }
}

export class AidooPanel extends Component {
    static template = "aidoo.Panel";
    static components = {
        AidooInvited,
        AidooNoClaude,
        ExecutionsTab,
        WorkflowsTab,
        ClaudeTab,
    };
    static props = {};

    setup() {
        this.aidoo = useService("aidoo");
        this.state = useState({
            tab: "executions",
            loading: true,
            // server-driven state
            resolved: null, // { state, environment, user?, signupUrl?, mcpUrl }
            context: { model: null, resId: null },
        });
        this.labels = {
            loading: _t("Loading…"),
            tabExecutions: _t("Executions"),
            tabWorkflows: _t("Workflows"),
            tabClaude: _t("Claude"),
            openClaude: _t("Open Claude"),
        };

        onWillStart(async () => {
            this.state.context = readActiveContext(this.env);
            try {
                this.state.resolved = await this.aidoo.me();
            } catch (_err) {
                this.state.resolved = { state: "none" };
            } finally {
                this.state.loading = false;
            }
        });
    }

    selectTab(tab) {
        this.state.tab = tab;
    }

    openClaude() {
        window.open("https://claude.ai/new", "_blank", "noopener");
    }

    get currentState() {
        return this.state.resolved?.state || "none";
    }

    get email() {
        return this.aidoo.email;
    }
}
