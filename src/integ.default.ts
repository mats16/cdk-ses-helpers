import * as cdk from '@aws-cdk/core';
import { SmtpSecret, ManagedIdentity } from './index';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'MyStack');

new SmtpSecret(stack, 'SmtpSecret', { region: 'us-west-2' });
new ManagedIdentity(stack, 'ManagedDomain', { region: 'us-west-2' });
