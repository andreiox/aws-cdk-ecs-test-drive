import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as ecs_patterns from '@aws-cdk/aws-ecs-patterns';
import * as cdk from '@aws-cdk/core';

class FastifyAppStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'FastifyAppVpc', { maxAzs: 2 });
    const cluster = new ecs.Cluster(this, 'FastifyAppCluster', { vpc });

    new ecs_patterns.ApplicationLoadBalancedFargateService(
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
  }
}

export { FastifyAppStack };
