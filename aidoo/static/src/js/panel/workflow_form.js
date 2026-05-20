/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";

/**
 * Dynamic form generated from a workflow's JSON Schema.
 * Variables matching the active record (active_model/active_id) are pre-filled
 * when the property type matches.
 */
export class WorkflowForm extends Component {
    static template = "aidoo.WorkflowForm";
    static props = {
        workflow: { type: Object },
        context: { type: Object, optional: true },
        onClose: { type: Function },
    };

    setup() {
        this.aidoo = useService("aidoo");
        this.notification = useService("notification");
        this.state = useState({
            loading: true,
            schema: null,
            values: {},
            running: false,
            result: null,
            error: null,
        });

        onWillStart(async () => {
            try {
                const data = await this.aidoo.getWorkflowSchema(this.props.workflow.id);
                if (data?.error) {
                    this.state.error = data.error;
                    return;
                }
                this.state.schema = data;
                this.state.values = this.buildInitialValues(data);
            } catch (err) {
                this.state.error = String(err?.message || err);
            } finally {
                this.state.loading = false;
            }
        });
    }

    buildInitialValues(schema) {
        const initial = {};
        const props = schema?.schema?.properties || {};
        const ctx = this.props.context || {};

        for (const [key, def] of Object.entries(props)) {
            if (def.default !== undefined) {
                initial[key] = def.default;
            } else {
                initial[key] = def.type === "boolean" ? false : "";
            }
        }

        // Heuristic pre-fill: when the workflow targets the current active model
        // and the variable name suggests an id field, inject active_id.
        if (this.props.workflow?.compatible && ctx.resId) {
            for (const [key, def] of Object.entries(props)) {
                if (def.type === "number" && /(_id|^id$|record_id|res_id)/i.test(key)) {
                    if (!initial[key]) initial[key] = ctx.resId;
                }
            }
        }
        return initial;
    }

    onChange(key, ev) {
        const target = ev.target;
        if (target.type === "checkbox") {
            this.state.values[key] = target.checked;
        } else if (target.type === "number") {
            const v = target.value;
            this.state.values[key] = v === "" ? "" : Number(v);
        } else {
            this.state.values[key] = target.value;
        }
    }

    propertyEntries() {
        const props = this.state.schema?.schema?.properties || {};
        const required = new Set(this.state.schema?.schema?.required || []);
        return Object.entries(props).map(([key, def]) => ({
            key,
            def,
            required: required.has(key),
        }));
    }

    async submit(ev) {
        ev.preventDefault();
        this.state.running = true;
        this.state.result = null;
        this.state.error = null;
        try {
            const data = await this.aidoo.runWorkflow(this.props.workflow.id, this.state.values);
            if (data?.error) {
                this.state.error = data.error;
            } else {
                this.state.result = data;
                this.notification.add("Workflow launched on Aidoo.", { type: "success" });
            }
        } catch (err) {
            this.state.error = String(err?.message || err);
        } finally {
            this.state.running = false;
        }
    }
}
