import * as dotenv from 'dotenv';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';
import * as cdk from '@aws-cdk/core';
import * as codepipeline from '@aws-cdk/aws-codepipeline';
import * as codepipeline_actions from '@aws-cdk/aws-codepipeline-actions';
import * as codebuild from '@aws-cdk/aws-codebuild';

dotenv.config();

class FastifyAppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'FastifyAppVpc', { maxAzs: 2 });
    const cluster = new ecs.Cluster(this, 'FastifyAppCluster', { vpc });

    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'FastifyAppFargateService',
      {
        cluster,
        taskImageOptions: {
          containerPort: 3000,
          image: ecs.ContainerImage.fromRegistry('andreiox/fastify-test-drive'),
        },
      },
    );

    const scalling = fargateService.service.autoScaleTaskCount({ maxCapacity: 2 });
    scalling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    const pipeline = new codepipeline.Pipeline(this, 'FastifyAppPipeline', {
      pipelineName: 'fastify-app-pipeline',
    });

    const sourceArtifact = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: 'GitHub',
      branch: 'aws-pipeline-support',
      output: sourceArtifact,
      oauthToken: cdk.SecretValue.plainText(process.env.GITHUB_TOKEN!),
      trigger: codepipeline_actions.GitHubTrigger.POLL,
      owner: process.env.GITHUB_OWNER!,
      repo: process.env.GITHUB_REPO!,
    });

    const sourceStage = pipeline.addStage({
      stageName: 'Source',
      actions: [sourceAction],
    });

    const buildArtifact = new codepipeline.Artifact();
    const buildProject = new codebuild.PipelineProject(this, 'FastifyAppBuild', {
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

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Build',
          project: buildProject,
          input: sourceArtifact,
          outputs: [buildArtifact],
        }),
      ],
      placement: {
        justAfter: sourceStage,
      },
    });
  }
}

export { FastifyAppStack };
