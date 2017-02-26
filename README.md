[![Dependency Status](https://david-dm.org/plantain-00/deploy-robot.svg)](https://david-dm.org/plantain-00/deploy-robot)
[![devDependency Status](https://david-dm.org/plantain-00/deploy-robot/dev-status.svg)](https://david-dm.org/plantain-00/deploy-robot#info=devDependencies)
[![Build Status](https://travis-ci.org/plantain-00/deploy-robot.svg?branch=master)](https://travis-ci.org/plantain-00/deploy-robot)

## features

+ when a pull/merge request is created, create a test application
+ when a pull/merge request is updated, update the created test application
+ when a pull/merge request is merged or closed, destroy the test application
+ the applications can be frontend or backend applications
+ when some operators comment "robot, deploy this please." on a pull/merge request, the normal application will be updated

## demo

frontend: https://github.com/plantain-00/deploy-robot-demo/pull/1

backend: https://github.com/plantain-00/deploy-robot-backend-demo/pull/1

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

## secure

for Github, create an environment variable named `DEPLOY_ROBOT_ACCESS_TOKEN`

for Gitlab, create an environment variable named `DEPLOY_ROBOT_PRIVATE_TOKEN`.

## Why no bitbucket or gogs?

Can not set private access token, and can not create comment, for now.

## demo scripts

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
npm i --production --registry=https://registry.npm.taobao.org
pm2 restart deploy-robot-backend-demo
```

#### PR opened

```bash
# frontend
path=/opt/deploy-robot-temp-demo/$3
mkdir $path
cd $path
git clone https://github.com/plantain-00/deploy-robot-demo.git . --depth=1 -b $2
```

```bash
# backend
path=/opt/deploy-robot-temp-backend-demo/$1
name=deploy-robot-backend-demo-$1
mkdir $path
cd $path
git clone https://github.com/plantain-00/deploy-robot-backend-demo.git . --depth=1 -b $2
npm i --production --registry=https://registry.npm.taobao.org
pm2 start index.js --name="$name" --node-args="--nouse-idle-notification --expose-gc --max-old-space-size=8192" -- -p $1
```

parameters | name
--- | ---
$1 | available port
$2 | branch name
$3 | pull request id

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
npm i --production --registry=https://registry.npm.taobao.org
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
