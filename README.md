[![Dependency Status](https://david-dm.org/plantain-00/deploy-robot.svg)](https://david-dm.org/plantain-00/deploy-robot)
[![devDependency Status](https://david-dm.org/plantain-00/deploy-robot/dev-status.svg)](https://david-dm.org/plantain-00/deploy-robot#info=devDependencies)
[![Build Status](https://travis-ci.org/plantain-00/deploy-robot.svg?branch=master)](https://travis-ci.org/plantain-00/deploy-robot)

# tools

+ node-gyp build environment

# development

+ `npm i`
+ `npm run build`
+ `npm run tslint`
+ `node robot.js`

# In Github, Gitlab

1. Add a web hook for the repository, the trigger events should include comments of pull/merge request
2. Create a robot account, and create a private access token for the account

# Why no bitbucket or gogs?

Can not set private access token, and can not create comment, for now.

# secure

for GIthub, create an environment variable named `DEPLOY_ROBOT_ACCESS_TOKEN`, for Gitlab, create an environment variable named `DEPLOY_ROBOT_PRIVATE_TOKEN`.
