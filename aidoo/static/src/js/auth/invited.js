/** @odoo-module **/

import { Component } from "@odoo/owl";
import { _t } from "@web/core/l10n/translation";

export class AidooInvited extends Component {
    static template = "aidoo.Invited";
    static props = {
        email: { type: String, optional: true },
        signupUrl: { type: String, optional: true },
    };

    setup() {
        this.labels = {
            title: _t("You have been invited to Aidoo"),
            cta: _t("Create my Aidoo account"),
            withEmail: _t("Finish your sign-up to connect this email to Odoo."),
            withoutEmail: _t("Finish your sign-up on Aidoo to use this module."),
        };
    }

    get signupUrl() {
        return this.props.signupUrl || "https://app.aidoo.fr/register";
    }
}
