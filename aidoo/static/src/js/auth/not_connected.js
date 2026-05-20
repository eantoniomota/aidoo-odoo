/** @odoo-module **/

import { Component } from "@odoo/owl";

export class AidooNotConnected extends Component {
    static template = "aidoo.NotConnected";
    static props = { email: { type: String, optional: true } };
}
