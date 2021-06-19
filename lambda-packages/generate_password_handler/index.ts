import { CloudFormationCustomResourceHandler, CloudFormationCustomResourceResponse } from 'aws-lambda'
import { SecretsManagerClient, GetSecretValueCommand, UpdateSecretCommand } from "@aws-sdk/client-secrets-manager";
import axios from "axios";
import { createHmac } from 'crypto'
import { stringify } from 'querystring';

const dateStamp = '11111111'
const serviceName = 'ses'
const terminal = 'aws4_request';
const message = 'SendRawEmail';
const version = Buffer.alloc(1);
version.writeUInt8(0x04, 0);

const secretsManager = new SecretsManagerClient({});

const getSecret = async (secretArn: string) => {
  const cmd = new GetSecretValueCommand({ SecretId: secretArn });
  const secret = await secretsManager.send(cmd);
  return secret
};

const updateSecret = async (secretArn: string, secretJson: {[key: string]: string}) => {
  const cmd = new UpdateSecretCommand({ SecretId: secretArn, SecretString: JSON.stringify(secretJson) });
  const secret = await secretsManager.send(cmd);
  return secret
};

const sign = (key: string, msg: string) => {
  return createHmac("sha256", key).update(msg).digest();
}

const calculateKey = (secretAccessKey: string, region: string) => {
  // https://docs.aws.amazon.com/ja_jp/ses/latest/DeveloperGuide/smtp-credentials.html
  let signature = sign(`AWS4${secretAccessKey}`, dateStamp);
  signature = createHmac("sha256", signature).update(region).digest();
  signature = createHmac("sha256", signature).update(serviceName).digest();
  signature = createHmac("sha256", signature).update(terminal).digest();
  signature = createHmac("sha256", signature).update(message).digest();

  const signatureAndVer = Buffer.concat([version, signature]);
  return signatureAndVer.toString("base64")
};

export const handler: CloudFormationCustomResourceHandler = async (event, context) => {
  const secretArn: string = event.ResourceProperties.SecretArn;
  const sesRegion: string = event.ResourceProperties.SesRegion;

  const response = {
    Status: 'SUCCESS',
    RequestId: event.RequestId,
    StackId: event.StackId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: `${secretArn}/password`,
  };

  try {
    if (event.RequestType === 'Create' || event.RequestType === 'Update' ) {
      const secret = await getSecret(secretArn);
      const { access_key, secret_access_key } = JSON.parse(secret.SecretString || '{}');
      const smtpPassword = calculateKey(secret_access_key, sesRegion);
      await updateSecret(secretArn, {
        access_key,
        secret_access_key,
        username: access_key,
        password: smtpPassword,
        endpoint: `email-smtp.${sesRegion}.amazonaws.com`
      });
    };
  } catch(e) {
    const reason = stringify(e);
    response.Status = 'FAILED';
    response['Reason'] = reason;
  } finally {
    await axios.put(event.ResponseURL, response, { headers: { "Content-Type": "application/json" } });
  };
};
