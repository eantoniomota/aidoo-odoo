/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";
import { AidooPanel } from "../panel/aidoo_panel";

export class AidooSystray extends Component {
    static template = "aidoo.Systray";
    static components = { Dropdown, DropdownItem, AidooPanel };
    static props = {};

    setup() {
        this.aidoo = useService("aidoo");
        this.state = useState({
            visible: false,
            configured: false,
            loading: true,
        });

        onWillStart(async () => {
            try {
                const boot = await this.aidoo.bootstrap();
                this.state.configured = Boolean(boot && boot.configured);
                this.state.visible = this.state.configured;
            } catch (_err) {
                this.state.visible = false;
            } finally {
                this.state.loading = false;
            }
        });
    }
}

export const systrayItem = {
    Component: AidooSystray,
};

registry.category("systray").add("aidoo.systray", systrayItem, { sequence: 80 });
