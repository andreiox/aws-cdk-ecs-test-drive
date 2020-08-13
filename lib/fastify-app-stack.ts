import * as dotenv from 'dotenv';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';
import * as cdk from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codebuild from '@aws-cdk/aws-codebuild';

dotenv.config();

interface StageInterface {
    artifact: codepipeline.Artifact;
    stage: codepipeline.IStage;
}

class FastifyAppStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'vpc', { maxAzs: 2 });
        const cluster = new ecs.Cluster(this, 'cluster', { vpc });

        const fargateService = this.createFargateService(cluster);

        const pipeline = new codepipeline.Pipeline(this, 'appPipeline');

        const source = this.createSourceStage(pipeline);
        const build = this.createBuildStage(pipeline, source);
        this.createDeployStage(pipeline, build, fargateService.service);
    }

    createFargateService(
        cluster: ecs.ICluster,
    ): ecs_patterns.ApplicationLoadBalancedFargateService {
        const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
            this,
            'fargateService',
            {
                cluster,
                taskImageOptions: {
                    containerName: 'app',
                    containerPort: 3000,
                    image: ecs.ContainerImage.fromRegistry(
                        'andreiox/fastify-test-drive',
                    ),
                },
            },
        );

        this.createAutoScaleForService(fargateService.service);

        return fargateService;
    }

    createAutoScaleForService(service: ecs.FargateService): void {
        const scalling = service.autoScaleTaskCount({ maxCapacity: 2 });
        scalling.scaleOnCpuUtilization('CpuScaling', {
            targetUtilizationPercent: 70,
            scaleInCooldown: cdk.Duration.seconds(60),
            scaleOutCooldown: cdk.Duration.seconds(60),
        });
    }

    createSourceStage(pipeline: codepipeline.Pipeline): StageInterface {
        const artifact = new codepipeline.Artifact();

        const stage = pipeline.addStage({
            stageName: 'Source',
            actions: [
                new codepipeline_actions.GitHubSourceAction({
                    actionName: 'GitHub',
                    branch: 'master',
                    output: artifact,
                    oauthToken: cdk.SecretValue.plainText(process.env.GITHUB_TOKEN!),
                    trigger: codepipeline_actions.GitHubTrigger.POLL,
                    owner: process.env.GITHUB_OWNER!,
                    repo: process.env.GITHUB_REPO!,
                }),
            ],
        });

        return { artifact, stage };
    }

    createBuildStage(pipeline: codepipeline.Pipeline, source: StageInterface) {
        const artifact = new codepipeline.Artifact();

        const buildProject = new codebuild.PipelineProject(this, 'appBuild', {
            buildSpec: codebuild.BuildSpec.fromObject(this.getFastifyAppBuildspec()),
            environment: {
                computeType: codebuild.ComputeType.SMALL,
                buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
                privileged: true,
                environmentVariables: {
                    DOCKER_HUB_USER: { value: process.env.DOCKER_HUB_USER! },
                    DOCKER_HUB_PASSWORD: { value: process.env.DOCKER_HUB_PASSWORD! },
                    IMAGE_REPO_NAME: { value: process.env.IMAGE_REPO_NAME! },
                    IMAGE_TAG: { value: process.env.IMAGE_TAG! },
                },
            },
        });

        const stage = pipeline.addStage({
            stageName: 'Build',
            actions: [
                new codepipeline_actions.CodeBuildAction({
                    actionName: 'Build',
                    project: buildProject,
                    input: source.artifact,
                    outputs: [artifact],
                }),
            ],
            placement: {
                justAfter: source.stage,
            },
        });

        return { artifact, stage };
    }

    createDeployStage(
        pipeline: codepipeline.Pipeline,
        build: StageInterface,
        service: ecs.FargateService,
    ): void {
        pipeline.addStage({
            stageName: 'Deploy',
            actions: [
                new codepipeline_actions.EcsDeployAction({
                    actionName: 'Deploy',
                    service: service,
                    input: build.artifact,
                }),
            ],
            placement: {
                justAfter: build.stage,
            },
        });
    }

    getFastifyAppBuildspec() {
        return {
            version: 0.2,
            phases: {
                pre_build: {
                    commands: [
                        'echo Logging in to Docker Hub...',
                        'docker login -u $DOCKER_HUB_USER -p $DOCKER_HUB_PASSWORD',
                    ],
                },
                build: {
                    commands: [
                        'echo Build started on `date`',
                        'echo Building the Docker image...',
                        'docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .',
                        'docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $IMAGE_REPO_NAME:$IMAGE_TAG',
                    ],
                },
                post_build: {
                    commands: [
                        'echo Build completed on `date`',
                        'echo Pushing the Docker image...',
                        'docker push $IMAGE_REPO_NAME:$IMAGE_TAG',
                        'printf \'[{"name":"app","imageUri":"%s"}]\' "$IMAGE_REPO_NAME:$IMAGE_TAG" > imagedefinitions.json',
                    ],
                },
            },
            artifacts: {
                files: 'imagedefinitions.json',
            },
        };
    }
}

export { FastifyAppStack };
