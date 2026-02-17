import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import tsdoc from "eslint-plugin-tsdoc";
import unicorn from "eslint-plugin-unicorn";
import unusedImports from "eslint-plugin-unused-imports";
import vitest from "eslint-plugin-vitest";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.swc/**",
      "**/bin/**",
    ],
  },
  {
    files: ["**/*.ts"],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        global: "readonly",
        module: "readonly",
        require: "readonly",
      },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      unicorn,
      tsdoc,
      "unused-imports": unusedImports,
    },
    rules: {
      // ========================================
      // @typescript-eslint - Type Safety
      // ========================================
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports" },
      ],
      "@typescript-eslint/consistent-type-exports": [
        "error",
        { fixMixedExportsWithInlineTypeSpecifier: false },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { allowDefaultCaseForExhaustiveSwitch: true },
      ],
      "@typescript-eslint/restrict-template-expressions": "error",

      // ========================================
      // @typescript-eslint - Code Style
      // ========================================
      "@typescript-eslint/no-namespace": "error",
      "@typescript-eslint/no-empty-interface": "error",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-confusing-void-expression": "error",
      "@typescript-eslint/no-unnecessary-condition": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/no-inferrable-types": "error",
      "@typescript-eslint/promise-function-async": "error",
      "@typescript-eslint/no-redundant-type-constituents": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-unnecessary-type-arguments": "error",
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
      "@typescript-eslint/prefer-return-this-type": "error",
      "@typescript-eslint/no-duplicate-enum-values": "error",
      "@typescript-eslint/prefer-enum-initializers": "error",
      "@typescript-eslint/method-signature-style": ["error", "property"],
      "@typescript-eslint/array-type": ["error", { default: "generic" }],
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/no-unnecessary-template-expression": "error",

      // ========================================
      // @typescript-eslint - Naming Convention
      // ========================================
      "@typescript-eslint/naming-convention": [
        "error",
        // Variables: camelCase or UPPER_CASE
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
          leadingUnderscore: "allow",
        },
        // Types/Interfaces: PascalCase (no I prefix)
        {
          selector: "typeLike",
          format: ["PascalCase"],
          custom: { regex: "^I[A-Z]", match: false },
        },
        // Booleans: require is/has/can/should prefix
        {
          selector: "variable",
          types: ["boolean"],
          format: ["PascalCase"],
          prefix: ["is", "has", "can", "should", "will", "did"],
        },
        // Enum members: UPPER_CASE
        {
          selector: "enumMember",
          format: ["UPPER_CASE"],
        },
        // Parameters: camelCase
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        // Generics: Single letter (T, K, V)
        {
          selector: "typeParameter",
          format: ["PascalCase"],
          custom: { regex: "^[A-Z]$", match: true },
        },
      ],

      // ========================================
      // eslint-plugin-unicorn
      // ========================================
      "unicorn/better-regex": "error",
      "unicorn/catch-error-name": "error",
      "unicorn/consistent-destructuring": "error",
      "unicorn/consistent-function-scoping": "error",
      "unicorn/custom-error-definition": "error",
      "unicorn/empty-brace-spaces": "error",
      "unicorn/error-message": "error",
      "unicorn/escape-case": "error",
      "unicorn/explicit-length-check": "error",
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
      "unicorn/new-for-builtins": "error",
      "unicorn/no-abusive-eslint-disable": "error",
      "unicorn/no-array-callback-reference": "error",
      "unicorn/no-array-for-each": "error",
      "unicorn/no-array-method-this-argument": "error",
      "unicorn/no-array-push-push": "error",
      "unicorn/no-await-expression-member": "error",
      "unicorn/no-await-in-promise-methods": "error",
      "unicorn/no-console-spaces": "error",
      "unicorn/no-empty-file": "error",
      "unicorn/no-for-loop": "error",
      "unicorn/no-hex-escape": "error",
      "unicorn/no-instanceof-array": "error",
      "unicorn/no-invalid-fetch-options": "error",
      "unicorn/no-invalid-remove-event-listener": "error",
      "unicorn/no-keyword-prefix": "error",
      "unicorn/no-length-as-slice-end": "error",
      "unicorn/no-lonely-if": "error",
      "unicorn/no-magic-array-flat-depth": "error",
      "unicorn/no-negated-condition": "error",
      "unicorn/no-negation-in-equality-check": "error",
      "unicorn/no-nested-ternary": "error",
      "unicorn/no-new-array": "error",
      "unicorn/no-new-buffer": "error",
      "unicorn/no-null": "off", // Allow null in CLI code
      "unicorn/no-object-as-default-parameter": "error",
      "unicorn/no-static-only-class": "error",
      "unicorn/no-thenable": "error",
      "unicorn/no-this-assignment": "error",
      "unicorn/no-typeof-undefined": "error",
      "unicorn/no-unnecessary-await": "error",
      "unicorn/no-unreadable-array-destructuring": "error",
      "unicorn/no-unreadable-iife": "error",
      "unicorn/no-unused-properties": "error",
      "unicorn/no-useless-fallback-in-spread": "error",
      "unicorn/no-useless-length-check": "error",
      "unicorn/no-useless-promise-resolve-reject": "error",
      "unicorn/no-useless-spread": "error",
      "unicorn/no-useless-switch-case": "error",
      "unicorn/no-useless-undefined": "error",
      "unicorn/no-zero-fractions": "error",
      "unicorn/number-literal-case": "error",
      "unicorn/numeric-separators-style": "error",
      "unicorn/prefer-array-find": "error",
      "unicorn/prefer-array-flat": "error",
      "unicorn/prefer-array-flat-map": "error",
      "unicorn/prefer-array-index-of": "error",
      "unicorn/prefer-array-some": "error",
      "unicorn/prefer-at": "error",
      "unicorn/prefer-code-point": "error",
      "unicorn/prefer-date-now": "error",
      "unicorn/prefer-default-parameters": "error",
      "unicorn/prefer-export-from": "error",
      "unicorn/prefer-includes": "error",
      "unicorn/prefer-logical-operator-over-ternary": "error",
      "unicorn/prefer-math-min-max": "error",
      "unicorn/prefer-math-trunc": "error",
      "unicorn/prefer-modern-math-apis": "error",
      "unicorn/prefer-module": "error",
      "unicorn/prefer-native-coercion-functions": "error",
      "unicorn/prefer-negative-index": "error",
      "unicorn/prefer-node-protocol": "error",
      "unicorn/prefer-number-properties": "error",
      "unicorn/prefer-object-from-entries": "error",
      "unicorn/prefer-optional-catch-binding": "error",
      "unicorn/prefer-prototype-methods": "error",
      "unicorn/prefer-reflect-apply": "error",
      "unicorn/prefer-regexp-test": "error",
      "unicorn/prefer-set-has": "error",
      "unicorn/prefer-set-size": "error",
      "unicorn/prefer-spread": "error",
      "unicorn/prefer-string-raw": "error",
      "unicorn/prefer-string-replace-all": "error",
      "unicorn/prefer-string-slice": "error",
      "unicorn/prefer-string-starts-ends-with": "error",
      "unicorn/prefer-string-trim-start-end": "error",
      "unicorn/prefer-structured-clone": "error",
      "unicorn/prefer-switch": "error",
      "unicorn/prefer-ternary": "error",
      "unicorn/prefer-top-level-await": "error",
      "unicorn/prefer-type-error": "error",
      "unicorn/prevent-abbreviations": "off", // Allow CLI abbreviations
      "unicorn/relative-url-style": "error",
      "unicorn/require-array-join-separator": "error",
      "unicorn/require-number-to-fixed-digits-argument": "error",
      "unicorn/string-content": "off",
      "unicorn/switch-case-braces": "error",
      "unicorn/template-indent": "error",
      "unicorn/text-encoding-identifier-case": "error",
      "unicorn/throw-new-error": "error",
      // CLI-specific overrides
      "unicorn/no-process-exit": "off", // CLI tools need process.exit

      // ========================================
      // eslint-plugin-tsdoc
      // ========================================
      "tsdoc/syntax": "warn",

      // ========================================
      // Unused imports cleanup
      // ========================================
      "unused-imports/no-unused-imports": "error",

      // ========================================
      // General rules
      // ========================================
      "no-console": "off", // CLI needs console output
    },
  },

  // ========================================
  // Vitest test files config
  // ========================================
  {
    files: ["src/**/__test__/*.test.ts"],
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
      // Relaxed rules for tests
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "unicorn/no-null": "off",
      "unicorn/consistent-function-scoping": "off",
      // Vitest specific
      "vitest/expect-expect": "error",
      "vitest/no-disabled-tests": "warn",
      "vitest/no-focused-tests": "error",
      "vitest/no-identical-title": "error",
      "vitest/prefer-to-be": "error",
      "vitest/prefer-to-have-length": "error",
      "vitest/valid-expect": "error",
    },
  },

  // Prettier must be last
  prettier,
);
