import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { FastifyAppStack } from '../lib/fastify-app-stack';

test('FastifyApp Stack', () => {
    const app = new cdk.App();
    const stack = new FastifyAppStack(app, 'andreiox-fastify-test');

    expectCDK(stack).to(haveResource('AWS::ElasticLoadBalancingV2::LoadBalancer'));
    expectCDK(stack).to(
        haveResource('AWS::ECS::TaskDefinition', (props: any) => {
            const isImageCorrect =
                props.ContainerDefinitions[0].Image ===
                'andreiox/fastify-test-drive';
            const isPortCorrect =
                props.ContainerDefinitions[0].PortMappings[0].ContainerPort === 3000;

            return isImageCorrect && isPortCorrect;
        }),
    );
    expectCDK(stack).to(
        haveResource('AWS::ApplicationAutoScaling::ScalingPolicy', (props: any) => {
            return props.TargetTrackingScalingPolicyConfiguration.TargetValue === 70;
        }),
    );

    expectCDK(stack).to(haveResource('AWS::CodePipeline::Pipeline'));
});
