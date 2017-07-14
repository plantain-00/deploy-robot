[![Dependency Status](https://david-dm.org/plantain-00/deploy-robot.svg)](https://david-dm.org/plantain-00/deploy-robot)
[![devDependency Status](https://david-dm.org/plantain-00/deploy-robot/dev-status.svg)](https://david-dm.org/plantain-00/deploy-robot#info=devDependencies)
[![Build Status](https://travis-ci.org/plantain-00/deploy-robot.svg?branch=master)](https://travis-ci.org/plantain-00/deploy-robot)

## features

+ when a pull/merge request is created, create a test application
+ when a pull/merge request is updated, update the created test application
+ when a pull/merge request is merged or closed, destroy the test application
+ the applications can be frontend or backend applications
+ when someone comments "robot, deploy this please." on a pull/merge request, the normal application will be updated
+ multiple language
+ when someone comments, execute custom scripts

## demo

frontend: https://github.com/plantain-00/deploy-robot-demo/pull/1

backend: https://github.com/plantain-00/deploy-robot-backend-demo/pull/1

## step 1. install

`git clone https://github.com/plantain-00/deploy-robot-release.git . --depth=1 && npm i --production`

## step 2. add web hook in Github or Gitlab

Add a web hook for the repository, the trigger events should include pull/merge request and comments of pull/merge request

## step 3. create a robot account in Github or Gitlab

Create a robot account, and create a private access token for the account

For Github, create an environment variable named `DEPLOY_ROBOT_ACCESS_TOKEN`

For Gitlab, create an environment variable named `DEPLOY_ROBOT_PRIVATE_TOKEN`

## step 4. update your config file

update your configuration at: `dist/config.js`.

name | description
--- | ---
localeName | multiple language name
repositoryName | repository name
hookSecret | the secret string you got from step 2
getTestUrl | your test environment url rule
mergedCommand/openedCommand/closedCommand/updatedCommand | the scripts executed when a pull/merge request is merged/opened/closed/updated, see step 5
filter | whether the comment will trigger the comment action
command | the script executed when a comment triggers the comment action, see step 5
gotMessage | the message when your service got the payload
doneMessage | the message when you have done to execute the script

## step 5. update your scripts

#### deploy

```bash
# frontend
cd /opt/deploy-robot-demo/
git pull
```

```bash
# backend
cd /opt/deploy-robot-backend-demo/
git pull
npm i --production
pm2 restart deploy-robot-backend-demo
```

#### PR opened

```bash
# frontend
path=/opt/deploy-robot-temp-demo/$3
mkdir $path
cd $path
git clone $4 . --depth=1 -b $2
```

```bash
# backend
path=/opt/deploy-robot-temp-backend-demo/$1
name=deploy-robot-backend-demo-$1
mkdir $path
cd $path
git clone $4 . --depth=1 -b $2
npm i --production
pm2 start index.js --name="$name" --node-args="--nouse-idle-notification --expose-gc --max-old-space-size=8192" -- -p $1
```

parameters | name
--- | ---
$1 | available port
$2 | branch name
$3 | pull request id
$4 | clone url

#### PR updated

```bash
# frontend
path=/opt/deploy-robot-temp-demo/$2
cd $path
git pull
```

```bash
# backend
path=/opt/deploy-robot-temp-backend-demo/$1
name=deploy-robot-backend-demo-$1
cd $path
git pull
npm i --production
pm2 restart $name
```

parameters | name
--- | ---
$1 | available port
$2 | pull request id

#### PR merged or closed

```bash
# frontend
path=/opt/deploy-robot-temp-demo/$2
rm -rf $path
```

```bash
# backend
path=/opt/deploy-robot-temp-backend-demo/$1
name=deploy-robot-backend-demo-$1
rm -rf $path
pm2 delete $name
```

parameters | name
--- | ---
$1 | available port
$2 | pull request id

## step 6. run

```bash
node dist/start.js
```

or

```bash
node dist/start.js -m github -p 9996 -h 0.0.0.0
```

+ `-m --mode [mode]`
+ `-p --port [port]`
+ `-h --host [host]`

then open http://localhost:9996 in your browser.

## Why no bitbucket or gogs?

Can not set private access token, and can not create comment, for now.
