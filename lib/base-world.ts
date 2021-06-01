import {
    AdjustmentType,
    MetricAggregationType,
    ScalableTarget,
    ServiceNamespace,
    StepScalingAction
} from '@aws-cdk/aws-applicationautoscaling';
import {Alarm, ComparisonOperator, IMetric, Metric, MetricOptions, TreatMissingData} from '@aws-cdk/aws-cloudwatch';
import {BackupPlan, BackupResource} from '@aws-cdk/aws-backup';
import {
    BaseService,
    Cluster,
    ContainerImage,
    FargatePlatformVersion,
    FargateService,
    FargateTaskDefinition,
    ICluster,
    IService,
    LogDriver,
    PropagatedTagSource,
    Secret,
    TaskDefinition
} from '@aws-cdk/aws-ecs';
import {Construct, Duration, IConstruct, Stack, Tags} from '@aws-cdk/core';
import {EventField, Rule, RuleTargetInput, Schedule} from '@aws-cdk/aws-events';
import {FileSystem, IFileSystem} from '@aws-cdk/aws-efs';
import {ILogGroup, RetentionDays} from '@aws-cdk/aws-logs';
import {Peer, Port} from '@aws-cdk/aws-ec2';
import {PolicyStatement, Role} from '@aws-cdk/aws-iam';
import {ApplicationScalingAction} from '@aws-cdk/aws-cloudwatch-actions';
import {IHostedZone} from '@aws-cdk/aws-route53';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {MetricPublisherEventDetail} from './base-world.metric-publisher-function';
import {NodejsFunction} from '@aws-cdk/aws-lambda-nodejs';
import {Tracing} from '@aws-cdk/aws-lambda';

export interface IWorld extends IConstruct {

    /**
     * The ECS service this world is running in
     */
    readonly service: IService;

    /**
     * The EFS file system this world's data is stored in
     */
    readonly fileSystem: IFileSystem;

    /**
     * @returns {IMetric} the given named metric for this world
     * @param {string} metricName the given metric
     * @param {MetricOptions} props to use for metric
     */
    metric(metricName: string, props?: MetricOptions): IMetric;

    metricPing(props?: MetricOptions): IMetric;

    metricPlayersOnline(props?: MetricOptions): IMetric;

    metricPlayersMax(props?: MetricOptions): IMetric;

    metricCpuUtilization(props?: MetricOptions): IMetric;

    metricMemoryUtilization(props?: MetricOptions): IMetric;

}

export interface BaseWorldProps {

    /**
     * The ECS cluster to run this world in
     *
     * @default create a new cluster
     */
    readonly cluster?: ICluster;

    readonly dns: {

        /**
         * The hosted zone to create DNS entries for this world in
         */
        readonly hostedZone: IHostedZone;

        /**
         * The host name of this world
         */
        readonly hostName: string;
    }

    readonly logging?: {

        /**
         * Prefix for the log streams
         *
         * The awslogs-stream-prefix option allows you to associate a log stream
         * with the specified prefix, the container name, and the ID of the Amazon
         * ECS task to which the container belongs. If you specify a prefix with
         * this option, then the log stream takes the following format:
         *
         *     prefix-name/container-name/ecs-task-id
         *
         * @default the world id
         */
        readonly streamPrefix?: string;

        /**
         * The log group to log to
         *
         * @default - A log group is automatically created.
         */
        readonly logGroup?: ILogGroup;

        /**
         * The number of days log events are kept in CloudWatch Logs when the log
         * group is automatically created by this construct.
         *
         * @default - Logs never expire.
         */
        readonly logRetention?: RetentionDays;
    }

