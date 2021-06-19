import * as path from 'path';
import * as iam from '@aws-cdk/aws-iam';
import * as lambda from '@aws-cdk/aws-lambda';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs';
import * as cdk from '@aws-cdk/core';

const workMailSupportedRegions = [
  'us-east-1',
  'us-west-2',
  'eu-west-1',
];

export interface ManagedIdentityProps {
  readonly sesRegion?: string;
  readonly subDomainName?: string;
};

export class ManagedIdentity extends cdk.Construct {
  domainName: string;
  arn: string;

  constructor(scope: cdk.Construct, id: string, props?: ManagedIdentityProps) {
    super(scope, id);

    const region = props?.sesRegion || cdk.Aws.REGION;
    if (!workMailSupportedRegions.includes(region)) {
      console.error(`WorkMaik is not supported in ${region}.`);
    };

    const createWorkMailOrgHandler = new NodejsFunction(this, 'CreateWorkMailOrgHandler', {
      description: '[cdk-ses-helpers] Create WorkMail Organization Handler',
      entry: path.resolve(__dirname, '..', 'lambda-packages', 'create_workmail_org_handler', 'index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      initialPolicy: [
        new iam.PolicyStatement({
          actions: [
            'workmail:DescribeOrganization',
            'workmail:CreateOrganization',
            'workmail:DeleteOrganization',
            'ses:DescribeActiveReceiptRuleSet',
            'ses:SetActiveReceiptRuleSet',
            'ses:CreateReceiptRuleSet',
            'ses:CreateReceiptRule',
            'ses:DeleteReceiptRule',
            'ses:VerifyDomainIdentity',
            'ses:VerifyDomainDkim',
            'ses:SetIdentityEmailNotificationEnabled',
            'ses:PutIdentityPolicy',
            'ses:DeleteIdentityPolicy',
            'ses:DeleteIdentity',
            'ds:DescribeDirectories',
            'ds:CreateIdentityPoolDirectory',
            'ds:DeleteDirectory',
            'ds:ListAuthorizedApplications',
            'ds:CreateAlias',
            'ds:AuthorizeApplication',
            'ds:UnauthorizeApplication',
          ],
          resources: ['*'],
        }),
      ],
    });

    const workMailOrg = new cdk.CustomResource(this, 'WorkMailOrg', {
      serviceToken: createWorkMailOrgHandler.functionArn,
      properties: {
        Region: region,
        Alias: props?.subDomainName,
      },
    });
    const workMailAlias = workMailOrg.getAttString('Alias');
    this.domainName = `${workMailAlias}.awsapps.com`;
    this.arn = `arn:${cdk.Aws.PARTITION}:ses:${region}:${cdk.Aws.ACCOUNT_ID}:identity/${this.domainName}`;
  };
};
