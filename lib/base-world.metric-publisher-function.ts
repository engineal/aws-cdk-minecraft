/* eslint-disable no-console */
import * as AWS from 'aws-sdk';
import * as minecraft from 'mc-server-status';
import * as xray from 'aws-xray-sdk';
import {ScheduledHandler} from 'aws-lambda';

const cloudwatchClient = xray.captureAWSClient(new AWS.CloudWatch());

export interface MetricPublisherEventDetail {
    clusterName: string;
    hostName: string;
    serviceName: string;
}

/**
 * @returns {Promise<minecraft.Status | undefined>} the status of the minecraft world, or undefined if the status
 *                                                  is not available
 * @param {string} hostName the host name of the minecraft world
 */
const getStatus = async (hostName: string): Promise<minecraft.Status | undefined> => {
    try {
        console.log(`Getting status from host: ${hostName}`);

        return await minecraft.getStatus({
            host: hostName,
            timeout: 1000
        });
    } catch (error) {
        console.error(`Error getting status from host: ${hostName}`, error);

        return undefined;
    }
};

export const handler: ScheduledHandler<MetricPublisherEventDetail> = async event => {
    const status = await getStatus(event.detail.hostName);

    if (status) {
        const dimensions: AWS.CloudWatch.Dimensions = [
            {
                Name: 'ClusterName',
                Value: event.detail.clusterName
            },
            {
                Name: 'ServiceName',
                Value: event.detail.serviceName
            }
        ];

        const metricData: AWS.CloudWatch.MetricData = [{
            Dimensions: dimensions,
            MetricName: 'Ping',
            Unit: 'Milliseconds',
            Value: status.ping
        }];

        if (status.players) {
            metricData.push(
                {
                    Dimensions: dimensions,
                    MetricName: 'PlayersOnline',
                    Unit: 'Count',
                    Value: status.players.online
                },
                {
                    Dimensions: dimensions,
                    MetricName: 'PlayersMax',
                    Unit: 'Count',
                    Value: status.players.max
                }
            );
        }

        console.log(`Putting metric data: ${JSON.stringify(metricData)}`);
        await cloudwatchClient.putMetricData({
            MetricData: metricData,
            Namespace: 'Minecraft'
        }).promise();
    }
};
