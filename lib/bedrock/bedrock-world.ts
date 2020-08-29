import {BaseWorld, BaseWorldProps, IWorld} from '../base-world';
import {ContainerImage, LogDriver, Protocol, TaskDefinition} from '@aws-cdk/aws-ecs';
import {Peer, Port} from '@aws-cdk/aws-ec2';
import {Construct} from '@aws-cdk/core';

export interface MinecraftBedrockWorldProps extends BaseWorldProps {

    /**
     * The port on which the server is listening for IPv4 requests
     *
     * @default 19132
     */
    readonly ipv4Port?: number;

    /**
     * The port on which the server is listening for IPv6 requests
     *
     * @default 19133
     */
    readonly ipv6Port?: number;

    /**
     * Use a specific server version
     *
     * LATEST: determines the latest version and can be used to auto-upgrade on container start
     * PREVIOUS: uses the previously maintained major version. Useful when the mobile app is gradually being upgraded
     *           across devices
     * 1.11: the latest version of 1.11
     * 1.12: the latest version of 1.12
     * 1.13: the latest version of 1.13
     * 1.14: the latest version of 1.14
     *
     * @default LATEST
     */
    readonly version?: 'LATEST' | 'PREVIOUS' | '1.11' | '1.12' | '1.13' | '1.14';

    /**
     * Accept EULA
     *
     * @default false
     */
    readonly eula?: boolean;
}

const DEFAULT_IPV4_PORT = 19132;
const DEFAULT_IPV6_PORT = 19133;

export class BedrockWorld extends BaseWorld implements IWorld {

    constructor(scope: Construct, id: string, props: MinecraftBedrockWorldProps) {
        const ipv4Port = props.ipv4Port ?? DEFAULT_IPV4_PORT;
        const ipv6Port = props.ipv6Port ?? DEFAULT_IPV6_PORT;
        const environment = BedrockWorld.createEnvironment(props);

        const addDefaultContainer = (task: TaskDefinition, logging?: LogDriver) => {
            const minecraftContainer = task.addContainer('MinecraftContainer', {
                environment,
                image: ContainerImage.fromRegistry('itzg/minecraft-bedrock-server'),
                logging
            });

            minecraftContainer.addPortMappings({
                containerPort: ipv4Port,
                protocol: Protocol.UDP
            });
            if (ipv4Port !== ipv6Port) {
                minecraftContainer.addPortMappings({
                    containerPort: ipv6Port,
                    protocol: Protocol.UDP
                });
            }
            minecraftContainer.addMountPoints({
                containerPath: '/data',
                readOnly: false,
                sourceVolume: 'efs'
            });
        };

        super(scope, id, props, addDefaultContainer);

        this.service.connections.allowFrom(Peer.anyIpv4(), Port.udp(ipv4Port), 'Minecraft server port');
        this.service.connections.allowFrom(Peer.anyIpv6(), Port.udp(ipv6Port), 'Minecraft server port');
    }

    private static createEnvironment(props: MinecraftBedrockWorldProps) {
        const environment: { [key: string]: string } = {};

        if (props.version) {
            environment.VERSION = props.version;
        }
        if (props.eula) {
            environment.EULA = String(props.eula);
        }

        return environment;
    }

}
