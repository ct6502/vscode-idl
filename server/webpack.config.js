//@ts-check

'use strict';

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');


/**@type {import('webpack').Configuration}*/
const config = {
  mode: 'production',
  target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

  entry: './src/server.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'server.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js']
  },
	module: {
		rules: [{
			test: /\.ts$/,
			exclude: /node_modules/,
			use: [{
				// configure TypeScript loader:
				// * enable sources maps for end-to-end source maps
				loader: 'ts-loader',
				options: {
					compilerOptions: {
						"sourceMap": true,
					}
				}
			}]
		}]
	},
	externals: {
		'vscode': 'commonjs vscode', // ignored because it doesn't exist
	},
  optimization: {
    minimizer: [new TerserPlugin({
      sourceMap: true,
    })],
  },
  stats: {
    warnings: false
  }
};
module.exports = config;
