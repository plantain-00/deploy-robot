const { Program } = require('clean-scripts')

const tsFiles = `"src/**/*.ts" "spec/**/*.ts"`
const jsFiles = `"*.config.js"`

const tscCommand = `tsc -p src`

module.exports = {
  build: [
    `rimraf dist/`,
    tscCommand
  ],
  lint: {
    ts: `eslint --ext .js,.ts,.tsx ${tsFiles} ${jsFiles}`,
    export: `no-unused-export ${tsFiles}`,
    commit: `commitlint --from=HEAD~1`,
    markdown: `markdownlint README.md`,
    typeCoverage: 'type-coverage -p src --strict'
  },
  test: [
    'tsc -p spec',
    'jasmine',
    new Program('clean-release --config clean-run.config.js', 30000)
  ],
  fix: `eslint --ext .js,.ts,.tsx ${tsFiles} ${jsFiles} --fix`,
  watch: `${tscCommand} --watch`
}
