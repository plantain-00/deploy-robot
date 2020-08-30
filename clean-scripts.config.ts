import { Program } from 'clean-scripts'

const tsFiles = `"src/**/*.ts"`

const tscCommand = `tsc -p src`

export default {
  build: [
    `rimraf dist/`,
    tscCommand
  ],
  lint: {
    ts: `eslint --ext .js,.ts,.tsx ${tsFiles}`,
    export: `no-unused-export ${tsFiles}`,
    markdown: `markdownlint README.md`,
    typeCoverage: 'type-coverage -p src'
  },
  test: [
    new Program('clean-release --config clean-run.config.ts', 30000)
  ],
  fix: `eslint --ext .js,.ts,.tsx ${tsFiles} --fix`,
  watch: `${tscCommand} --watch`
}
