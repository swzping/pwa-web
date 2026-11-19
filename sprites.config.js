//webpack.config.js
var path = require('path');
const version = '1.0.9';
var SpritesmithPlugin = require('webpack-spritesmith');

module.exports = {
    mode: 'production',
    entry: './venia-static-assets/index.js',
    module: {
        rules: [
            {test: /\.css$/, use: [
                'style-loader',
                'css-loader',
                'stylus-loader'
            ]},
            {test: /\.png$/, use: [
                'file-loader?name=i/[hash].[ext]'
            ]}
        ]
    },
    resolve: {
        modules: ["node_modules", "spritesmith-generated"]
    },
    plugins: [
        new SpritesmithPlugin({
            src: {
                cwd: path.resolve(__dirname, 'src/assets/images/icon'),
                glob: '*.png'
            },
            target: {
                image: path.resolve(__dirname, 'venia-static-assets/css/sprites-'+version+'.png'),
                css: path.resolve(__dirname, 'venia-static-assets/css/sprites-'+version+'.css')
            },
            apiOptions: {
                cssImageRef: "/venia-static-assets/css/sprites-"+version+".png?v=" + Math.round((new Date()).getTime() / 1000)
            }
        })
    ]
};
