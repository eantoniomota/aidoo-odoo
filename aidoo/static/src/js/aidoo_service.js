/** @odoo-module **/

import { registry } from "@web/core/registry";

/**
 * Aidoo service — thin client to the BFF controllers exposed by this module.
 * Caches the bootstrap and the "me" lookup so the systray dropdown opens fast.
 *
 * Note (Odoo 17): the standalone ``@web/core/network/rpc`` module does not
 * exist on this branch, so we cannot import ``rpc`` directly. Instead we
 * declare ``rpc`` as a dependency and receive it through ``start(env, deps)``
 * — that pattern works on both 17 and 18+.
 */
export const aidooService = {
    dependencies: ["user", "rpc"],

    async start(env, { user, rpc }) {
        const state = {
            bootstrap: null,
            me: null,
            email: user.email || user.login || "",
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
