[![Dependency Status](https://david-dm.org/plantain-00/deploy-robot.svg)](https://david-dm.org/plantain-00/deploy-robot)
[![devDependency Status](https://david-dm.org/plantain-00/deploy-robot/dev-status.svg)](https://david-dm.org/plantain-00/deploy-robot#info=devDependencies)
[![Build Status](https://travis-ci.org/plantain-00/deploy-robot.svg?branch=master)](https://travis-ci.org/plantain-00/deploy-robot)

# tools and global npm packages

+ node.js >=4.0(for ES6 support)
+ typescript@next(for ES6 and ES7 async function support)
+ gulp
+ node-gyp build environment
+ pm2

# development

+ `npm install`
+ `gulp build`
+ `gulp host`

# production

+ `gulp deploy`
+ `pm2 restart all`

# secure

create a file of `secret.ts`, like:

```typescript
const settings = require("./settings");

export function load() {
    settings.applications.push({
        repositoryName: "",
        secret: "",
        operators: [""],
        command: "",
    });

    settings.accessToken = "";
}
```
