/** @odoo-module **/

import { Component } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { t as _t } from "../i18n/translations";

export class AidooNoToken extends Component {
    static template = "aidoo.NoToken";
    static props = {
        isAdmin: { type: Boolean, optional: true },
        signupUrl: { type: String, optional: true },
    };

    setup() {
        this.action = useService("action");
        this.labels = {
            // Admin path
            adminTitle: _t("Enable Aidoo on this Odoo"),
            adminIntro: _t("Connect Odoo to Claude in 3 minutes. Already have an Aidoo account?"),
            configureBtn: _t("Configure connection"),
            adminSplit: _t("New here? Create your Aidoo account:"),
            // User path
            userTitle: _t("Aidoo is not enabled yet"),
            userIntro: _t("Aidoo brings AI workflows and Claude inside Odoo. Ask your administrator to enable it on this database."),
            userOrCreate: _t("Or create your own Aidoo workspace:"),
            // Shared CTA
            createCta: _t("Create your Aidoo account"),
        };
    }

    get signupUrl() {
        return this.props.signupUrl || "https://app.aidoo.fr/register";
    }

    async openSettings() {
        // Open the Aidoo section of the general settings.
        await this.action.doAction({
            type: "ir.actions.act_window",
            res_model: "res.config.settings",
            view_mode: "form",
            target: "inline",
            context: { module: "aidoo" },
        });
    }
}
