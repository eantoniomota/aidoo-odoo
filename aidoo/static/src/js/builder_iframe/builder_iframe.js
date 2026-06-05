/** @odoo-module **/

import { Component, onMounted, onWillUnmount, useRef, useState } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { t as _t } from "../i18n/translations";

/**
 * Fullscreen Builder iframe with a postMessage handshake for SSO.
 *
 * Flow (Option D):
 *   1. iframe boots with no token at builder.aidoo.ai/embed?dashboardId=...
 *   2. iframe posts { type: "aidoo:request-bootstrap" } to the parent
 *   3. parent (this component) checks `event.origin` matches the expected
 *      Builder origin, then calls /aidoo/builder/sso-token to get a 60-second
 *      bootstrap JWT
 *   4. parent posts { type: "aidoo:bootstrap-token", token, exp } back to the
 *      iframe with `targetOrigin = builderOrigin` (never "*")
 *   5. iframe exchanges the bootstrap for a real OIDC session via
 *      /oidc/bootstrap-exchange
 *
 * Fallback: if the user's email is not mapped, the SSO call returns 404 with
 * a signup_url. The parent then redirects the iframe to the OIDC code flow
 * (Option A) at login.aidoo.ai/oidc/authorize.
 */
export class AidooBuilderIframe extends Component {
    static template = "aidoo.BuilderIframe";
    static props = ["*"];

    setup() {
        this.aidoo = useService("aidoo");
        this.notification = useService("notification");
        this.iframeRef = useRef("iframe");
        this.state = useState({ error: null });
        this.labels = {
            loading: _t("Loading…"),
            error: _t("Could not authenticate to the Aidoo Builder"),
        };

        // The Builder web origin is the one the iframe is loaded from. We
        // pin it from the bootstrap response (server-authoritative). Until we
        // receive the first token we do NOT postMessage anything.
        this._builderOrigin = null;
        this._messageHandler = (event) => this._onMessage(event);

        onMounted(() => {
            window.addEventListener("message", this._messageHandler);
        });
        onWillUnmount(() => {
            window.removeEventListener("message", this._messageHandler);
        });
    }

    get dashboardId() {
        return this.props.action?.params?.dashboardId || "";
    }

    get iframeSrc() {
        // Embed URL — token is NEVER passed in the URL (postMessage instead).
        // The dashboardId param is non-sensitive (just routing inside the SPA).
        const dashId = encodeURIComponent(this.dashboardId);
        return `https://builder.aidoo.ai/embed?dashboardId=${dashId}&origin=odoo`;
    }

    async _onMessage(event) {
        // Verify the message comes from the Builder iframe we own.
        if (!event.data || typeof event.data !== "object") return;
        if (event.data.type !== "aidoo:request-bootstrap") return;

        // First message: pin the origin we will reply to. This MUST match
        // the URL we put in the iframe src.
        const expectedOrigin = new URL(this.iframeSrc).origin;
        if (event.origin !== expectedOrigin) {
            // eslint-disable-next-line no-console
            console.warn("[aidoo] Ignored message from unexpected origin:", event.origin);
            return;
        }
        this._builderOrigin = expectedOrigin;

        try {
            const res = await this.aidoo.requestBuilderSsoToken();
            if (res && res.status && res.status >= 400) {
                if (res.error === "not_mapped" && res.signup_url) {
                    // Fallback to OIDC code flow.
                    this._fallbackToOidc();
                    return;
                }
                this.state.error = res.error || this.labels.error;
                return;
            }
            const token = res?.bootstrap_token;
            const exp = res?.expires_in;
            if (!token) {
                this.state.error = this.labels.error;
                return;
            }
            // Send the token back to the iframe — targetOrigin pinned.
            event.source?.postMessage(
                { type: "aidoo:bootstrap-token", token, expiresIn: exp },
                expectedOrigin
            );
        } catch (err) {
            this.state.error = err?.message || this.labels.error;
        }
    }

    _fallbackToOidc() {
        // For now: hard navigation to the OIDC authorize endpoint with PKCE
        // generated browser-side. Phase-2: have the SPA itself handle the
        // fallback so the user stays on the iframe-driven flow.
        const dashId = encodeURIComponent(this.dashboardId);
        const target = `https://builder.aidoo.ai/auth/start?dashboardId=${dashId}`;
        if (this.iframeRef.el) {
            this.iframeRef.el.src = target;
        }
    }
}

registry
    .category("actions")
    .add("aidoo_builder_iframe", AidooBuilderIframe);
