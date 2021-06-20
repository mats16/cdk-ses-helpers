import * as cdk from '@aws-cdk/core';
import { ManagedIdentity } from '../src';
import '@aws-cdk/assert/jest';

test('verify managed domain - awsapps.con', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app);
  new ManagedIdentity(stack, 'TestDomain', { region: 'us-west-2' });
  expect(stack).toHaveResource('AWS::Lambda::Function');
});