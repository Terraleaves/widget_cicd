import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ManualApprovalStep,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { ProductionDeployStage } from "./production-deploy-stage";
import {
  ManagedPolicy,
  Role,
  ServicePrincipal,
  PolicyStatement,
  Effect,
} from "aws-cdk-lib/aws-iam";

require("dotenv").config();

export class WidgetCicdStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const pipelineServiceRole = new Role(this, "PipelineServiceRole", {
      assumedBy: new ServicePrincipal("codebuild.amazonaws.com"),
    });


    pipelineServiceRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ["*"],
        actions: ["*"],
      })
    );

    pipelineServiceRole.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess")
    );

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
        commands: ["npm ci", "npm run integ-test"]
      })
    );
  }
}
