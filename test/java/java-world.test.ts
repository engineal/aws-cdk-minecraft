import {HostedZone} from '@aws-cdk/aws-route53';
import {JavaWorld} from '../../lib/java/java-world';
import {Secret} from '@aws-cdk/aws-ecs';
import {Stack} from '@aws-cdk/core';
import {StringParameter} from '@aws-cdk/aws-ssm';
import {SynthUtils} from '@aws-cdk/assert';

test('Java World defaults snapshot', () => {
    const stack = new Stack();
    const hostedZone = HostedZone.fromHostedZoneId(stack, 'HostedZone', 'test-hosted-zone');

    new JavaWorld(stack, 'Test', {
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

test('Java World enable RCON defaults', () => {
    const stack = new Stack();
    const hostedZone = HostedZone.fromHostedZoneId(stack, 'HostedZone', 'test-hosted-zone');
    const world = new JavaWorld(stack, 'Test', {
        dns: {
            hostName: 'test.example.com',
            hostedZone
        }
    });

    world.enableRCON();

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

test('Java World enable RCON custom port', () => {
    const stack = new Stack();
    const hostedZone = HostedZone.fromHostedZoneId(stack, 'HostedZone', 'test-hosted-zone');
    const world = new JavaWorld(stack, 'Test', {
        dns: {
            hostName: 'test.example.com',
            hostedZone
        }
    });

    world.enableRCON({
        port: 12345
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

test('Java World enable query defaults', () => {
    const stack = new Stack();
    const hostedZone = HostedZone.fromHostedZoneId(stack, 'HostedZone', 'test-hosted-zone');
    const world = new JavaWorld(stack, 'Test', {
        dns: {
            hostName: 'test.example.com',
            hostedZone
        }
    });

    world.enableQuery();

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

test('Java World enable query custom port', () => {
    const stack = new Stack();
    const hostedZone = HostedZone.fromHostedZoneId(stack, 'HostedZone', 'test-hosted-zone');
    const world = new JavaWorld(stack, 'Test', {
        dns: {
            hostName: 'test.example.com',
            hostedZone
        }
    });

    world.enableQuery({
        port: 12345
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

test('Java World enable sftp', () => {
    const stack = new Stack();
    const hostedZone = HostedZone.fromHostedZoneId(stack, 'HostedZone', 'test-hosted-zone');
    const world = new JavaWorld(stack, 'Test', {
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
