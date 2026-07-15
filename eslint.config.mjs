import js               from "@eslint/js";
import globals          from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig ([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals:
      {
        ... globals .browser,
        ... globals .node,
      }
    },
    rules: {
      "no-async-promise-executor": "off",
      "no-empty": ["error", { "allowEmptyCatch": true }],
      "semi": "error",
    },
  },
  {
    files: ["**/*.js"],
    languageOptions:
    {
      sourceType: "commonjs",
    }
  },
]);
