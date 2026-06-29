module.exports = {
  root: true,
  env: { es6: true, node: true },
  ignorePatterns: ['.eslintrc.js', '**/*.js', 'node_modules/**', 'dist/**'],
  overrides: [
    {
      files: ['package.json'],
      plugins: ['eslint-plugin-n8n-nodes-base'],
      extends: ['plugin:n8n-nodes-base/community'],
      parser: 'jsonc-eslint-parser',
    },
    {
      files: ['./credentials/**/*.ts'],
      plugins: ['eslint-plugin-n8n-nodes-base'],
      extends: ['plugin:n8n-nodes-base/credentials'],
      parser: '@typescript-eslint/parser',
      parserOptions: { project: ['./tsconfig.json'], sourceType: 'module' },
      rules: {
        // Main-repo-only rule: it expects documentationUrl to be a camelCased
        // slug, which conflicts with the community-node rule that (correctly)
        // requires a full HTTP URL. Disable it for community packages.
        'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
      },
    },
    {
      files: ['./nodes/**/*.ts'],
      plugins: ['eslint-plugin-n8n-nodes-base'],
      extends: ['plugin:n8n-nodes-base/nodes'],
      parser: '@typescript-eslint/parser',
      parserOptions: { project: ['./tsconfig.json'], sourceType: 'module' },
    },
  ],
};
