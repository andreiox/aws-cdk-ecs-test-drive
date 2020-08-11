import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as Example from '../lib/example-stack';

test('Empty Stack', () => {
	const app = new cdk.App();
	const stack = new Example.ExampleStack(app, 'MyTestStack');

	expectCDK(stack).to(matchTemplate({ Resources: {} }, MatchStyle.EXACT));
});
