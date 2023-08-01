const path = require( 'path' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );

const commonConfig = require( './config.common' );

module.exports = {
	...commonConfig,
	entry: './playground/index.ts',
	devServer: {
		open: true,
		watchFiles: [ 'playground' ],
	},
	plugins: [
		...commonConfig.plugins,
		new HtmlWebpackPlugin( {
			template: './playground/index.html',
		} ),
	],
	resolve: {
		...commonConfig.resolve,
		alias: {
			// To use the same React version as the one used by the playground
			React: path.resolve( __dirname, '../node_modules/react' ),
		},
	},
};
