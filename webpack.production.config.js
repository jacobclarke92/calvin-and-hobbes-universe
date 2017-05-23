var webpack = require('webpack');
var config = require('./webpack.config.js');

delete config.devtool;

config.plugins = [
	new webpack.NoEmitOnErrorsPlugin(),
	new webpack.DefinePlugin({
		'process.env': {
			'NODE_ENV': JSON.stringify('production')
		}
	}),
	new webpack.optimize.UglifyJsPlugin({
		compress: {
			warnings: false,
			drop_console: true
		}
	})
];

module.exports = config;