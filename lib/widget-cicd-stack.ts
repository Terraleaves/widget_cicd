import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { WidgetPipelineAppStage } from "./pipeline-app-stage";

require("dotenv").config();

export class WidgetCicdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        account: process.env.AWS_ACCOUNT_NUMBER,
        region: process.env.AWS_REGION,
      },
    });

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "WidgetPipeline",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.connection(
          "Terraleaves/widget_cicd",
          "master",
          {
            // Use CodeStar connection
            connectionArn:
              "arn:aws:codestar-connections:us-east-2:325861338157:connection/dc5275a2-85db-48f1-91e2-a1aac8496373",
          }
        ),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
        primaryOutputDirectory: "cdk.out",
      }),
    });

    const deployStage = pipeline.addStage(
      new WidgetPipelineAppStage(this, "Deploy", {
        env: {
          account: process.env.AWS_ACCOUNT_NUMBER,
          region: process.env.AWS_REGION,
        },
      })
    );

    deployStage.addPre(
      new ShellStep("Test", {
        commands: ["npm test"],
      })
    );
  }
}
