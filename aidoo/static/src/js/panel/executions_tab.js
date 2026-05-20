/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { _t } from "@web/core/l10n/translation";

export class ExecutionsTab extends Component {
    static template = "aidoo.ExecutionsTab";
    static props = {
        context: { type: Object, optional: true },
    };

    setup() {
        this.aidoo = useService("aidoo");
        this.state = useState({
            loading: true,
            executions: [],
            error: null,
        });
        this.labels = {
            loading: _t("Loading executions…"),
            empty: _t("No recent executions."),
            untitled: _t("Untitled"),
        };

        onWillStart(async () => {
            try {
                const params = { limit: 15 };
                if (this.props.context?.model) params.model = this.props.context.model;
                if (this.props.context?.resId) params.res_id = this.props.context.resId;
                const data = await this.aidoo.listExecutions(params);
                if (data?.error) {
                    this.state.error = data.error;
                } else {
                    this.state.executions = data?.executions || [];
                }
            } catch (err) {
                this.state.error = String(err?.message || err);
            } finally {
                this.state.loading = false;
            }
        });
    }

    formatDate(iso) {
        if (!iso) return "";
        return new Date(iso).toLocaleString();
    }

    isContextual(exec) {
        const { model, resId } = this.props.context || {};
        if (!model || !resId) return false;
        return (exec.tags || []).includes(`model:${model}`) && (exec.tags || []).includes(`res_id:${resId}`);
    }
}
