/**
 * @module Buildpack
 */
const Utilities = require('./Utilities');
const WebpackTools = require('@magento/pwa-buildpack/lib/WebpackTools');
const TestHelpers = require('@magento/pwa-buildpack/lib/TestHelpers');
module.exports = {
    ...TestHelpers,
    ...Utilities,
    ...WebpackTools,
    TestHelpers,
    Utilities,
    WebpackTools
};
