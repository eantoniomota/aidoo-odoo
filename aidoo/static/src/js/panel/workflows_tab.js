/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { t as _t } from "../i18n/translations";
import { WorkflowForm } from "./workflow_form";

export class WorkflowsTab extends Component {
    static template = "aidoo.WorkflowsTab";
    static components = { WorkflowForm };
    static props = {
        context: { type: Object, optional: true },
    };

    setup() {
        this.aidoo = useService("aidoo");
        this.state = useState({
            loading: true,
            workflows: [],
            selectedId: null,
            error: null,
        });
        this.labels = {
            loading: _t("Loading workflows…"),
            suggested: _t("Suggested for this record"),
            allWorkflows: _t("All workflows"),
            empty: _t("No workflows available."),
        };

        onWillStart(async () => {
            await this.refresh();
        });
    }

    async refresh() {
        this.state.loading = true;
        try {
            const params = {};
            if (this.props.context?.model) params.model = this.props.context.model;
            const data = await this.aidoo.listWorkflows(params);
            if (data?.error) {
                this.state.error = data.error;
            } else {
                this.state.workflows = data?.workflows || [];
                this.state.error = null;
            }
        } catch (err) {
            this.state.error = String(err?.message || err);
        } finally {
            this.state.loading = false;
        }
    }

    select(id) {
        this.state.selectedId = id;
    }

    closeForm() {
        this.state.selectedId = null;
    }

    get selectedWorkflow() {
        return this.state.workflows.find((w) => w.id === this.state.selectedId) || null;
    }

    get compatible() {
        return this.state.workflows.filter((w) => w.compatible);
    }

    get others() {
        return this.state.workflows.filter((w) => !w.compatible);
    }
}
