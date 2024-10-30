#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { WidgetCicdStack } from "../lib/widget-cicd-stack";
require("dotenv").config()

const app = new cdk.App();

new WidgetCicdStack(app, "WidgetCicdStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
