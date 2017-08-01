import { SRC } from './constants';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const extractLess = new ExtractTextPlugin({
    filename: './[name].[contenthash].css',
    disable: process.env.NODE_ENV === 'development2'
});

module.exports = {
    devtool: 'inline-source-map',
    entry: [
        'webpack/hot/dev-server',
        'webpack-hot-middleware/client',
        'whatwg-fetch',
        `${SRC}js/index.js`
    ],
    output: {
        filename: 'app.js',
        path: '/',
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            // {
            //     test: /\.css/,
            //     loader: loader: extractLess.extract({
            //         use: [
            //             { loader: 'css-loader' }
            //         ]
            //         fallback: 'style-loader'
            //     })
            // },
            {
                test: /\.less$/,
                loader: extractLess.extract({
                    use: [
                        { loader: 'css-loader' },
                        { loader: 'less-loader' }
                    ],
                    fallback: 'style-loader'
                })
            },
            {
                test: /\.(png|gif|jpg)$/,
                loader: 'file-loader?name=./images/[name].[ext]'
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.(ttf|eot|svg|woff|woff2)$/,
                loader: 'file-loader',
                query: {
                    name: '[name].[ext]',
                },
            },
            
        ]
    },
    resolve: {
        modules: [SRC, 'node_modules']
    },
    performance: {
        hints: false
    },
    plugins: [
        extractLess,
        new HtmlWebpackPlugin({
            template: `${SRC}index.html`,
            inject: 'body',
        }),
        // new CopyWebpackPlugin([
        //     { from: `${SRC}images/favicon.ico` },
        //     { from: `${SRC}images/favicon.png` },
        //     { from: `${SRC}images` },
        // ]),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
            PRODUCTION: JSON.stringify(false)
        })
    ]
}
