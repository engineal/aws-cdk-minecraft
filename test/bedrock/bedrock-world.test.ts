import {BedrockWorld} from '../../lib/bedrock';
import {Secret} from '@aws-cdk/aws-ecs';
import {Stack} from '@aws-cdk/core';
import {StringParameter} from '@aws-cdk/aws-ssm';
import {SynthUtils} from '@aws-cdk/assert';

test('Bedrock World defaults snapshot', () => {
    const stack = new Stack();

    new BedrockWorld(stack, 'Test');

    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});

test('Bedrock World enable sftp', () => {
    const stack = new Stack();
    const world = new BedrockWorld(stack, 'Test');
    const parameter = StringParameter.fromStringParameterName(world, 'UsersParameter', 'users');

    world.enableSftp(Secret.fromSsmParameter(parameter));

    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
