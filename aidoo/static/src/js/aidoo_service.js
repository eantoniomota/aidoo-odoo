/** @odoo-module **/

import { registry } from "@web/core/registry";
import { session } from "@web/session";

export const aidooService = {
    dependencies: ["rpc"],

    async start(env, { rpc }) {
        const state = {
            bootstrap: null,
            me: null,
            email: session.username || session.partner_display_name || "",
        };

        async function bootstrap() {
            if (state.bootstrap) return state.bootstrap;
            state.bootstrap = await rpc("/aidoo/bootstrap", {});
            return state.bootstrap;
        }

        async function me() {
            if (state.me) return state.me;
            state.me = await rpc("/aidoo/proxy/me", {});
            return state.me;
        }

        function invalidate() {
            state.bootstrap = null;
            state.me = null;
        }

        return {
            bootstrap,
            me,
            invalidate,
            email: state.email,
            listExecutions(params = {}) {
                return rpc("/aidoo/proxy/executions", params);
            },
            listWorkflows(params = {}) {
                return rpc("/aidoo/proxy/workflows", params);
            },
            getWorkflowSchema(workflowId) {
                return rpc(`/aidoo/proxy/workflows/${workflowId}/schema`, {});
            },
            runWorkflow(workflowId, variables) {
                return rpc(`/aidoo/proxy/workflows/${workflowId}/run`, { variables });
            },
            disconnect() {
                invalidate();
                return rpc("/aidoo/disconnect", {});
            },
        };
    },
};

registry.category("services").add("aidoo", aidooService);
