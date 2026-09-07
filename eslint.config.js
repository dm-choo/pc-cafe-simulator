import js from "@eslint/js";
import ts from "typescript-eslint";
export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["src/sim/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            "three",
            "three/*",
            "react",
            "react-dom",
            "../runtime/*",
            "../render/*",
            "../ui/*",
          ],
        },
      ],
      "no-restricted-globals": ["error", "window", "document", "performance"],
      "no-restricted-properties": [
        "error",
        { object: "Math", property: "random" },
        { object: "Date", property: "now" },
      ],
    },
  },
);
