import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { FastifyAppStack } from '../lib/fastify-app-stack';

test('FastifyApp Stack', () => {
  const app = new cdk.App();
  const stack = new FastifyAppStack(app, 'FastifyAppStack');

  expectCDK(stack).to(haveResource('AWS::ElasticLoadBalancingV2::LoadBalancer'));
  expectCDK(stack).to(
    haveResource('AWS::ECS::TaskDefinition', (props: any) => {
      const isImageCorrect =
        props.ContainerDefinitions[0].Image === 'andreiox/fastify-test-drive';
      const isPortCorrect =
        props.ContainerDefinitions[0].PortMappings[0].ContainerPort === 3000;

      return isImageCorrect && isPortCorrect;
    }),
  );
});
