import * as cdk from "aws-cdk-lib";
import { WidgetCdkStack } from "../lib/widget-app-stack";
import { ExpectedResult, IntegTest } from "@aws-cdk/integ-tests-alpha";

const app = new cdk.App();

const testStack = new WidgetCdkStack(app, "IntegrationTestStack", {
  description: "Integration test stack",
});

const integ = new IntegTest(app, "Resource creation", {
  testCases: [testStack],
  cdkCommandOptions: {
    destroy: {
      args: {
        force: true,
      },
    },
  },
  regions: [testStack.region],
});

const dns = testStack.lbDnsName;

integ.assertions
  .httpApiCall(`http://${dns}`)
  .expect(ExpectedResult.objectLike({ status: 200 }));
