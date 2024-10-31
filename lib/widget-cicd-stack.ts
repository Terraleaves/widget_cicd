import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ManualApprovalStep,
  ShellStep,
} from "aws-cdk-lib/pipelines";
import { IntegrationTestStage } from "./integration-test-stage";
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
      assumedBy: new ServicePrincipal("codepipeline.amazonaws.com"),
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

    const integrationTest = new IntegrationTestStage(this, "Test", {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });

    const testStage = pipeline.addStage(integrationTest);

    testStage.addPre(
      new ShellStep("UnitTest", {
        commands: ["npm ci", "npm test"],
      })
    );

    testStage.addPost(
      new ShellStep("IntegrationTest&Clean", {
        envFromCfnOutputs: {
          url: integrationTest.cfnOutputValue
        },
        commands: ["npm ci", "curl -Ssf $url", "npx cdk destroy IntegrationTestStack -f --verbose"]
      })
    )

    pipeline.addStage(
      new ProductionDeployStage(this, "Deploy", {
        env: {
          account: process.env.CDK_DEFAULT_ACCOUNT,
          region: process.env.CDK_DEFAULT_REGION,
        },
      })
    );
  }
}
