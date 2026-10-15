import js from "@eslint/js";
import globals from "globals";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            },
            ecmaVersion: "latest",
            sourceType: "module"
        },
        rules: {
            // Personaliza tus reglas si querés
            "no-unused-vars": "warn",
            "no-console": "off"
        }
    }
];