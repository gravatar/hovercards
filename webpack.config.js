const path = require( 'path' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );

const IS_DEV = process.env.DEV_BUILD || false;

module.exports = {
	entry: './src/index.tsx',
	output: {
		filename: IS_DEV ? 'gprofiles.dev.js' : 'gprofiles.js',
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js' ],
	},
	plugins: [
		new HtmlWebpackPlugin( {
			template: './public/index.html',
		} ),
	],
	devServer: {
		static: {
			directory: path.join( __dirname, 'public' ),
		},
		compress: true,
		port: 9000,
	},
	optimization: {
		minimize: !IS_DEV,
	}
};