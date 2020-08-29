import {BedrockWorld} from '../../lib/bedrock';
import {HostedZone} from '@aws-cdk/aws-route53';
import {Secret} from '@aws-cdk/aws-ecs';
import {Stack} from '@aws-cdk/core';
import {StringParameter} from '@aws-cdk/aws-ssm';
import {SynthUtils} from '@aws-cdk/assert';

test('Bedrock World defaults snapshot', () => {
    const stack = new Stack();
    const hostedZone = HostedZone.fromHostedZoneId(stack, 'HostedZone', 'test-hosted-zone');

    new BedrockWorld(stack, 'Test', {
        dns: {
            hostName: 'test.example.com',
            hostedZone
        }
    });

    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot({
        Parameters: expect.any(Object),
        Resources: {
            LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aFD4BFC8A: {
                Properties: {
                    Code: expect.any(Object)
                }
            },
            Testmetricpublisherfunction65C3FB4C: {
                Properties: {
                    Code: expect.any(Object)
                }
            }
        }
    });
});

test('Bedrock World enable sftp', () => {
    const stack = new Stack();
    const hostedZone = HostedZone.fromHostedZoneId(stack, 'HostedZone', 'test-hosted-zone');
    const world = new BedrockWorld(stack, 'Test', {
        dns: {
            hostName: 'test.example.com',
            hostedZone
        }
    });
    const parameter = StringParameter.fromStringParameterName(world, 'UsersParameter', 'users');

    world.enableSftp(Secret.fromSsmParameter(parameter));

    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot({
        Parameters: expect.any(Object),
        Resources: {
            LogRetentionaae0aa3c5b4d4f87b02d85b201efdd8aFD4BFC8A: {
                Properties: {
                    Code: expect.any(Object)
                }
            },
            Testmetricpublisherfunction65C3FB4C: {
                Properties: {
                    Code: expect.any(Object)
                }
            }
        }
    });
});
