import * as dotenv from 'dotenv';
import * as cdk from '@aws-cdk/core';

import { FastifyAppStack } from '../lib/fastify-app-stack';

dotenv.config();

const app = new cdk.App();

new FastifyAppStack(app, 'andreiox-fastify-dev', {
    env: {
        account: process.env.AWS_ACCOUNT,
        region: process.env.AWS_REGION,
    },
});