    readonly resources?: {

        /**
         * The number of cpu units used by the task. You must use one of the following values, which determines your
         * range of valid values for the memory parameter:
         *
         * 256 (.25 vCPU) - Available memory values: 512 (0.5 GB), 1024 (1 GB), 2048 (2 GB)
         * 512 (.5 vCPU)  - Available memory values: 1024 (1 GB), 2048 (2 GB), 3072 (3 GB), 4096 (4 GB)
         * 1024 (1 vCPU)  - Available memory values: 2048 (2 GB), 3072 (3 GB), 4096 (4 GB), 5120 (5 GB), 6144 (6 GB),
         *                                           7168 (7 GB), 8192 (8 GB)
         * 2048 (2 vCPU)  - Available memory values: Between 4096 (4 GB) and 16384 (16 GB) in increments of 1024 (1 GB)
         * 4096 (4 vCPU)  - Available memory values: Between 8192 (8 GB) and 30720 (30 GB) in increments of 1024 (1 GB)
         *
         * @default 256
         */
        readonly cpu?: number;

        /**
         * The amount (in MiB) of memory used by the task. You must use one of the following values, which determines
         * your range of valid values for the cpu parameter:
         *
         * 512 (0.5 GB), 1024 (1 GB), 2048 (2 GB)                            - Available cpu values: 256 (.25 vCPU)
         * 1024 (1 GB), 2048 (2 GB), 3072 (3 GB), 4096 (4 GB)                 - Available cpu values: 512 (.5 vCPU)
         * 2048 (2 GB), 3072 (3 GB), 4096 (4 GB), 5120 (5 GB), 6144 (6 GB), 7168 (7 GB), 8192 (8 GB)
         *                                                                    - Available cpu values: 1024 (1 vCPU)
         * Between 4096 (4 GB) and 16384 (16 GB) in increments of 1024 (1 GB) - Available cpu values: 2048 (2 vCPU)
         * Between 8192 (8 GB) and 30720 (30 GB) in increments of 1024 (1 GB) - Available cpu values: 4096 (4 vCPU)
         *
         * @default 512
         */
        readonly memoryLimitMiB?: number;

        /**
         * Stop the world when there are no players online
         *
         * @default true
         */
        readonly enableAutoscaling?: boolean;

        /**
         * The amount of time to wait after to scale down
         *
         * @default 15 minutes
         */
        readonly autoscaleDelay?: Duration;
    };

    readonly storage?: {

        /**
         * The EFS file system to store this world's data in
         *
         * @default create a new file system
         */
        readonly fileSystem?: IFileSystem;

        /**
         * The directory within the Amazon EFS file system to mount as the root directory inside the host.
         * Specifying / will have the same effect as omitting this parameter.
         *
         * @default The root of the Amazon EFS volume
         */
        readonly rootDirectory?: string;

        /**
         * Enables automatic backups for this world using AWS Backup
         *
         * @default true
         */
        readonly enableBackup?: boolean

        /**
         * Configures a custom backup plan for this world
         *
         * @default Daily and monthly with 1 year retention
         */
        readonly backupPlan?: BackupPlan;
    }

    /**
     * Enable AWS X-Ray Tracing for Lambda Functions
     *
     * @default Tracing.Disabled
     */
    readonly tracing?: Tracing;

}

export abstract class BaseWorld extends Construct implements IWorld {

    readonly service: BaseService;

    readonly fileSystem: IFileSystem;

    protected readonly task: TaskDefinition;

    private readonly logging: LogDriver;

