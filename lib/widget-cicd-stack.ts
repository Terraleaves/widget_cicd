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

    const pipeline = this.createPipeline();

    this.createTestStage(pipeline);
    this.createDeployStage(pipeline);
  }

  private createPipeline(): cdk.pipelines.CodePipeline {
    return new CodePipeline(this, "Pipeline", {
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
  }

  private createTestStage(pipeline: cdk.pipelines.CodePipeline): void {
    const testStage = new cdk.Stage(this, "Test", {
      stageName: "TestStage",
    });

    const pipelineTestStage = pipeline.addStage(testStage);

    // Create test role
    const testRole = this.createTestRole();

    // Create unit tes step
    const unitTestStep = new cdk.pipelines.CodeBuildStep("UnitTest", {
      role: testRole,
      commands: ["npm ci", "npm test"],
    });

    // Create integration test step
    const integrationTestStep = new cdk.pipelines.CodeBuildStep(
      "IntegrationTest",
      {
        role: testRole,
        commands: ["npm ci", "npm run integ-test"],
      }
    );

    // Add steps into test stage
    pipelineTestStage.addPre(unitTestStep);
    pipelineTestStage.addPost(integrationTestStep);
  }

  private createDeployStage(pipeline: cdk.pipelines.CodePipeline) {
    pipeline.addStage(
      new ProductionDeployStage(this, "Deploy", {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: process.env.CDK_DEFAULT_REGION,
        },
      })
    );
  }

  private createTestRole(): cdk.aws_iam.Role {
    const testRole = new iam.Role(this, "PipelineTestRole", {
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("codebuild.amazonaws.com"),
        new iam.ServicePrincipal("cloudformation.amazonaws.com")
      ),
    });

    testRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess")
    );

    return testRole;
  }
}
