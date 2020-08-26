import {BaseWorld, BaseWorldProps, IWorld} from '../base-world';
import {ContainerImage, LogDriver, Protocol, TaskDefinition} from '@aws-cdk/aws-ecs';
import {IHostedZone, SrvRecord} from '@aws-cdk/aws-route53';
import {Peer, Port} from '@aws-cdk/aws-ec2';
import {Construct} from '@aws-cdk/core';
import {JavaWorldType} from './java-world-type';

export interface RconProps {

    /**
     * The rcon password
     *
     * @default minecraft
     */
    readonly password?: string;

    /**
     * The rcon port
     *
     * @default 25575
     */
    readonly port?: number;
}

export interface QueryProps {

    /**
     * The query port
     *
     * @default 25565
     */
    readonly port?: number;
}

export interface JavaWorldProps extends BaseWorldProps {

    /**
     * The port on which the server is listening
     *
     * @default 25565
     */
    readonly port?: number;

    /**
     * The hosted zone to create the SRV DNS record in
     */
    readonly hostedZone?: IHostedZone;

    /**
     * Use a specific server version
     *
     * LATEST: determines the latest version and can be used to auto-upgrade on container start
     * SNAPSHOT: determines the latest snapshot version and can be used to auto-upgrade on container start
     *
     * @default LATEST
     */
    readonly version?: 'LATEST' | 'SNAPSHOT' | string;

    /**
     * Accept EULA
     *
     * @default false
     */
    readonly eula?: boolean

    /**
     * Set the difficulty level
     *
     * @default easy
     */
    readonly difficulty?: 'peaceful' | 'easy' | 'normal' | 'hard';

    /**
     * Whitelist players for your Minecraft server
     */
    readonly whitelist?: string[];

    /**
     * Add more "op" (aka administrator) users to the Minecraft server
     */
    readonly ops?: string[];

    /**
     * Set the max number of players that are allowed to join the server at one time
     *
     * @default 20
     */
    readonly maxPlayers?: number;

    /**
     * This sets the maximum possible size in blocks, expressed as a radius, that the world border can obtain.
     *
     * @default 29999984
     */
    readonly maxWorldSize?: number;

    /**
     * Allows players to travel to the Nether.
     *
     * @default true
     */
    readonly allowNether?: boolean;

    /**
     * Allows server to announce when a player gets an achievement.
     *
     * @default true
     */
    readonly announcePlayerAchievements?: boolean;

    /**
     * Enables command blocks
     *
     * @default true
     */
    readonly enableCommandBlock?: boolean;

    /**
     * Force players to join in the default game mode.
     *
     * @default false
     */
    readonly forceGamemode?: boolean;

    /**
     * Defines whether structures (such as villages) will be generated.
     *
     * @default true
     */
    readonly generateStructures?: boolean;

    /**
     * If set to true, players will be set to spectator mode if they die.
     *
     * @default false
     */
    readonly hardcore?: boolean;

    /**
     * If set to false, the server will not send data to snoop.minecraft.net server.
     *
     * @default true
     */
    readonly snooperEnabled?: boolean

    /**
     * The maximum height in which building is allowed. Terrain may still naturally generate above a low height limit.
     *
     * @default 256
     */
    readonly maxBuildHeight?: number;

    /**
     * The maximum number of milliseconds a single tick may take before the server watchdog stops the server with the
     * message, A single server tick took 60.00 seconds (should be max 0.05); Considering it to be crashed, server will
     * forcibly shutdown. Once this criteria is met, it calls System.exit(1). Setting this to -1 will disable watchdog
     * entirely.
     *
     * @default 60000
     */
    readonly maxTickTime?: number;

    /**
     * Determines if animals will be able to spawn.
     *
     * @default true
     */
    readonly spawnAnimals?: boolean;

    /**
     * Determines if monsters will be spawned.
     *
     * @default true
     */
    readonly spawnMonsters?: boolean;

    /**
     * Determines if villagers will be spawned.
     *
     * @default true
     */
    readonly spawnNpcs?: boolean;

    /**
     * Sets the area that non-ops can not edit (0 to disable)
     *
     * @default 16
     */
    readonly spawnProtection?: number;

    /**
     * Set the amount of world data the server sends the client, measured in chunks in each direction of the player
     * (radius, not diameter). It determines the server-side viewing distance.
     *
     * @default 10
     */
    readonly viewDistance?: number;

