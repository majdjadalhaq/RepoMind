import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    // Ignore build artifacts and tooling directories.
    ignores: [".next/", "node_modules/", "*.js"]
  },
  {
    // Temporary ignore for legacy files pending deletion in Phase 2.
    // Tracked in: chore/delete-legacy-infra (PR #7), refactor/decompose-app (PR #9-12)
    ignores: [
      "src/infrastructure/llmFactory.ts",
      "src/infrastructure/githubService.ts",
      "src/infrastructure/keyVerification.ts",
      "src/core/utils.ts",
      "src/App.tsx",
      "src/components/ChatArea.tsx",
    ]
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@next/next": nextPlugin,
    },
    rules: {
      "no-console": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
];

