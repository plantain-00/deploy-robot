const authorizedAuthors = ['plantain-00']

const filter = (comment, author) => comment.indexOf('robot') >= 0 &&
  comment.indexOf('deploy') >= 0 &&
  comment.indexOf('please') >= 0 &&
  authorizedAuthors.findIndex(a => a === author) >= 0

module.exports = function (defaultConfig) {
  defaultConfig.applications = [
    {
      repositoryName: 'deploy-robot-demo',
      hookSecret: 'test secret',
      pullRequest: {
        getTestUrl (port, pullRequestId) {
          return `http://106.15.39.164:${port}/`
        },
        mergedCommand: '/opt/scripts/pr_merged.sh',
        openedCommand: '/opt/scripts/pr_opened.sh',
        closedCommand: '/opt/scripts/pr_closed.sh',
        updatedCommand: '/opt/scripts/pr_updated.sh'
      },
      commentActions: [
        {
          filter,
          command: '/opt/scripts/deploy.sh',
          gotMessage: '正在部署...',
          doneMessage: '部署已完成，https://deploy-demo.yorkyao.com/'
        }
      ]
    },
    {
      repositoryName: 'deploy-robot-backend-demo',
      hookSecret: 'test secret',
      pullRequest: {
        getTestUrl (port, pullRequestId) {
          return `http://106.15.39.164:${port}/api/`
        },
        mergedCommand: '/opt/backend_scripts/pr_merged.sh',
        openedCommand: '/opt/backend_scripts/pr_opened.sh',
        closedCommand: '/opt/backend_scripts/pr_closed.sh',
        updatedCommand: '/opt/backend_scripts/pr_updated.sh'
      },
      commentActions: [
        {
          filter,
          command: '/opt/backend_scripts/deploy.sh',
          gotMessage: '正在部署...',
          doneMessage: '部署已完成，https://deploy-demo.yorkyao.com/api/'
        }
      ]
    }
  ]
}
