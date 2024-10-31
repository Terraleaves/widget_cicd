import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { WidgetCdkStack } from "./widget-app-stack";

export class IntegrationTestStage extends cdk.Stage {
  public lbURL: String;

  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);
    // Create Stack
    const testStack = new WidgetCdkStack(this, "IntegrationTestStack");
    this.lbURL = `http://${testStack.lbDnsName}`;
  }
}
