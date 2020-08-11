# aws-cdk-ecs-test-drive

Taking AWS CDK for a spin!

## requirements

Looking to build a infra that has the following.

- [x] task definition
- [x] ecs cluster
- [x] application load balancer
- [ ] auto scaling
- [ ] ci/cd with codepipeline
- [ ] prod and homolog environments
- [ ] get env variables from aws parameter store

## usage

Outputs stack diff

```bash
npm run cdk diff
```

Deploy stack

```bash
npm run cdk deploy
```

Cleanup/Destroy stack

```bash
npm run cdk destroy
```

## examples

- [fargate with load balancer](https://github.com/aws-samples/aws-cdk-examples/tree/master/typescript/ecs/fargate-application-load-balanced-service/)
- [fargate with autoscaling](https://github.com/aws-samples/aws-cdk-examples/tree/master/typescript/ecs/fargate-service-with-auto-scaling/)

## references aws cdk

- [aws-cdk api reference](https://docs.aws.amazon.com/cdk/api/latest/docs/aws-construct-library.html)
- [aws cdk ecs_example](https://docs.aws.amazon.com/cdk/latest/guide/ecs_example.html)
- [aws cdk pipelines](https://docs.aws.amazon.com/cdk/latest/guide/cdk_pipeline.html)
- [aws cdk best practices](https://github.com/kevinslin/open-cdk)
- [cdk-constans](https://github.com/kevinslin/cdk-constants)
- [testing infra with aws cdk](https://aws.amazon.com/blogs/developer/testing-infrastructure-with-the-aws-cloud-development-kit-cdk/)
- [testing constructs](https://cdkworkshop.com/20-typescript/70-advanced-topics/100-construct-testing.html)

## references aws general

- [awesome-ecs](https://github.com/nathanpeck/awesome-ecs)
- [vpc and subnets guide](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Subnets.html#vpc-subnet-basics)
