import resolvePlugins from './resolvePlugins';

module.exports = {
  plugins: resolvePlugins([
    'transform-react-display-name',
    ['transform-react-jsx', {
      pragma: 'createElement' // default pragma is React.createElement
    }],
    'transform-jsx-stylesheet',
    'transform-flow-strip-types',
    'transform-export-extensions', // stage-1
    'transform-decorators-legacy', // should before transform-class-properties
    'transform-class-properties',
    'transform-object-rest-spread', // stage-3
    'syntax-trailing-function-commas', // stage-3
    'syntax-flow',
    'syntax-jsx',
    'add-module-exports'
  ]),
  env: {
    development: {
      plugins: resolvePlugins([
        'transform-react-jsx-source',
      ])
    },
    production: {
      plugins: resolvePlugins([
        'transform-react-constant-elements',
        'minify-dead-code-elimination'
      ])
    },
  }
};
