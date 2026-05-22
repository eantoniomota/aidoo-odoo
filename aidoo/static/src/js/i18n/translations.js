/** @odoo-module **/

// ``@web/session`` is available on every Odoo version we target (17 and 18),
// whereas ``@web/core/user`` was only added in Odoo 18 and would break the
// asset bundle on Odoo 17 — exactly the symptom we just hit.
import { session } from "@web/session";

/**
 * Embedded translations for the Aidoo OWL UI.
 *
 * Odoo's automatic .po → OWL pipeline is unreliable in some edge cases
 * (module installed before the language was activated, asset bundle
 * cache, etc.). To make sure the panel always shows in the user's
 * language, we ship the translations directly in the bundle and look
 * them up at runtime against ``user.lang``.
 *
 * The Python ``.po`` files in ``i18n/`` still drive the Settings page
 * and other Odoo-side strings — this dictionary only covers the OWL
 * components (systray, panels, tabs, helper views).
 */

const TRANSLATIONS = {
    fr_FR: {
        // Panel header & tabs
        "Loading…": "Chargement…",
        "Executions": "Exécutions",
        "Workflows": "Workflows",
        "Claude": "Claude",
        "Open Claude": "Ouvrir Claude",

        // No-token discovery view
        "Enable Aidoo on this Odoo": "Activer Aidoo sur cet Odoo",
        "Connect Odoo to Claude in 3 minutes. Already have an Aidoo account?":
            "Connectez Odoo à Claude en 3 minutes. Vous avez déjà un compte Aidoo ?",
        "Configure connection": "Configurer la connexion",
        "New here? Create your Aidoo account:": "Nouveau ? Créez votre compte Aidoo :",
        "Aidoo is not enabled yet": "Aidoo n'est pas encore activé",
        "Aidoo brings AI workflows and Claude inside Odoo. Ask your administrator to enable it on this database.":
            "Aidoo intègre les workflows IA et Claude dans Odoo. Demandez à votre administrateur de l'activer sur cette base.",
        "Or create your own Aidoo workspace:": "Ou créez votre propre espace Aidoo :",
        "Create your Aidoo account": "Créer mon compte Aidoo",

        // Invited view
        "You have been invited to Aidoo": "Vous avez été invité sur Aidoo",
        "Finish your sign-up to connect this email to Odoo.":
            "Terminez votre inscription pour connecter cet email à Odoo.",
        "Finish your sign-up on Aidoo to use this module.":
            "Terminez votre inscription sur Aidoo pour utiliser ce module.",
        "Create my Aidoo account": "Créer mon compte Aidoo",

        // No-claude view
        "Connect Aidoo to Claude": "Connecter Aidoo à Claude",
        "Your Aidoo workspace is ready. To start using AI workflows, add Aidoo as a custom connector in Claude with the details below.":
            "Votre espace Aidoo est prêt. Pour utiliser les workflows IA, ajoutez Aidoo comme connecteur personnalisé dans Claude avec les informations ci-dessous.",
        "In Claude, add a custom connector with:":
            "Dans Claude, ajoutez un connecteur personnalisé avec :",
        "Name": "Nom",
        "URL": "URL",
        "Copy": "Copier",
        "Copied to clipboard.": "Copié dans le presse-papiers.",
        "Open Claude connectors": "Ouvrir les connecteurs Claude",
        "Opening Claude…": "Ouverture de Claude…",
        "The MCP URL (https://mcp.aidoo.fr/mcp) will also be copied to your clipboard when you click the button above.":
            "L'URL MCP (https://mcp.aidoo.fr/mcp) sera également copiée dans votre presse-papiers lorsque vous cliquerez sur le bouton ci-dessus.",

        // Executions tab
        "Loading executions…": "Chargement des exécutions…",
        "No recent executions.": "Aucune exécution récente.",
        "Untitled": "Sans titre",

        // Workflows tab
        "Loading workflows…": "Chargement des workflows…",
        "Suggested for this record": "Suggérés pour cet enregistrement",
        "All workflows": "Tous les workflows",
        "No workflows available.": "Aucun workflow disponible.",

        // Workflow form
        "Run workflow": "Lancer le workflow",
        "Cancel": "Annuler",
        "Done": "Terminé",
        "Workflow accepted.": "Workflow accepté.",
        "Open Aidoo to see the live execution.":
            "Ouvrez Aidoo pour suivre l'exécution en direct.",
        "Workflow launched on Aidoo.": "Workflow lancé sur Aidoo.",

        // Claude tab
        "Add Aidoo as a custom connector in Claude so it can talk to your Odoo. Authentication is automatic (OAuth).":
            "Ajoutez Aidoo comme connecteur personnalisé dans Claude pour qu'il puisse communiquer avec votre Odoo. L'authentification se fait automatiquement (OAuth).",
        "Authentication opens an Aidoo login window — no API key to paste.":
            "L'authentification ouvre une fenêtre de connexion Aidoo — aucune clé API à coller.",
    },

    es_ES: {
        "Loading…": "Cargando…",
        "Executions": "Ejecuciones",
        "Workflows": "Flujos de trabajo",
        "Claude": "Claude",
        "Open Claude": "Abrir Claude",

        // No-token discovery
        "Enable Aidoo on this Odoo": "Active Aidoo en este Odoo",
        "Connect Odoo to Claude in 3 minutes. Already have an Aidoo account?":
            "Conecte Odoo a Claude en 3 minutos. ¿Ya tiene una cuenta Aidoo?",
        "Configure connection": "Configurar conexión",
        "New here? Create your Aidoo account:":
            "¿Nuevo? Cree su cuenta Aidoo:",
        "Aidoo is not enabled yet": "Aidoo aún no está activado",
        "Aidoo brings AI workflows and Claude inside Odoo. Ask your administrator to enable it on this database.":
            "Aidoo integra flujos de trabajo de IA y Claude en Odoo. Pida a su administrador que lo active en esta base de datos.",
        "Or create your own Aidoo workspace:":
            "O cree su propio espacio Aidoo:",
        "Create your Aidoo account": "Cree su cuenta Aidoo",

        "You have been invited to Aidoo": "Ha sido invitado a Aidoo",
        "Finish your sign-up to connect this email to Odoo.":
            "Complete su registro para conectar este correo a Odoo.",
        "Finish your sign-up on Aidoo to use this module.":
            "Complete su registro en Aidoo para usar este módulo.",
        "Create my Aidoo account": "Crear mi cuenta Aidoo",

        "Connect Aidoo to Claude": "Conectar Aidoo a Claude",
        "Your Aidoo workspace is ready. To start using AI workflows, add Aidoo as a custom connector in Claude with the details below.":
            "Su espacio Aidoo está listo. Para usar los flujos de trabajo de IA, añada Aidoo como conector personalizado en Claude con los detalles a continuación.",
        "In Claude, add a custom connector with:":
            "En Claude, añada un conector personalizado con:",
        "Name": "Nombre",
        "URL": "URL",
        "Copy": "Copiar",
        "Copied to clipboard.": "Copiado al portapapeles.",
        "Open Claude connectors": "Abrir conectores de Claude",
        "Opening Claude…": "Abriendo Claude…",
        "The MCP URL (https://mcp.aidoo.fr/mcp) will also be copied to your clipboard when you click the button above.":
            "La URL MCP (https://mcp.aidoo.fr/mcp) también se copiará a su portapapeles cuando haga clic en el botón anterior.",

        "Loading executions…": "Cargando ejecuciones…",
        "No recent executions.": "No hay ejecuciones recientes.",
        "Untitled": "Sin título",

        "Loading workflows…": "Cargando flujos de trabajo…",
        "Suggested for this record": "Sugeridos para este registro",
        "All workflows": "Todos los flujos de trabajo",
        "No workflows available.": "No hay flujos de trabajo disponibles.",

        "Run workflow": "Ejecutar flujo de trabajo",
        "Cancel": "Cancelar",
        "Done": "Hecho",
        "Workflow accepted.": "Flujo de trabajo aceptado.",
        "Open Aidoo to see the live execution.":
            "Abra Aidoo para ver la ejecución en directo.",
        "Workflow launched on Aidoo.": "Flujo de trabajo lanzado en Aidoo.",

        "Add Aidoo as a custom connector in Claude so it can talk to your Odoo. Authentication is automatic (OAuth).":
            "Añada Aidoo como conector personalizado en Claude para que pueda comunicarse con su Odoo. La autenticación es automática (OAuth).",
        "Authentication opens an Aidoo login window — no API key to paste.":
            "La autenticación abre una ventana de inicio de sesión de Aidoo — no hay que pegar ninguna clave API.",
    },
};

