#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { WidgetCicdStack } from "../lib/widget-cicd-stack";

const app = new cdk.App();
new WidgetCicdStack(app, "WidgetCicdStack");