    /**
     * Create the Minecraft level with a specific seed
     */
    readonly seed?: string;

    /**
     * Change the default game mode
     *
     * @default survival
     */
    readonly mode?: 'creative' | 'survival' | 'adventure' | 'spectator';

    /**
     * The message of the day, shown below each server entry in the UI
     *
     * @default computed from the server type and version
     */
    readonly messageOfTheDay?: string;

    /**
     * Set the player-vs-player (PVP) mode
     *
     * @default true (PVP enabled)
     */
    readonly pvp?: boolean;

    /**
     * @default standard world is generated with hills, valleys, water, etc.
     */
    readonly levelType?: 'DEFAULT' | 'FLAT' | 'LARGEBIOMES' | 'AMPLIFIED' | 'CUSTOMIZED' | 'BUFFET' | 'TERRAFORGED'

    /**
     * Modded server type
     */
    readonly type?: JavaWorldType;
}

const DEFAULT_MINECRAFT_PORT = 25565;
const DEFAULT_RCON_PORT = 25575;

const DEFAULT_MEMORY_LIMIT = 512;
const INIT_MEMORY_PERCENTAGE = 0.5;
const MAX_MEMORY_PERCENTAGE = 0.8;

export class JavaWorld extends BaseWorld implements IWorld {

    private readonly environmentVariables: { [key: string]: string };

    constructor(scope: Construct, id: string, props?: JavaWorldProps) {
        const minecraftPort = props?.port ?? DEFAULT_MINECRAFT_PORT;
        const environment = JavaWorld.createEnvironment(props);

        const addDefaultContainer = (task: TaskDefinition, logging?: LogDriver) => {
            const registryName = `itzg/minecraft-server${props?.type?.type === 'FTBA' ? ':multiarch' : ''}`;
            const minecraftContainer = task.addContainer('MinecraftContainer', {
                environment,
                image: ContainerImage.fromRegistry(registryName),
                logging
            });

            minecraftContainer.addPortMappings({
                containerPort: minecraftPort,
                protocol: Protocol.TCP
            });
            minecraftContainer.addMountPoints({
                containerPath: '/data',
                readOnly: false,
                sourceVolume: 'efs'
            });
        };

        super(scope, id, addDefaultContainer, props);

        this.environmentVariables = environment;

        this.service.connections.allowFrom(Peer.anyIpv4(), Port.tcp(minecraftPort), 'Minecraft server port');
        this.service.connections.allowFrom(Peer.anyIpv6(), Port.tcp(minecraftPort), 'Minecraft server port');

        if (props?.hostedZone) {
            new SrvRecord(this, 'ServiceRecord', {
                recordName: `_minecraft._tcp.${props.hostName}.`,
                values: [{
                    hostName: `${props.hostName}.`,
                    port: minecraftPort,
                    priority: 1,
                    weight: 1
                }],
                zone: props?.hostedZone
            });
        }
    }

    enableRCON(props?: RconProps): void {
        this.environmentVariables.ENABLE_RCON = String(true);
        if (props?.password) {
            this.environmentVariables.RCON_PASSWORD = props.password;
        }
        if (props?.port) {
            this.environmentVariables.RCON_PORT = String(props.port);
        }

        const rconPort = props?.port ?? DEFAULT_RCON_PORT;

        this.task.defaultContainer?.addPortMappings({
            containerPort: rconPort,
            protocol: Protocol.TCP
        });

        // eslint-disable-next-line no-warning-comments
        // TODO: limit rcon port ingress
        this.service.connections.allowFrom(Peer.anyIpv4(), Port.tcp(rconPort), 'Minecraft rcon port for Web Admin');
        this.service.connections.allowFrom(Peer.anyIpv6(), Port.tcp(rconPort), 'Minecraft rcon port for Web Admin');
    }

    enableQuery(props?: QueryProps): void {
        this.environmentVariables.ENABLE_QUERY = String(true);
        if (props?.port) {
            this.environmentVariables.QUERY_PORT = String(props.port);
        }

        const queryPort = props?.port ?? DEFAULT_MINECRAFT_PORT;

        this.task.defaultContainer?.addPortMappings({
            containerPort: queryPort,
            protocol: Protocol.TCP
        });

        this.service.connections.allowFrom(Peer.anyIpv4(), Port.tcp(queryPort), 'Minecraft query port');
        this.service.connections.allowFrom(Peer.anyIpv6(), Port.tcp(queryPort), 'Minecraft query port');
    }