// Aliases for language variants we want to fall back to a base translation.
const LANG_ALIASES = {
    fr: "fr_FR",
    fr_BE: "fr_FR",
    fr_CA: "fr_FR",
    fr_CH: "fr_FR",
    fr_LU: "fr_FR",
    es: "es_ES",
    es_AR: "es_ES",
    es_BO: "es_ES",
    es_CL: "es_ES",
    es_CO: "es_ES",
    es_MX: "es_ES",
    es_VE: "es_ES",
};

function normalizeLang(raw) {
    if (!raw) return null;
    // Browsers often expose "fr-FR" while Odoo uses "fr_FR".
    const normalized = String(raw).replace("-", "_");
    if (TRANSLATIONS[normalized]) return normalized;
    if (LANG_ALIASES[normalized] && TRANSLATIONS[LANG_ALIASES[normalized]]) {
        return LANG_ALIASES[normalized];
    }
    // Last chance: try the 2-letter prefix (e.g. "fr-CA" → "fr" → "fr_FR")
    const prefix = normalized.split("_")[0];
    if (LANG_ALIASES[prefix] && TRANSLATIONS[LANG_ALIASES[prefix]]) {
        return LANG_ALIASES[prefix];
    }
    return null;
}

let _cachedLang = null;

function resolveLang() {
    if (_cachedLang) return _cachedLang;

    // Try several sources in order of authority. session.user_context.lang is
    // populated by Odoo at HTML render — it should be correct after a hard
    // refresh, but a partial reload can leave it stale, hence the fallbacks.
    const candidates = [
        session && session.user_context && session.user_context.lang,
        document.documentElement && document.documentElement.lang,
        document.documentElement &&
            document.documentElement.getAttribute("lang"),
        typeof navigator !== "undefined" && navigator.language,
    ];

    for (const raw of candidates) {
        const matched = normalizeLang(raw);
        if (matched) {
            _cachedLang = matched;
            // eslint-disable-next-line no-console
            console.debug(
                `[aidoo] using language "${matched}" (from "${raw}")`
            );
            return matched;
        }
    }

    _cachedLang = "en_US";
    // eslint-disable-next-line no-console
    console.debug(
        "[aidoo] no matching translation language, falling back to en_US",
        { candidates }
    );
    return _cachedLang;
}

/**
 * Translate ``key`` to the current Odoo user's language.
 * Falls back to the English source string when there is no entry.
 */
export function t(key) {
    const lang = resolveLang();
    const dict = TRANSLATIONS[lang];
    if (!dict) return key;
    return dict[key] || key;
}