    // eslint-disable-next-line max-lines-per-function,max-statements,max-params
    protected constructor(
        scope: Construct,
        id: string,
        props: BaseWorldProps,
        addDefaultContainer: (task: TaskDefinition, logging?: LogDriver) => void
    ) {
        super(scope, id);

        this.logging = LogDriver.awsLogs({
            streamPrefix: props.logging?.streamPrefix ?? id,
            ...props.logging
        });

        Tags.of(this).add('minecraft:worldName', id);

        const cluster = props.cluster ?? new Cluster(this, 'Cluster');

        this.fileSystem = props.storage?.fileSystem ?? new FileSystem(this, 'FileSystem', {
            encrypted: true,
            vpc: cluster.vpc
        });

        // Create a default backup plan or use the provided backup plan if backups are enabled
        const enableBackup = props.storage?.enableBackup === undefined ? true : props.storage.enableBackup;

        if (enableBackup) {
            const backupPlan = props.storage?.backupPlan ??
                BackupPlan.dailyMonthly1YearRetention(this, 'BackupPlan');

            backupPlan.addSelection(`${id}FileSystemSelection`, {
                resources: [
                    BackupResource.fromEfsFileSystem(this.fileSystem)
                ]
            });
        }

        this.task = new FargateTaskDefinition(this, 'Task', {
            cpu: props.resources?.cpu,
            memoryLimitMiB: props.resources?.memoryLimitMiB,
            volumes: [{
                efsVolumeConfiguration: {
                    fileSystemId: this.fileSystem.fileSystemId,
                    rootDirectory: props.storage?.rootDirectory,
                    transitEncryption: 'ENABLED'
                },
                name: 'efs'
            }]
        });
        addDefaultContainer(this.task, this.logging);

        const enableAutoscaling = props.resources?.enableAutoscaling === undefined
            ? true
            : props.resources.enableAutoscaling;

        this.service = new FargateService(this, 'Service', {
            assignPublicIp: true,
            cluster,
            // eslint-disable-next-line no-magic-numbers
            desiredCount: enableAutoscaling ? 0 : 1,
            enableECSManagedTags: true,
            maxHealthyPercent: 100,
            platformVersion: FargatePlatformVersion.LATEST,
            propagateTags: PropagatedTagSource.SERVICE,
            taskDefinition: this.task
        });
        this.fileSystem.connections.allowDefaultPortFrom(this.service);

        // Enable autoscaling
        if (enableAutoscaling) {
            // eslint-disable-next-line no-magic-numbers
            const autoscaleDelay = props.resources?.autoscaleDelay ?? Duration.minutes(15);

            this.enableAutoscaling(autoscaleDelay);
        }

        //this.createRoute53Updater(props.dns.hostedZone, props.tracing);
        this.createMetricPublisher(props.dns.hostName, props.tracing);
    }

    private enableAutoscaling(autoscaleDelay: Duration) {
        const serviceTarget = new ScalableTarget(this, 'ServiceTarget', {
            maxCapacity: 1,
            minCapacity: 0,
            resourceId: `service/${this.service.cluster.clusterName}/${this.service.serviceName}`,
            role: Role.fromRoleArn(this, 'ScalingRole', Stack.of(this).formatArn({
                region: '',
                resource: 'role/aws-service-role/ecs.application-autoscaling.amazonaws.com',
                resourceName: 'AWSServiceRoleForApplicationAutoScaling_ECSService',
                service: 'iam'
            })),
            scalableDimension: 'ecs:service:DesiredCount',
            serviceNamespace: ServiceNamespace.ECS
        });
        const scaleDownAction = new StepScalingAction(this, 'ServiceScaleDownAction', {
            adjustmentType: AdjustmentType.EXACT_CAPACITY,
            metricAggregationType: MetricAggregationType.MAXIMUM,
            scalingTarget: serviceTarget
        });

        scaleDownAction.addAdjustment({
            adjustment: 0,
            upperBound: 0
        });

        // Assuming metric publish rate of 1 minute
        const datapointsToAlarm = autoscaleDelay.toMinutes();
        const evaluationPeriods = datapointsToAlarm;

        new Alarm(this, 'ServiceScaleDownAlarm', {
            comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
            datapointsToAlarm,
            evaluationPeriods,
            metric: this.metricPlayersOnline({
                // eslint-disable-next-line no-magic-numbers
                period: Duration.minutes(1),
                statistic: 'Maximum'
            }),
            threshold: 1,
            treatMissingData: TreatMissingData.NOT_BREACHING
        }).addAlarmAction(new ApplicationScalingAction(scaleDownAction));
    }

    /**
     * Create the Route 53 updater function
     *
     * TODO: replace with service discovery when it supports public IP addresses
     * TODO: can be made a singleton function
     *
     * @param {IHostedZone} hostedZone the hosted zone to create DNS records in
     * @param {Tracing} tracing Enable AWS X-Ray Tracing for Lambda Functions
     * @returns {void}
     * @private
     */
    private createRoute53Updater(hostedZone: IHostedZone, tracing?: Tracing) {
        const route53UpdaterFunction = new NodejsFunction(this, 'route53-updater-function', {
            logRetention: RetentionDays.ONE_YEAR,
            minify: true,
            tracing
        });

        route53UpdaterFunction.addToRolePolicy(new PolicyStatement({
            actions: ['ec2:DescribeNetworkInterfaces'],
            resources: ['*']
        }));
        route53UpdaterFunction.addToRolePolicy(new PolicyStatement({
            actions: ['route53:ChangeResourceRecordSets'],
            resources: [Stack.of(this).formatArn({
                account: '',
                region: '',
                resource: 'hostedzone',
                resourceName: hostedZone.hostedZoneId,
                service: 'route53'
            })]
        }));

        const route53UpdaterFunctionRule = new Rule(this, 'Route53UpdaterFunctionRule', {
            eventPattern: {
                detail: {
                    clusterArn: [this.service.cluster.clusterArn],
                    containers: {
                        name: ['MinecraftContainer']
                    },
                    desiredStatus: ['RUNNING'],
                    lastStatus: ['RUNNING'],
                    taskDefinitionArn: [this.task.taskDefinitionArn]
                },
                detailType: ['ECS Task State Change'],
                source: ['aws.ecs']
            }
        });

        route53UpdaterFunctionRule.addTarget(new LambdaFunction(route53UpdaterFunction));
    }

