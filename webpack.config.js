const path = require('path');

module.exports = {
  entry: './public/client.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js'
  },
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  target: 'web',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: 'defaults'
                }
              ]
            ]
          }
        }
      }
    ]
  },
  resolve: {
    fallback: {
      // mediasoup-client does not require heavy Node core modules, keep minimal
      fs: false,
      path: require.resolve('path-browserify'),
      os: false
    }
  },
  devtool: 'source-map'
};
