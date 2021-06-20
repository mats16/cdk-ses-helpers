import * as cdk from '@aws-cdk/core';
import { SmtpSecret } from '../src';
import '@aws-cdk/assert/jest';

test('create smtp password', () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app);
  new SmtpSecret(stack, 'TestSecret', { region: 'us-west-2' });
  expect(stack).toHaveResource('AWS::SecretsManager::Secret');
  expect(stack).toHaveResource('AWS::IAM::User');
  expect(stack).toHaveResource('AWS::Lambda::Function');
});