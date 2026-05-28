/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { AidooPanel } from "../panel/aidoo_panel";

export class AidooSystray extends Component {
    static template = "aidoo.Systray";
    static components = { AidooPanel };
    static props = {};

    setup() {
        this.aidoo = useService("aidoo");
        this.state = useState({
            visible: false,
            loading: true,
        });

        onWillStart(async () => {
            try {
                // eslint-disable-next-line no-console
                console.info("[Aidoo] systray setup — calling bootstrap…");
                const boot = await this.aidoo.bootstrap();
                // eslint-disable-next-line no-console
                console.info("[Aidoo] systray bootstrap =", boot);
                if (!boot) {
                    this.state.visible = false;
                    return;
                }
                if (!boot.configured) {
                    // No Aidoo token on this Odoo: show the icon to *everyone*
                    // as a discovery hook. The panel will pitch them an account.
                    this.state.visible = true;
                    return;
                }
                // Token is configured: keep the existing scoping — hide the
                // icon when the current Odoo user is not a member of the
                // linked Aidoo workspace (state === "none").
                const me = await this.aidoo.me();
                // eslint-disable-next-line no-console
                console.info("[Aidoo] systray me =", me);
                if (me && (me.cloudflare_error || me.status >= 400 || me.error)) {
                    // Upstream is reachable from the user but the Odoo server
                    // call to api.aidoo.ai failed (Cloudflare WAF, network
                    // outage, etc.). Keep the icon visible — the panel will
                    // surface the error so the admin can act on it instead
                    // of silently hiding the integration.
                    this.state.visible = true;
                    return;
                }
                this.state.visible = Boolean(me && me.state && me.state !== "none");
            } catch (err) {
                // eslint-disable-next-line no-console
                console.error("[Aidoo] systray setup failed", err);
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
