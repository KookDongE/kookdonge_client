import js from "@eslint/js"
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import globals from "globals"

const eslintConfig = [
  js.configs.recommended,
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/build/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/next-env.d.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
]

export default eslintConfig
