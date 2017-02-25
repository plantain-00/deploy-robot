[![Dependency Status](https://david-dm.org/plantain-00/deploy-robot.svg)](https://david-dm.org/plantain-00/deploy-robot)
[![devDependency Status](https://david-dm.org/plantain-00/deploy-robot/dev-status.svg)](https://david-dm.org/plantain-00/deploy-robot#info=devDependencies)
[![Build Status](https://travis-ci.org/plantain-00/deploy-robot.svg?branch=master)](https://travis-ci.org/plantain-00/deploy-robot)

## install

```bash
git clone -b release https://github.com/plantain-00/deploy-robot.git . --depth=1 && npm i --production
```

```bash
node dist/start.js
```

or

```bash
node dist/start.js -m github -p 9996 -h 0.0.0.0
```

## options

+ `-m --mode [mode]`
+ `-p --port [port]`
+ `-h --host [host]`

## In Github, Gitlab

1. Add a web hook for the repository, the trigger events should include comments of pull/merge request
2. Create a robot account, and create a private access token for the account

## Why no bitbucket or gogs?

Can not set private access token, and can not create comment, for now.

## secure

for Github, create an environment variable named `DEPLOY_ROBOT_ACCESS_TOKEN`

for Gitlab, create an environment variable named `DEPLOY_ROBOT_PRIVATE_TOKEN`.

## demo scripts

#### frontend pr opend

```bash
path=/opt/deploy-robot-temp-demo/$1
mkdir $path
cd $path
git clone https://github.com/plantain-00/deploy-robot-demo.git . --depth=1 -b $2
```
