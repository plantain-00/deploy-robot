const { execAsync } = require('clean-scripts')

const tsFiles = `"src/**/*.ts" "spec/**/*.ts" "test/**/*.ts"`
const jsFiles = `"*.config.js"`

const tscCommand = `tsc -p src`

module.exports = {
  build: [
    `rimraf dist/`,
    tscCommand
  ],
  lint: {
    ts: `tslint ${tsFiles}`,
    js: `standard ${jsFiles}`,
    export: `no-unused-export ${tsFiles}`
  },
  test: [
    'tsc -p spec',
    'jasmine',
    async () => {
      const { stdout } = await execAsync('git status -s')
      if (stdout) {
        console.log(stdout)
        throw new Error(`generated files doesn't match.`)
      }
    }
  ],
  fix: {
    ts: `tslint --fix ${tsFiles}`,
    js: `standard --fix ${jsFiles}`
  },
  release: `clean-release`,
  watch: `${tscCommand} --watch`
}
