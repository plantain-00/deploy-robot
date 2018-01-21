import * as libs from './libs'

const defaultConfig: libs.Config = {
  applications: [],
  localeName: 'zh-cn',
  mode: 'github',
  port: 9996,
  host: 'localhost'
}

require('../deploy-robot.config.js')(defaultConfig)

export = defaultConfig
