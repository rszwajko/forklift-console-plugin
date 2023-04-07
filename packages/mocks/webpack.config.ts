/* eslint-disable @cspell/spellchecker */
/* eslint-env node */

import * as path from 'path';

import { type Configuration as WebpackConfiguration, EnvironmentPlugin } from 'webpack';

const config: WebpackConfiguration = {
  mode: 'production',
  context: path.resolve(__dirname, 'src'),
  entry: './browser/loadServiceWorker.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '...'],
    fallback: {
      fs: false,
      path: false,
    },
  },
  output: {
    filename: 'loadServiceWorkerBundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new EnvironmentPlugin({
      PLUGIN_NAME: 'forklift-console-plugin',
    }),
  ],
  devtool: 'inline-source-map',
  optimization: {
    chunkIds: 'named',
    minimize: false,
  },
};

export default config;
