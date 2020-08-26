import {HostedZone} from '@aws-cdk/aws-route53';
import {JavaWorld} from '../../lib/java/java-world';
import {Secret} from '@aws-cdk/aws-ecs';
import {Stack} from '@aws-cdk/core';
import {StringParameter} from '@aws-cdk/aws-ssm';
import {SynthUtils} from '@aws-cdk/assert';

test('Java World defaults snapshot', () => {
    const stack = new Stack();

    new JavaWorld(stack, 'Test');

    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});

test('Java World with hosted zone', () => {
    const stack = new Stack();
    const hostedZone = HostedZone.fromHostedZoneId(stack, 'HostedZone', 'test-hosted-zone');

    new JavaWorld(stack, 'Test', {
        hostedZone
    });

    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});

test('Java World enable RCON defaults', () => {
    const stack = new Stack();
    const world = new JavaWorld(stack, 'Test');

    world.enableRCON();

    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});

test('Java World enable RCON custom port', () => {
    const stack = new Stack();
    const world = new JavaWorld(stack, 'Test');

    world.enableRCON({
        port: 12345
    });

    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});

test('Java World enable query defaults', () => {
    const stack = new Stack();
    const world = new JavaWorld(stack, 'Test');

    world.enableQuery();

    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});

test('Java World enable query custom port', () => {
    const stack = new Stack();
    const world = new JavaWorld(stack, 'Test');

    world.enableQuery({
        port: 12345
    });

    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});

test('Java World enable sftp', () => {
    const stack = new Stack();
    const world = new JavaWorld(stack, 'Test');
    const parameter = StringParameter.fromStringParameterName(world, 'UsersParameter', 'users');

    world.enableSftp(Secret.fromSsmParameter(parameter));

    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
