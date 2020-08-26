![Node.js CI](https://github.com/engineal/aws-cdk-minecraft/workflows/Node.js%20CI/badge.svg)
![npm (scoped)](https://img.shields.io/npm/v/@engineal/aws-cdk-minecraft)
![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@engineal/aws-cdk-minecraft)
![Snyk Vulnerabilities for npm scoped package](https://img.shields.io/snyk/vulnerabilities/npm/@engineal/aws-cdk-minecraft)
![Libraries.io dependency status for latest release, scoped npm package](https://img.shields.io/librariesio/release/npm/@engineal/aws-cdk-minecraft)
![NPM](https://img.shields.io/npm/l/@engineal/aws-cdk-minecraft)

## Minecraft CDK constructs

This library provides CDK constructs that can be used to fully automate a Minecraft server running on ECS.

This library supports both Java and Bedrock servers, using docker images from the following projects:
* Java: https://github.com/itzg/docker-minecraft-server
* Bedrock: https://hub.docker.com/r/itzg/minecraft-bedrock-server

### Features:
* Cost savings by automatically suspending the Minecraft server task when no one is playing
* Automatic backups with configurable retention policies
* Automated modpack installation (for Java Minecraft servers)
* Centralized monitoring using AWS Cloudwatch logs and metrics

### Example
This simple line will deploy a new vanilla Java Minecraft server with default settings, including automatic backups,
cost savings, and more.
```typescript
const world = new JavaWorld(this, props.name);
```

### Features

#### SFTP
You can enable SFTP access to the filesystem for maintenance activities.

This will add a second container to the ECS task definition that uses this docker image: https://github.com/atmoz/sftp.

Provide a secret when enabling SFTP access with credentials for access over SFTP. The value of the secret should be in
the format of `username:password`. See the https://github.com/atmoz/sftp for more options.

##### Example
```typescript
const parameter = StringParameter.fromStringParameterName(world, 'UsersParameter', 'users');
const world = new JavaWorld(this, props.name);
world.enableSftp(Secret.fromSsmParameter(parameter));
```

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