    /**
     * Create the metric publisher function
     *
     * TODO: can be made a singleton function
     *
     * @param {string} hostName the hostname of the world to publish metrics for
     * @param {Tracing} tracing Enable AWS X-Ray Tracing for Lambda Functions
     * @returns {void}
     * @private
     */
    private createMetricPublisher(hostName: string, tracing?: Tracing) {
        const metricPublisherFunction = new NodejsFunction(this, 'metric-publisher-function', {
            logRetention: RetentionDays.ONE_DAY,
            minify: true,
            tracing
        });

        Metric.grantPutMetricData(metricPublisherFunction);

        const metricPublisherFunctionSchedule = new Rule(this, 'MetricPublisherFunctionSchedule', {
            // eslint-disable-next-line no-magic-numbers
            schedule: Schedule.rate(Duration.minutes(1))
        });

        const eventDetail: MetricPublisherEventDetail = {
            clusterName: this.service.cluster.clusterName,
            hostName,
            serviceName: this.service.serviceName
        };

        metricPublisherFunctionSchedule.addTarget(new LambdaFunction(metricPublisherFunction, {
            event: RuleTargetInput.fromObject({
                'account': EventField.account,
                'detail': eventDetail,
                'detail-type': EventField.detailType,
                'id': EventField.eventId,
                'region': EventField.region,
                'resources': EventField.fromPath('$.resources'),
                'source': EventField.source,
                'time': EventField.time,
                'version': EventField.fromPath('$.version')
            })
        }));
    }

    /**
     * Add a SFTP server to this world
     *
     * @param {Secret} users A secret containing the SFTP users in the format of username:password
     * @returns {void}
     */
    enableSftp(users: Secret): void {
        const sftpContainer = this.task.addContainer('SftpContainer', {
            essential: false,
            image: ContainerImage.fromRegistry('atmoz/sftp'),
            logging: this.logging,
            secrets: {
                SFTP_USERS: users
            }
        });

        sftpContainer.addPortMappings({containerPort: 22});
        sftpContainer.addMountPoints({
            containerPath: '/home/engineal/data',
            readOnly: false,
            sourceVolume: 'efs'
        });

        // eslint-disable-next-line no-magic-numbers
        this.service.connections.allowFrom(Peer.anyIpv4(), Port.tcp(22), 'SFTP port');
        // eslint-disable-next-line no-magic-numbers
        this.service.connections.allowFrom(Peer.anyIpv6(), Port.tcp(22), 'SFTP port');
    }

    metric(metricName: string, props?: MetricOptions): IMetric {
        return new Metric({
            dimensions: {
                ClusterName: this.service.cluster.clusterName,
                ServiceName: this.service.serviceName
            },
            metricName,
            namespace: 'Minecraft',
            ...props
        }).attachTo(this);
    }

    metricPing(props?: MetricOptions): IMetric {
        return this.metric('Ping', props);
    }

    metricPlayersOnline(props?: MetricOptions): IMetric {
        return this.metric('PlayersOnline', props);
    }

    metricPlayersMax(props?: MetricOptions): IMetric {
        return this.metric('PlayersMax', props);
    }

    metricCpuUtilization(props?: MetricOptions): IMetric {
        return this.service.metricCpuUtilization(props);
    }

    metricMemoryUtilization(props?: MetricOptions): IMetric {
        return this.service.metricMemoryUtilization(props);
    }

}
