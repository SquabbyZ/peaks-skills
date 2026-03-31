const prettierConfig = require('./.prettierrc.json');
const { plugins, ...prettierOptions } = prettierConfig;

module.exports = {
  extends: [
    require.resolve('@umijs/lint/dist/config/eslint'),
    'plugin:prettier/recommended',
  ],
  rules: {
    'prettier/prettier': ['error', prettierOptions],
  },
};
