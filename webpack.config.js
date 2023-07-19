const path = require( 'path' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );
const RemoveEmptyScriptsPlugin = require( 'webpack-remove-empty-scripts' );

const isProduction = process.env.NODE_ENV === 'production';

const commonConfig = {
	mode: isProduction ? 'production' : 'development',
	devtool: isProduction ? 'source-map' : 'eval-source-map',
	watch: ! isProduction,
	entry: './src/index.ts',
	output: {
		path: path.resolve( __dirname, 'dist' ),
	},
	plugins: [ new RemoveEmptyScriptsPlugin(), new MiniCssExtractPlugin() ],
	module: {
		rules: [
			{
				test: /\.(ts|tsx)$/i,
				loader: 'ts-loader',
				exclude: [ '/node_modules/' ],
			},
			{
				test: /\.s[ac]ss$/i,
				use: [ MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', 'sass-loader' ],
			},
			{
				test: /\.css$/i,
				use: [ MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader' ],
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

const cjsConfig = {
	...commonConfig,
	output: {
		...commonConfig.output,
		filename: 'index.js',
		library: {
			type: 'commonjs2',
		},
	},
	target: 'node',
	optimization: {
		minimize: false,
	},
};

const esmConfig = {
	...commonConfig,
	output: {
		...commonConfig.output,
		filename: 'index.esm.js',
		library: {
			type: 'module',
		},
	},
	experiments: {
		outputModule: true,
	},
	optimization: {
		minimize: false,
	},
};

const mjsConfig = {
	...esmConfig,
	output: {
		...esmConfig.output,
		filename: 'index.mjs',
	},
};

const umdConfig = {
	...commonConfig,
	entry: './src/index.ts',
	output: {
		...commonConfig.output,
		filename: 'index.umd.min.js',
		library: {
			name: 'Gravatar',
			type: 'umd',
			umdNamedDefine: true,
		},
	},
};

const styleConfig = {
	...commonConfig,
	entry: {
		'style.min': './src/style.scss',
	},
};

module.exports = [ cjsConfig, esmConfig, mjsConfig, umdConfig, styleConfig ];
