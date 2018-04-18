module.exports = {
  include: [
    'dist/*.js',
    'deploy-robot.config.js',
    'package.json'
  ],
  exclude: [
  ],
  postScript: [
    'cd "[dir]" && npm i --production && node dist/start.js'
  ]
}
