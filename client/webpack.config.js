//@ts-check

'use strict';


//@ts-check

'use strict';

const withDefaults = require('../shared.webpack.config');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = withDefaults({
	context: path.join(__dirname),
	entry: {
		extension: './src/extension.ts',
	},
	output: {
		filename: 'extension.js',
		path: path.join(__dirname, 'dist')
	},
  optimization: {
    minimizer: [new TerserPlugin({
      sourceMap: true,
    })],
  },
  stats: {
    warnings: false
  }
});