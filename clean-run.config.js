module.exports = {
  include: [
    'dist/*.js',
    'deploy-robot.config.js',
    'package.json',
    'yarn.lock'
  ],
  exclude: [
  ],
  postScript: [
    'cd "[dir]" && yarn --production && node dist/start.js'
  ]
}
