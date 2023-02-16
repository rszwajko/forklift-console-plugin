/* eslint-env node */

import * as path from 'path';

import CopyPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import { type Configuration as WebpackConfiguration, EnvironmentPlugin } from 'webpack';
import { type Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';

import { DynamicConsoleRemotePlugin } from '@kubev2v/webpack';

import extensions from './plugin-extensions';
import pluginMetadata from './plugin-metadata.';

const pathTo = (relativePath: string) => path.resolve(__dirname, relativePath);

const production = process.env.NODE_ENV === 'production';
const configFile = pathTo('tsconfig.json');

const config: WebpackConfiguration & {
  devServer: WebpackDevServerConfiguration;
} = {
  mode: production ? 'production' : 'development',
  context: pathTo('src'),
  entry: {}, // entry generated by `DynamicConsoleRemotePlugin`
  output: {
    path: pathTo('dist'),
    publicPath: `/api/plugins/${pluginMetadata.name}/`,
    chunkFilename: production ? 'chunks/[name].[chunkhash:8].min.js' : 'chunks/[name].js',
    assetModuleFilename: production ? 'assets/[name].[contenthash:8][ext]' : 'assets/[name][ext]',
    filename: production ? '[name]-bundle-[hash:8].min.js' : '[name]-bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    plugins: [new TsconfigPathsPlugin({ configFile })],
  },
  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile,
            },
          },
        ],
      },
      {
        test: /\.s?(css)$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff2?|ttf|eot|otf)(\?.*$|$)/,
        type: 'asset/resource',
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  devServer: {
    static: './dist',
    port: 9001,
    // Allow bridge running in a container to connect to the plugin dev server.
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
    },
    devMiddleware: {
      writeToDisk: true,
    },
  },
  plugins: [
    new DynamicConsoleRemotePlugin({
      pluginMetadata,
      extensions,
    }),
    new CopyPlugin({
      patterns: [{ from: '../locales', to: '../dist/locales' }],
    }),
    new EnvironmentPlugin({
      // DATA_SOURCE: used for testing when no api servers are available
      // if set to mock, network api calls will be mocked
      DATA_SOURCE: 'remote',
      // can be 'RedHat' or 'Konveyor',
      // note: downstream build are set to: 'RedHat'
      BRAND_TYPE: 'Konveyor',
      // NAMESPACE: used only on mock data
      NAMESPACE: 'konveyor-forklift',
      // DEFAULT_NAMESPACE: UI forms and modals will fallback to this namespace
      //                    if no namespace is given by user.
      // note: downstream build are set to: 'openshift-mtv'
      DEFAULT_NAMESPACE: 'konveyor-forklift',
      // NODE_ENV: used to bake debugging information on development builds.
      NODE_ENV: production ? 'production' : 'development',
      // PLUGIN_NAME: should be set to the plugin name hardcoded in the
      //              instalation scripts, defaults to 'forklift-console-plugin'.
      PLUGIN_NAME: pluginMetadata.name,
    }),
  ],
  devtool: 'source-map',
  optimization: {
    chunkIds: production ? 'deterministic' : 'named',
    minimize: production ? true : false,
    minimizer: [
      // Keep class names and function names in sources to aid debug and diagnostics of prod builds
      new TerserPlugin({
        terserOptions: {
          keep_classnames: true,
          keep_fnames: true,
        },
      }),
    ],
  },
};

export default config;
