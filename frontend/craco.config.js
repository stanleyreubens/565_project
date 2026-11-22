const path = require('path');

module.exports = {
  webpack: {
    alias: {
      'ajv': path.resolve(__dirname, 'node_modules/ajv'),
      'ajv/dist/compile/codegen': path.resolve(__dirname, 'node_modules/ajv/dist/compile/codegen'),
    },
    configure: (webpackConfig) => {
      // Fix for ajv-keywords requiring ajv@8
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'ajv': path.resolve(__dirname, 'node_modules/ajv'),
      };
      return webpackConfig;
    },
  },
};
