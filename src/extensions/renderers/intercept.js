module.exports = targets => {
    const { specialFeatures } = targets.of('@magento/pwa-buildpack');
    specialFeatures.tap(flags => {
        flags[targets.name] = {
            esModules: true,
            cssModules: true,
            graphqlQueries: true
        };
    });

    targets
        .of('@magento/venia-ui')
        .richContentRenderers.tap(richContentRenderers => {
            richContentRenderers.add({
                componentName: 'FooterComponent',
                importPath: require.resolve('./src/components/Footer')
            });

            richContentRenderers.add({
                componentName: 'ContactComponent',
                importPath: require.resolve('./src/components/Contact')
            });
        });
};
