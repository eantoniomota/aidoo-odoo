/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { AidooNotConnected } from "../auth/not_connected";
import { ExecutionsTab } from "./executions_tab";
import { WorkflowsTab } from "./workflows_tab";

/**
 * Read the active model / id from the currently displayed Odoo controller.
 * Returns { model: string | null, resId: number | null }.
 */
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
    static components = { AidooNotConnected, ExecutionsTab, WorkflowsTab };
    static props = {};

    setup() {
        this.aidoo = useService("aidoo");
        this.state = useState({
            tab: "executions",
            loading: true,
            mapped: false,
            user: null,
            context: { model: null, resId: null },
        });

        onWillStart(async () => {
            this.state.context = readActiveContext(this.env);
            try {
                const me = await this.aidoo.me();
                this.state.mapped = Boolean(me && me.mapped);
                this.state.user = me?.user || null;
            } catch (_err) {
                this.state.mapped = false;
            } finally {
                this.state.loading = false;
            }
        });
    }

    selectTab(tab) {
        this.state.tab = tab;
    }
}
