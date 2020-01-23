//@ts-check

'use strict';

const withDefaults = require('../shared.webpack.config');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = withDefaults({
  context: path.join(__dirname),
  entry: {
    extension: './src/extension.ts'
  },
  module: {
    rules: [
      {
        test: /(?<!\.spec)\.ts$/,
        exclude: [/node_modules/, path.join(__dirname, 'src', 'test')],
        use: [
          {
            // configure TypeScript loader:
            // * enable sources maps for end-to-end source maps
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                sourceMap: true
              }
            }
          }
        ]
      }
    ]
  },
  output: {
    filename: 'extension.js',
    path: path.join(__dirname, 'dist'),
    libraryTarget: 'commonjs2'
  },
  optimization: {
    // minimize: true, // not sure how much of a difference this makes, just makes it slower
    minimizer: [
      new TerserPlugin({
        sourceMap: true
      })
    ]
  },
  stats: {
    warnings: false
  }
});
