import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from 'aws-cdk-lib/aws-iam';

require('dotenv').config();

const config = {
  env: {
    account: process.env.AWS_ACCOUNT_NUMBER,
    region: process.env.AWS_REGION
  }
}

export class WidgetCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, { ...props, env: config.env});

    // 1. Find default VPC for now
    const defaultVPC = ec2.Vpc.fromLookup(
      this,
      'VPC',
      { isDefault: true }
    );

    // 1.1. Configure role
    const role = new iam.Role(
      this,
      'widget-instance-role',
      { assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com')}
    );

    // 1.2. Configure security group
    const sg = new ec2.SecurityGroup(
      this,
      'widget-instance-sg',
      {
        vpc: defaultVPC,
        allowAllOutbound: true,
        securityGroupName: 'widget-instance-role'
      }
    );

    // 1.3. Add rule to security group
    // Allow SSH connection
    // TODO: Currently, it allows all users to access vis ssh for testing. It's requird to change to restricted access
    sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allows SSH access from Internet'
    );

    // Allow HTTP connection
    sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allows https access from Internet'
    );

    // Allows HTTPS connection
    sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allows https access from Internet'
    )


    // 2. Create EC2
    // TODO: Need to create key pair. Currently, anyone can access to this instance
    const instance = new ec2.Instance(this, 'simple-instance-1', {
      vpc: defaultVPC,
      role: role,
      securityGroup: sg,
      instanceName: 'widget-instance',
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.lookup({
        name: "widget-instance-ami"
      })
    });

    // 2.1. Get public IP address
    const publicIp = instance.instancePublicIp;

    // 3. Set up EC2

    // 4. Create Load balancer

    // 5. Create Lambda (Optional)
  }
}
