#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ExampleStack } from '../lib/example-stack';

const app = new cdk.App();
new ExampleStack(app, 'ExampleStack');
