import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { ProductionDeployStage } from "./production-deploy-stage";

require("dotenv").config();

export class WidgetCicdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipeline = new CodePipeline(this, "Pipeline", {
      pipelineName: "WidgetPipeline",
      synth: new ShellStep("Synth", {
        input: CodePipelineSource.connection(
          "Terraleaves/widget_cicd",
          "master",
          {
            // Use CodeStar connection
            connectionArn:
              "arn:aws:codeconnections:ap-southeast-2:116981789059:connection/40bc72e5-4f17-4152-99b1-1b1e86c06876",
          }
        ),
        commands: ["npm ci", "npm run build", "npx cdk synth"],
        primaryOutputDirectory: "cdk.out",
      }),
    });


    const deployStage = pipeline.addStage(
      new ProductionDeployStage(this, "Deploy", {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: process.env.CDK_DEFAULT_REGION,
        },
      })
    );

    deployStage.addPre(
      new ShellStep("UnitTest", {
        commands: ["npm ci", "npm test"]
      })
    );

    deployStage.addPre(
      new ShellStep("IntegrationTest", {
        commands: ["npm ci", "npm run integ-test-synth", "npm run integ-test"]
      })
    );
  }
}
