import * as libs from './libs'

const accessToken = process.env.DEPLOY_ROBOT_ACCESS_TOKEN

export const githubHander: libs.Handler<Context> = {
  createComment(content: string, context: Context) {
    const url = `https://api.github.com/repos/${context.owner}/${context.repo}/issues/${context.issueNumber}/comments`
    return new Promise<void>((resolve, reject) => {
      libs.request({
        url,
        method: 'post',
        json: true,
        body: {
          body: `@${context.author}, ${content}`
        },
        headers: {
          'Authorization': `token ${accessToken}`,
          'User-Agent': 'SubsNoti-robot'
        }
      }, (error, incomingMessage, body) => {
        if (error) {
          console.log(error)
        } else if (incomingMessage.statusCode !== 201) {
          console.log(body)
        }

        resolve()
      })
    })
  },
  getRepositoryName(request: libs.express.Request): string {
    return request.body.repository.name
  },
  verifySignature(request: libs.express.Request, application: libs.Application) {
    const remoteSignature = request.header('X-Hub-Signature')
    const signature = getSignature(JSON.stringify(request.body), application.hookSecret)
    return signature === remoteSignature
  },
  getEventName(request: libs.express.Request) {
    return request.header('X-GitHub-Event') as string
  },
  commentEventName: 'issue_comment',
  pullRequestEventName: 'pull_request',
  getCommentAuthor(request: libs.express.Request): string | number {
    return request.body.comment.user.login
  },
  getPullRequestAuthor(request: libs.express.Request): string | number {
    return request.body.pull_request.user.login
  },
  getComment(request: libs.express.Request): string {
    return request.body.comment.body
  },
  getCommentCreationContext(request: libs.express.Request, application: libs.Application): Context {
    return {
      owner: request.body.repository.owner.login,
      repo: application.repositoryName,
      issueNumber: request.body.issue.number,
      author: githubHander.getCommentAuthor(request)
    }
  },
  getPullRequestCommentCreationContext(request: libs.express.Request, application: libs.Application): Context {
    return {
      owner: request.body.repository.owner.login,
      repo: application.repositoryName,
      issueNumber: request.body.pull_request.number,
      author: githubHander.getPullRequestAuthor(request)
    }
  },
  getPullRequestAction(request: libs.express.Request): string {
    return request.body.action
  },
  pullRequestOpenActionName: 'opened',
  pullRequestUpdateActionName: 'synchronize',
  isPullRequestMerged(request: libs.express.Request, action: string): boolean {
    if (action === 'closed') {
      return request.body.pull_request.merged
    }
    return false
  },
  isPullRequestClosed(request: libs.express.Request, action: string): boolean {
    if (action === 'closed') {
      return !request.body.pull_request.merged
    }
    return false
  },
  getPullRequestId(request: libs.express.Request): number {
    return request.body.pull_request.id
  },
  getBranchName(request: libs.express.Request): string {
    return request.body.pull_request.head.ref
  },
  getHeadRepositoryCloneUrl(request: libs.express.Request): string {
    return request.body.pull_request.head.repo.clone_url
  }
}

export type Context = {
  owner: string;
  repo: string;
  issueNumber: number;
  author: string | number;
}

function getSignature(body: string, secret: string) {
  return 'sha1=' + libs.createHmac('sha1', secret).update(body).digest('hex')
}
