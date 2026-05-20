/** @odoo-module **/

import { registry } from "@web/core/registry";
import { rpc } from "@web/core/network/rpc";
import { user } from "@web/core/user";

/**
 * Aidoo service — thin client to the BFF controllers exposed by this module.
 * Caches the bootstrap and the "me" lookup so the systray dropdown opens fast.
 */
export const aidooService = {
    dependencies: [],

    async start(_env) {
        const state = {
            bootstrap: null,
            me: null,
            email: user.login || user.email || "",
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