    // eslint-disable-next-line max-lines-per-function,max-statements,complexity
    private static createEnvironment(props?: JavaWorldProps) {
        const memoryLimitMiB = props?.resources?.memoryLimitMiB ?? DEFAULT_MEMORY_LIMIT;
        const environment: { [key: string]: string } = {
            ENABLE_RCON: String(false),
            // Set initial memory to 50% of memory limit
            INIT_MEMORY: `${Math.floor(memoryLimitMiB * INIT_MEMORY_PERCENTAGE)}M`,
            // Set max java heap size to 80% of memory limit
            MAX_MEMORY: `${Math.floor(memoryLimitMiB * MAX_MEMORY_PERCENTAGE)}M`,
            USE_AIKAR_FLAGS: String(true)
        };

        if (props?.port) {
            environment.SERVER_PORT = String(props.port);
        }
        if (props?.version) {
            environment.VERSION = props.version;
        }
        if (props?.eula) {
            environment.EULA = String(props.eula);
        }
        if (props?.difficulty) {
            environment.DIFFICULTY = props.difficulty;
        }
        if (props?.whitelist) {
            environment.WHITELIST = props.whitelist.join(',');
        }
        if (props?.ops) {
            environment.OPS = props.ops.join(',');
        }
        if (props?.maxPlayers) {
            environment.MAX_PLAYERS = String(props.maxPlayers);
        }
        if (props?.maxWorldSize) {
            environment.MAX_WORLD_SIZE = String(props.maxWorldSize);
        }
        if (props?.allowNether !== undefined) {
            environment.ALLOW_NETHER = String(props.allowNether);
        }
        if (props?.announcePlayerAchievements !== undefined) {
            environment.ANNOUNCE_PLAYER_ACHIEVEMENTS = String(props.announcePlayerAchievements);
        }
        if (props?.enableCommandBlock !== undefined) {
            environment.ENABLE_COMMAND_BLOCK = String(props.enableCommandBlock);
        }
        if (props?.forceGamemode) {
            environment.FORCE_GAMEMODE = String(props.forceGamemode);
        }
        if (props?.generateStructures !== undefined) {
            environment.GENERATE_STRUCTURES = String(props.generateStructures);
        }
        if (props?.hardcore) {
            environment.HARDCORE = String(props.hardcore);
        }
        if (props?.snooperEnabled !== undefined) {
            environment.SNOOPER_ENABLED = String(props.snooperEnabled);
        }
        if (props?.maxBuildHeight) {
            environment.MAX_BUILD_HEIGHT = String(props.maxBuildHeight);
        }
        if (props?.maxTickTime) {
            environment.MAX_TICK_TIME = String(props.maxTickTime);
        }
        if (props?.spawnAnimals !== undefined) {
            environment.SPAWN_ANIMALS = String(props.spawnAnimals);
        }
        if (props?.spawnMonsters !== undefined) {
            environment.SPAWN_MONSTERS = String(props.spawnMonsters);
        }
        if (props?.spawnNpcs !== undefined) {
            environment.SPAWN_NPCS = String(props.spawnNpcs);
        }
        if (props?.spawnProtection !== undefined) {
            environment.SPAWN_PROTECTION = String(props.spawnProtection);
        }
        if (props?.viewDistance) {
            environment.VIEW_DISTANCE = String(props.viewDistance);
        }
        if (props?.seed) {
            environment.SEED = props.seed;
        }
        if (props?.mode) {
            environment.MODE = props.mode;
        }
        if (props?.messageOfTheDay) {
            environment.MOTD = props.messageOfTheDay;
        }
        if (props?.pvp !== undefined) {
            environment.PVP = String(props.pvp);
        }
        if (props?.levelType) {
            environment.LEVEL_TYPE = props.levelType;
        }
        if (props?.type?.type) {
            environment.TYPE = props.type.type;
        }
        if (props?.type?.environment) {
            for (const [key, value] of Object.entries(props.type.environment)) {
                if (value) {
                    environment[key] = value;
                }
            }
        }

        return environment;
    }

}
