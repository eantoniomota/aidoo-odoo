/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { t as _t } from "../i18n/translations";

export class BuilderTab extends Component {
    static template = "aidoo.BuilderTab";
    static props = {};

    setup() {
        this.aidoo = useService("aidoo");
        this.action = useService("action");
        this.notification = useService("notification");
        this.state = useState({
            loading: true,
            dashboards: [],
            error: null,
            signupUrl: null,
        });
        this.labels = {
            empty: _t("No dashboards yet. Create one in the Aidoo Builder."),
            errorTitle: _t("Could not load dashboards"),
            openBuilder: _t("Open Builder"),
            notMappedTitle: _t("Your Odoo email is not linked to an Aidoo member"),
            notMappedHint: _t("Sign up or invite this email on Aidoo to enable seamless SSO."),
            openSignup: _t("Open Aidoo"),
            pagesPrefix: _t("Pages"),
            openDashboard: _t("Open"),
        };

        onWillStart(() => this._reload());
    }

    async _reload() {
        this.state.loading = true;
        this.state.error = null;
        this.state.signupUrl = null;
        try {
            const res = await this.aidoo.listBuilderDashboards();
            if (res && res.status && res.status >= 400) {
                if (res.error === "not_mapped" && res.signup_url) {
                    this.state.signupUrl = res.signup_url;
                } else {
                    this.state.error = res.error || _t("Server error");
                }
                this.state.dashboards = [];
            } else {
                this.state.dashboards = res?.dashboards || [];
            }
        } catch (err) {
            this.state.error = (err && err.message) || _t("Network error");
        } finally {
            this.state.loading = false;
        }
    }

    openDashboard(dashboard) {
        // Open a client action that renders the Builder iframe fullscreen.
        // The iframe asks for a bootstrap token via postMessage; the action
        // resolves it once and posts it back, then the iframe exchanges it
        // for a real OIDC session.
        this.action.doAction({
            type: "ir.actions.client",
            tag: "aidoo_builder_iframe",
            name: dashboard.name || _t("Aidoo Builder"),
            target: "fullscreen",
            params: {
                dashboardId: dashboard.id,
                dashboardName: dashboard.name,
            },
        });
    }

    openSignup() {
        window.open(this.state.signupUrl, "_blank", "noopener");
    }
}
