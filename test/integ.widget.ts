import * as cdk from "aws-cdk-lib";

import { ExpectedResult, IntegTest } from "@aws-cdk/integ-tests-alpha";
import { IntegrationTestStack } from "./integration-test-stack";

const app = new cdk.App();

const testStack = new IntegrationTestStack(app, "IntegrationTestStack", {
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

const dns = cdk.Fn.importValue("test-lbDNS");

integ.assertions
  .httpApiCall(`http://${dns}`)
  .expect(ExpectedResult.objectLike({ status: 200 }));
