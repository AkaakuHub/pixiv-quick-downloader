import path from 'path';
import { fileURLToPath } from 'node:url';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: {
    content: './src/content/content.ts',
    background: './src/background/background.ts',
    popup: './src/popup/popup.ts',
    offscreen: './src/offscreen.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'src/icons', to: 'icons' },
        { from: 'src/rules.json', to: 'rules.json' },
        { from: 'src/offscreen.html', to: 'offscreen.html' }
      ]
    })
  ]
};