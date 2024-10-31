import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

require("dotenv").config();

const config = {
  env: {
    account: "325861338157",
    region: "ap-southeast-2",
  },
};

export class WidgetCdkStack extends cdk.Stack {
  public lbURL: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, { ...props, env: config.env });

    // Find default VPC for now
    const defaultVPC = this.getDefaultVPC();

    // Configure role
    const role = this.createRole();

    // Configure security group
    const securityGroup = this.createSecurityGroup(defaultVPC);

    // Add rule to security group
    this.defineSGIngressRule(securityGroup);

    const launchTemplate = this.createLaunchTemplate(role, securityGroup);

    // Create auto scaling group
    const autoScalingGroup = this.createAutoScallingGroup(
      defaultVPC,
      launchTemplate
    );

    // Create Load Balancer
    const loadBalancer = this.createApplicationLoadBalancer(
      defaultVPC,
      securityGroup
    );
    this.lbURL = new cdk.CfnOutput(this, 'AlbEndpoint', { value: `http://${loadBalancer.loadBalancerDnsName}`});

    // Add Listener to LB (for HTTP on Port 80)
    const listener = this.createApplicationListener(loadBalancer);

    // Add Target Group to LB
    this.defineTarget(listener, autoScalingGroup);
  }

  private getDefaultVPC(): cdk.aws_ec2.IVpc {
    return ec2.Vpc.fromLookup(this, "VPC", { isDefault: true });
  }

  private createRole(): cdk.aws_iam.Role {
    return new iam.Role(this, "widget-instance-role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });
  }

  private createSecurityGroup(
    vpc: cdk.aws_ec2.IVpc
  ): cdk.aws_ec2.SecurityGroup {
    return new ec2.SecurityGroup(this, "widget-instance-sg", {
      vpc: vpc,
      allowAllOutbound: true,
      securityGroupName: "widget-instance-role",
    });
  }

  private defineSGIngressRule(sg: cdk.aws_ec2.SecurityGroup): void {
    // Allow HTTP connection
    sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "Allows https access from Internet"
    );

    // Allows HTTPS connection
    sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "Allows https access from Internet"
    );
  }

  private createLaunchTemplate(
    role: cdk.aws_iam.Role,
    sg: cdk.aws_ec2.SecurityGroup
  ): cdk.aws_ec2.LaunchTemplate {
    return new ec2.LaunchTemplate(this, "widget-instance", {
      role: role,
      securityGroup: sg,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.lookup({
        name: "widget-instance-ami",
      }),
    });
  }

  private createAutoScallingGroup(
    vpc: cdk.aws_ec2.IVpc,
    launchTemplate: cdk.aws_ec2.LaunchTemplate
  ): cdk.aws_autoscaling.AutoScalingGroup {
    return new autoscaling.AutoScalingGroup(this, "AutoScalingGroup", {
      vpc: vpc,
      launchTemplate: launchTemplate,
      minCapacity: 1,
      desiredCapacity: 1,
      maxCapacity: 3,
    });
  }

  private createApplicationLoadBalancer(
    vpc: cdk.aws_ec2.IVpc,
    sg: cdk.aws_ec2.SecurityGroup
  ): cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer {
    return new elbv2.ApplicationLoadBalancer(this, "LB", {
      vpc: vpc,
      internetFacing: true,
      securityGroup: sg,
    });
  }

  private createApplicationListener(
    lb: cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer
  ): cdk.aws_elasticloadbalancingv2.ApplicationListener {
    return lb.addListener("Listener", {
      port: 80,
      open: true,
    });
  }

  private defineTarget(
    listener: cdk.aws_elasticloadbalancingv2.ApplicationListener,
    asg: cdk.aws_autoscaling.AutoScalingGroup
  ) {
    listener.addTargets("Target", {
      port: 80,
      targets: [asg],
      healthCheck: {
        path: "/",
        interval: cdk.Duration.seconds(30),
      },
    });
  }
}
