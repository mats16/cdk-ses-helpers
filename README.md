# cdk-ses-helpers

## SMTP Secret

CDK construct for [Amazon SES SMTP credentials](https://docs.aws.amazon.com/ses/latest/dg/smtp-credentials.html) with Amazon Secrets Manager

```ts
import { SmtpSecret } from 'cdk-ses-helpers';

const smtpSecret = new SmtpSecret(this, 'SmtpSecret');
```

This secret has the following values. Please use `username` and `password` to send emails via SMTP.

```json
{
    "access_key": "XXXXXXXXXXXXXXXXXXXXXX",
    "secret_access_key": "XXXXXXXXXXXXXXXXXXXXXX",
    "username": "XXXXXXXXXXXXXXXXXXXXXX",
    "password": "XXXXXXXXXXXXXXXXXXXXXX",
    "endpoint": "email-smtp.${region}.amazonaws.com"
}
```

## Managed Identity

CDK construct to create managed identity of Amazon SES via Amazon WorkMail


```ts
import { ManagedIdentity } from 'cdk-ses-helpers';

const identity = new ManagedIdentity(stack, 'ManagedDomain', { subDomainName: 'hey-yo' });
const domainName = identity.domainName;  // return hey-yo.awsapps.com
```
