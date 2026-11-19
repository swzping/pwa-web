module.exports = {
    addImgOptMiddleware: require('@magento/pwa-buildpack/lib/Utilities/addImgOptMiddleware'),
    configureHost: require('@magento/pwa-buildpack/lib/Utilities/configureHost'),
    createDotEnvFile: require('@magento/pwa-buildpack/lib/Utilities/createDotEnvFile'),
    createProject: require('@magento/pwa-buildpack/lib/Utilities/createProject'),
    graphQL: require('./graphQL'),
    loadEnvironment: require('@magento/pwa-buildpack/lib/Utilities/loadEnvironment')
};
