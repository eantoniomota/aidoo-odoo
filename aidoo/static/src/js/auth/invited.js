/** @odoo-module **/

import { Component } from "@odoo/owl";

export class AidooInvited extends Component {
    static template = "aidoo.Invited";
    static props = {
        email: { type: String, optional: true },
        signupUrl: { type: String, optional: true },
    };
}
