// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require( 'path' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );

const isProduction = process.env.NODE_ENV === 'production';
const stylesHandler = MiniCssExtractPlugin.loader;

const config = {
	entry: {
		gprofiles: './src/wpcom.ts',
		'hovercard.min': './src/style.scss',
	},
	output: {
		path: path.resolve( __dirname, 'build' ),
		clean: true,
	},
	devServer: {
		open: true,
		host: 'localhost',
	},
	plugins: [
		new RemoveEmptyScriptsPlugin(),
		! isProduction &&
			new HtmlWebpackPlugin( {
				template: 'index.html',
			} ),
		new MiniCssExtractPlugin(),
	],
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/i,
				loader: 'ts-loader',
				exclude: [ '/node_modules/' ],
			},
			{
				test: /\.s[ac]ss$/i,
				use: [
					stylesHandler,
					'css-loader',
					'postcss-loader',
					'sass-loader',
				],
			},
			{
				test: /\.css$/i,
				use: [ stylesHandler, 'css-loader', 'postcss-loader' ],
			},
			{
				test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
				type: 'asset',
			},
		],
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.jsx', '.js' ],
	},
};

module.exports = () => {
	if ( isProduction ) {
		config.mode = 'production';
	} else {
		config.mode = 'development';
	}
	return config;
};
