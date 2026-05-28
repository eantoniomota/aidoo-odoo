/** @odoo-module **/

import { registry } from "@web/core/registry";
import { session } from "@web/session";

/**
 * Aidoo service — thin client to the BFF controllers exposed by this module.
 * Caches the bootstrap and the "me" lookup so the systray dropdown opens fast.
 *
 * Note (Odoo 17): the standalone ``@web/core/network/rpc`` module does not
 * exist on this branch, so we cannot import ``rpc`` directly. Instead we
 * declare ``rpc`` as a dependency and receive it through ``start(env, deps)``
 * — that pattern works on both 17 and 18+.
 *
 * Note (Odoo 17): the ``user`` service was only introduced in Odoo 18. On 17
 * we rely on the global ``@web/session`` object instead — it carries the same
 * ``username``/``partner_display_name`` info and works on every targeted
 * version.
 */
export const aidooService = {
    dependencies: ["rpc"],

    async start(env, { rpc }) {
        // Visible boot marker — if this never logs, the service did not
        // start (missing dep, asset bundle issue, …) and the systray will
        // stay invisible.
        // eslint-disable-next-line no-console
        console.info("[Aidoo] service starting…");
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
