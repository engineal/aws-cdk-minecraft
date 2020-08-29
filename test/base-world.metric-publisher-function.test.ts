import * as AWS from 'aws-sdk';
import * as minecraft from 'mc-server-status';
import {Context, EventBridgeEvent} from 'aws-lambda';
import {MetricPublisherEventDetail, handler} from '../lib/base-world.metric-publisher-function';
import {mocked} from 'ts-jest/utils';

jest.mock('aws-sdk', () => {
    const mockedCloudWatch = {
        putMetricData: jest.fn(() => ({promise: jest.fn().mockReturnThis()}))
    };

    return {
        CloudWatch: jest.fn(() => mockedCloudWatch)
    };
});

jest.mock('aws-xray-sdk', () => ({
    captureAWSClient: <T>(client: T) => client
}));

jest.mock('mc-server-status');

const cloudwatchClient = new AWS.CloudWatch();

const testEvent: EventBridgeEvent<'Scheduled Event', MetricPublisherEventDetail> = {
    'account': '123456789012',
    'detail': {
        clusterName: 'test-cluster',
        hostName: 'test.example.com',
        serviceName: 'test-service'
    },
    'detail-type': 'Scheduled Event',
    'id': '89d1a02d-5ec7-412e-82f5-13505f849b41',
    'region': 'us-east-1',
    'resources': [
        'arn:aws:events:us-east-1:123456789012:rule/SampleRule'
    ],
    'source': 'aws.events',
    'time': '2016-12-30T18:44:49Z',
    'version': '0'
};

test('Metric Publisher function publishes no metrics when world offline', async () => {
    mocked(minecraft.getStatus).mockRejectedValue(new Error('Timeout'));

    await handler(testEvent, null as unknown as Context, jest.fn());

    expect(cloudwatchClient.putMetricData).not.toBeCalled();
});

test('Metric Publisher function publishes ping', async () => {
    mocked(minecraft.getStatus).mockResolvedValue({
        description: 'Test World',
        ping: 13,
        players: null as unknown as { max: number; online: number; },
        version: {
            name: '1.16.2',
            protocol: 751
        }
    });

    await handler(testEvent, null as unknown as Context, jest.fn());

    expect(cloudwatchClient.putMetricData).toBeCalledWith({
        MetricData: [{
            Dimensions: [
                {
                    Name: 'ClusterName',
                    Value: 'test-cluster'
                },
                {
                    Name: 'ServiceName',
                    Value: 'test-service'
                }
            ],
            MetricName: 'Ping',
            Unit: 'Milliseconds',
            Value: 13
        }],
        Namespace: 'Minecraft'
    });
});

test('Metric Publisher function publishes ping and player counts', async () => {
    mocked(minecraft.getStatus).mockResolvedValue({
        description: 'Test World',
        ping: 13,
        players: {
            max: 20,
            online: 1
        },
        version: {
            name: '1.16.2',
            protocol: 751
        }
    });

    await handler(testEvent, null as unknown as Context, jest.fn());

    expect(cloudwatchClient.putMetricData).toBeCalledWith({
        MetricData: [
            {
                Dimensions: [
                    {
                        Name: 'ClusterName',
                        Value: 'test-cluster'
                    },
                    {
                        Name: 'ServiceName',
                        Value: 'test-service'
                    }
                ],
                MetricName: 'Ping',
                Unit: 'Milliseconds',
                Value: 13
            },
            {
                Dimensions: [
                    {
                        Name: 'ClusterName',
                        Value: 'test-cluster'
                    },
                    {
                        Name: 'ServiceName',
                        Value: 'test-service'
                    }
                ],
                MetricName: 'PlayersOnline',
                Unit: 'Count',
                Value: 1
            },
            {
                Dimensions: [
                    {
                        Name: 'ClusterName',
                        Value: 'test-cluster'
                    },
                    {
                        Name: 'ServiceName',
                        Value: 'test-service'
                    }
                ],
                MetricName: 'PlayersMax',
                Unit: 'Count',
                Value: 20
            }
        ],
        Namespace: 'Minecraft'
    });
});
