import * as path from 'path';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import { Secret, SecretProps } from '@aws-cdk/aws-secretsmanager';
import * as cdk from '@aws-cdk/core';
import { Construct } from 'constructs';

const sesSupportedRegions = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'af-south-1',
  'ap-south-1',
  'ap-northeast-2',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ca-central-1',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'eu-north-1',
];

export interface SmtpSecretProps extends SecretProps {
  readonly sesRegion?: string;
};

interface SmtpUserProps extends iam.UserProps {
  readonly sesRegion: string;
};

class SmtpUser extends iam.User {
  accessKey: string;
  secretAccessKey: string;

  constructor(scope: Construct, id: string, props: SmtpUserProps) {
    super(scope, id, props);

    const sesRegion = props.sesRegion;
    const accountId = cdk.Aws.ACCOUNT_ID;

    this.attachInlinePolicy(new iam.Policy(this, 'AmazonSesSendingAccess', {
      policyName: 'AmazonSesSendingAccess',
      statements: [
        new iam.PolicyStatement({
          actions: ['ses:SendRawEmail'],
          resources: [`arn:aws:ses:${sesRegion}:${accountId}:*`],
        }),
      ],
    }));
    const accessKey = new iam.CfnAccessKey(this, 'AccessKey', { userName: this.userName });

    this.accessKey = accessKey.ref;
    this.secretAccessKey = accessKey.attrSecretAccessKey;
  };
};

export class SmtpSecret extends Secret {

  constructor(scope: Construct, id: string, props?: SmtpSecretProps) {

    const sesRegion = props?.sesRegion || cdk.Aws.REGION;
    if (!sesSupportedRegions.includes(sesRegion)) {
      console.error(`SES is not supported in ${sesRegion}`);
    };

    const smtpUser = new SmtpUser(scope, 'SmtpUser', { sesRegion });
    props = {
      description: '[cdk-ses-helpers] SES SMTP Credentials',
      ...props,
      generateSecretString: {
        generateStringKey: 'password',
        secretStringTemplate: JSON.stringify({
          access_key: smtpUser.accessKey,
          secret_access_key: smtpUser.secretAccessKey,
        }),
      },
    };
    super(scope, id, props);

    const generatePasswordHandler = new NodejsFunction(this, 'GeneratePasswordHandler', {
      description: '[cdk-ses-helpers] Generate SMTP Password Handler',
      entry: path.resolve(__dirname, '..', 'lambda-packages', 'generate_password_handler', 'index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        SECRET_ARN: this.secretFullArn!,
      },
      initialPolicy: [
        new iam.PolicyStatement({
          actions: [
            'secretsmanager:GetSecretValue',
            'secretsmanager:UpdateSecret',
          ],
          resources: [this.secretFullArn!],
        }),
      ],
    });

    new cdk.CustomResource(this, 'SmtpPassword', {
      serviceToken: generatePasswordHandler.functionArn,
      properties: {
        SecretArn: this.secretFullArn!,
        SesRegion: sesRegion,
      },
    });
  };
}
