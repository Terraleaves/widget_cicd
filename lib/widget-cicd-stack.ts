import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { ProductionDeployStage } from "./production-deploy-stage";
import * as iam from "aws-cdk-lib/aws-iam";

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

    const testRole = new iam.Role(this, "IntegrationTestRole", {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("codebuild.amazonaws.com"),
        new iam.ServicePrincipal("cloudformation.amazonaws.com"),
      ),
    });

    testRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess")
    );

    const unitTestStep = new cdk.pipelines.CodeBuildStep("UnitTest", {
      role: testRole,
      commands: ["npm ci", "npm test"],
    });

    const integrationTestStep = new cdk.pipelines.CodeBuildStep(
      "IntegrationTest",
      {
        role: testRole,
        commands: ["npm ci", "npm run integ-test"],
      }
    );

    deployStage.addPre(unitTestStep);

    deployStage.addPre(integrationTestStep);
  }
}
