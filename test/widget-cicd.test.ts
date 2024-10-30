import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as WidgetCdk from '../lib/widget-app-stack';

test('Template should create widget instance role', () => {
  const app = new cdk.App();
    // WHEN
  const stack = new WidgetCdk.WidgetCdkStack(app, 'UnitTestStack', {
    env: {
        account: "",
        region: ""
    }
  });
    // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::IAM::Role", {
    AssumeRolePolicyDocument: {
      Statement: [
        {
          Effect: "Allow",
          Principal: {
            "Service": "ec2.amazonaws.com"
          },
          Action: "sts:AssumeRole"
        }
      ]
    }
  });
});

test('Template Should create security group', () => {
  const app = new cdk.App();
    // WHEN
  const stack = new WidgetCdk.WidgetCdkStack(app, 'UnitTestStack', {
    env: {
        account: "325861338157",
        region: "ap-southeast-2"
    }
  });
    // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::EC2::SecurityGroup", {
    GroupName: "widget-instance-role",
    SecurityGroupIngress: [
    {
      IpProtocol: "tcp",
      FromPort: 80,
      ToPort: 80,
      CidrIp: "0.0.0.0/0"
    },
    {
      IpProtocol: "tcp",
      FromPort: 443,
      ToPort: 443,
      CidrIp: "0.0.0.0/0"
    }]
  });
});

test('Template Should create EC2 launch templace', () => {
  const app = new cdk.App();
    // WHEN
  const stack = new WidgetCdk.WidgetCdkStack(app, 'UnitTestStack', {
    env: {
        account: "",
        region: ""
    }
  });
    // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::EC2::LaunchTemplate", {
    LaunchTemplateData: {
      InstanceType: "t2.micro",
      ImageId: "ami-1234"
    }
  });
});

test('Template Should create EC2 launch templace', () => {
  const app = new cdk.App();
    // WHEN
  const stack = new WidgetCdk.WidgetCdkStack(app, 'UnitTestStack', {
    env: {
        account: "",
        region: ""
    }
  });
    // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::EC2::LaunchTemplate", {
    LaunchTemplateData: {
      InstanceType: "t2.micro",
      ImageId: "ami-1234"
    }
  });
});

test('Template Should create EC2 auto scaling group', () => {
  const app = new cdk.App();
    // WHEN
  const stack = new WidgetCdk.WidgetCdkStack(app, 'UnitTestStack', {
    env: {
        account: "",
        region: ""
    }
  });
    // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::AutoScaling::AutoScalingGroup", {
    LaunchTemplate: {
      LaunchTemplateId: {
        Ref: "widgetinstance52A2D3A4"
      }
    },
    MinSize: "1",
    DesiredCapacity: "1",
    MaxSize: "3"
  });
});

test('Template Should create EC2 application load balancer', () => {
  const app = new cdk.App();
    // WHEN
  const stack = new WidgetCdk.WidgetCdkStack(app, 'UnitTestStack', {
    env: {
        account: "",
        region: ""
    }
  });
    // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::ElasticLoadBalancingV2::LoadBalancer", {
    Scheme: "internet-facing",
    SecurityGroups: [ { "Fn::GetAtt": [ "widgetinstancesg0F09E863", "GroupId" ] } ]
  });
});

test('Template Should create EC2 application load balancer listener', () => {
  const app = new cdk.App();
    // WHEN
  const stack = new WidgetCdk.WidgetCdkStack(app, 'UnitTestStack', {
    env: {
        account: "",
        region: ""
    }
  });
    // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::ElasticLoadBalancingV2::Listener", {
    Port: 80,
    Protocol: "HTTP",
    LoadBalancerArn: { "Ref": "LB8A12904C" },
  });
});

test('Template Should define EC2 application load balancer target group', () => {
  const app = new cdk.App();
    // WHEN
  const stack = new WidgetCdk.WidgetCdkStack(app, 'UnitTestStack', {
    env: {
        account: "",
        region: ""
    }
  });
    // THEN
  const template = Template.fromStack(stack);

  template.hasResourceProperties("AWS::ElasticLoadBalancingV2::TargetGroup", {
    Port: 80,
    HealthCheckPath: "/",
    HealthCheckIntervalSeconds: 30
  });
});