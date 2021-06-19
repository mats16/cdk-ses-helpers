const { AwsCdkConstructLibrary } = require('projen');
const project = new AwsCdkConstructLibrary({
  author: 'mats16',
  authorAddress: 'mats.kazuki@gmail.com',
  cdkVersion: '1.109.0',
  defaultReleaseBranch: 'main',
  name: 'cdk-ses-helpers',
  repositoryUrl: 'https://github.com/mats16/cdk-ses-helpers.git',
  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-secretsmanager',
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-lambda-nodejs',
  ],
  bundledDeps: [
    'axios',
    '@aws-sdk/client-secrets-manager',
    '@aws-sdk/client-workmail',
  ],
  devDeps: [
    '@types/aws-lambda',
    'esbuild@0',
  ],
  gitignore: [
    'cdk.out/',
  ],
  npmignore: [
    '/cdk.out',
  ],
  // cdkDependencies: undefined,        /* Which AWS CDK modules (those that start with "@aws-cdk/") does this library require when consumed? */
  // cdkTestDependencies: undefined,    /* AWS CDK modules required for testing. */
  // deps: [],                          /* Runtime dependencies of this module. */
  // description: undefined,            /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],                       /* Build dependencies for this module. */
  // packageName: undefined,            /* The "name" in package.json. */
  // projectType: ProjectType.UNKNOWN,  /* Which type of project this is (library/app). */
  // release: undefined,                /* Add release management to this project. */
});
project.synth();