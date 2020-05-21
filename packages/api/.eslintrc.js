module.exports = {
  env: {
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: ["formidable/configurations/es6-node", "prettier"],
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    strict: ["error", "global"],
  },
  overrides: [
    {
      files: ["src/**/*.test.js"],
      extends: ["plugin:jest/recommended"],
      env: {
        "jest/globals": true,
      },
    },
  ],
};
