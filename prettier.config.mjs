/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
  semi: false,
  singleQuote: false,
  trailingComma: "es5",
  tabWidth: 2,
  printWidth: 120,

  plugins: ["@ianvs/prettier-plugin-sort-imports", "prettier-plugin-tailwindcss"],

  importOrder: [
    "",
    "<BUILTIN_MODULES>",
    "",
    "<THIRD_PARTY_MODULES>",
    "",
    "^@/app/(.*)$",
    "^@/entities/(.*)$",
    "^@/shared/(.*)$",
    "^@/widgets/(.*)$",
    "",
    "^[./]",
  ],
  importOrderCaseSensitive: false,
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],

  tailwindFunctions: ["clsx", "cn", "cva"],
  tailwindAttributes: ["class", "className"],

  overrides: [
    {
      files: ["*.json", "*.jsonc"],
      options: {
        parser: "json",
        trailingComma: "none",
      },
    },
  ],
}

export default config
