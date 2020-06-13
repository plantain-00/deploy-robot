import { Program } from 'clean-scripts'

const tsFiles = `"src/**/*.ts"`
const jsFiles = `"*.config.js"`

const tscCommand = `tsc -p src`

export default {
  build: [
    `rimraf dist/`,
    tscCommand
  ],
  lint: {
    ts: `eslint --ext .js,.ts,.tsx ${tsFiles} ${jsFiles}`,
    export: `no-unused-export ${tsFiles}`,
    commit: `commitlint --from=HEAD~1`,
    markdown: `markdownlint README.md`,
    typeCoverage: 'type-coverage -p src --ignore-catch'
  },
  test: [
    new Program('clean-release --config clean-run.config.ts', 30000)
  ],
  fix: `eslint --ext .js,.ts,.tsx ${tsFiles} ${jsFiles} --fix`,
  watch: `${tscCommand} --watch`
}
