import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = defineConfig([
    ...nextVitals,
    globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
    {
        rules: {
            "react-hooks/set-state-in-effect": "off",
            "react-hooks/error-boundaries": "off",
        },
    },
]);

export default eslintConfig;
