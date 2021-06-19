import { CloudFormationCustomResourceHandler, CloudFormationCustomResourceResponse, CloudFormationCustomResourceFailedResponse } from 'aws-lambda'
import { WorkMailClient, CreateOrganizationCommand, DeleteOrganizationCommand } from "@aws-sdk/client-workmail";
import axios from "axios";
import { stringify } from 'querystring';

const createOrg = async (region: string, alias: string) => {
  const client = new WorkMailClient({ region });
  const cmd = new CreateOrganizationCommand({ Alias: alias });
  const req = await client.send(cmd);
  return req.OrganizationId
};

const deleteOrg = async (region: string, organizationId: string) => {
  const client = new WorkMailClient({ region });
  const cmd = new DeleteOrganizationCommand({ OrganizationId: organizationId, DeleteDirectory: true });
  const req = await client.send(cmd);
  return req.OrganizationId
};

export const handler: CloudFormationCustomResourceHandler = async (event) => {
  const region: string = event.ResourceProperties.Region;
  const alias: string = event.ResourceProperties.Alias || event.RequestId.replace(/-/g, '');

  const response = {
    Status: 'SUCCESS',
    RequestId: event.RequestId,
    StackId: event.StackId,
    LogicalResourceId: event.LogicalResourceId,
    PhysicalResourceId: '',
    Data: { Alias: alias }
  };

  try {
    if (event.RequestType === 'Create') {
      const organizationId = await createOrg(region, alias);
      response.PhysicalResourceId = organizationId
    } else if (event.RequestType === 'Update') {
      const oldOrganizationId = event.PhysicalResourceId
      const organizationId = await createOrg(region, alias)
      await deleteOrg(region, oldOrganizationId)
      response.PhysicalResourceId = organizationId
    } else if (event.RequestType === 'Delete') {
      const oldOrganizationId = event.PhysicalResourceId
      await deleteOrg(region, oldOrganizationId)
      response.PhysicalResourceId = oldOrganizationId
    };
  } catch (e) {
    console.log(e);
    if (event.RequestType === 'Create' || event.RequestType === 'Update') {
      const reason = stringify(e);
      response.Status = 'FAILED';
      response['Reason'] = reason;
      delete response.Data;
    };
  } finally {
    await axios.put(event.ResponseURL, response, { headers: { "Content-Type": "application/json" } });
  };
};