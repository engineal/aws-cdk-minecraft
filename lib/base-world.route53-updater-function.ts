/* eslint-disable no-console */
import * as AWS from 'aws-sdk';
import * as xray from 'aws-xray-sdk';
import {EventBridgeHandler} from 'aws-lambda';

const ec2Client = xray.captureAWSClient(new AWS.EC2());
const route53Client = xray.captureAWSClient(new AWS.Route53());

type ECSTaskStateChangeEvent = {
    attachments?: AWS.ECS.Attachments;
    clusterArn: string;
    containers?: AWS.ECS.Containers;
    desiredStatus: 'RUNNING' | 'STOPPED';
    lastStatus: 'PROVISIONING' | 'PENDING' | 'RUNNING' | 'DEPROVISIONING' | 'STOPPED';
    taskArn: string;
    taskDefinitionArn: string;
}

type ECSTaskStateChangeHandler = EventBridgeHandler<'ECS Task State Change', ECSTaskStateChangeEvent, void>;

export const lambdaHandler: ECSTaskStateChangeHandler = async event => {
    const networkInterfaceId = event.detail.attachments
        ?.find(attachment => attachment.type === 'eni')?.details
        ?.find(details => details.name === 'networkInterfaceId')?.value;

    if (!networkInterfaceId) {
        throw new Error(`${event.detail.taskArn} does not have a network interface.`);
    }
    const describeNetworkInterfacesResponse = await ec2Client.describeNetworkInterfaces({
        NetworkInterfaceIds: [networkInterfaceId]
    }).promise();
    // eslint-disable-next-line no-magic-numbers
    const publicIp = describeNetworkInterfacesResponse.NetworkInterfaces?.[0].Association?.PublicIp;

    if (!publicIp) {
        throw new Error(`${event.detail.taskArn} does not have a public ip address.`);
    }
    // eslint-disable-next-line no-warning-comments
    // TODO: get hostname somehow
    const hostname = '';

    console.log(`Updating ${hostname} with address: ${publicIp}.`);
    await route53Client.changeResourceRecordSets({
        ChangeBatch: {
            Changes: [{
                Action: 'UPSERT',
                ResourceRecordSet: {
                    Name: `${hostname}.`,
                    ResourceRecords: [{Value: publicIp}],
                    TTL: 60,
                    Type: 'A'
                }
            }]
        },
        HostedZoneId: hostedZoneId
    }).promise();
};
