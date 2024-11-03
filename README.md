# COMP2029 Widget CICD
This CICD stack is for automating deployment, monitoring, and testing of a widget system using AWS CodePipeline.
The pipeline integrates with GitHub for source control, builds the application, and deploys to a specified environment, with a manual approaval step before production deployment.

## Overview
The WidgetCicdStack uses AWS CodePipeline to manage the CI/CD workflow.
- **Pipeline Creation**: CodePipeline is set up to trigger builds from a GitHub repository.
- **Build and Synthesis Step**: The ShellStep in the pipeline installs dependencies, builds the application, and synthesizes the CDK stack.
- **Deploy Stage**: Deploys the stack in the specified environment.
- **Test Stages**: Unit and integration tests are configured to run automatically before deployment.
- **IAM Roles**: Roles are defined to grant necessary permissions to the pipeline and test steps.

## Prerequisites
Ensure you have the following set up:

- AWS CDK installed (npm install -g aws-cdk)
- AWS CLI configured with appropriate permissions
- Node.js and npm installed
- .env file configured with environment variables if required

## File Structure
- **WidgetCicdStack**: The main CDK stack that sets up the pipeline.
- **production-deploy-stage.ts**: Defines the production deployment stage.

## Key Components

### 1. Pipeline Setup
The pipeline is created using CodePipeline and is configured to use a GitHub repository as the source:

```typescript
const pipeline = new CodePipeline(this, "Pipeline", {
  pipelineName: "WidgetPipeline",
  synth: new ShellStep("Synth", {
    input: CodePipelineSource.connection(
      "Terraleaves/widget_cicd",
      "master",
      {
        connectionArn: "arn:aws:codeconnections:ap-southeast-2:116981789059:connection/40bc72e5-4f17-4152-99b1-1b1e86c06876",
      }
    ),
    commands: ["npm ci", "npm run build", "npx cdk synth"],
    primaryOutputDirectory: "cdk.out",
  }),
});
```

### 2. Test Stages
The stack includes two test steps: **Unit Testing** and **Integration Testing**, each running in the CodeBuild environment.

```typescript
const unitTestStep = new cdk.pipelines.CodeBuildStep("UnitTest", {
  role: testRole,
  commands: ["npm ci", "npm test"],
});

const integrationTestStep = new cdk.pipelines.CodeBuildStep("IntegrationTest", {
  role: testRole,
  commands: ["npm ci", "npm run integ-test"],
});
```

### 3. IAM Role for Testing
A role with AdministratorAccess permissions is created for testing purposes.

```typescript
const testRole = new iam.Role(this, "PipelineTestRole", {
  assumedBy: new iam.CompositePrincipal(
    new iam.ServicePrincipal("codebuild.amazonaws.com"),
    new iam.ServicePrincipal("cloudformation.amazonaws.com")
  ),
});
testRole.addManagedPolicy(
  iam.ManagedPolicy.fromAwsManagedPolicyName("AdministratorAccess")
);
```

## Deployment
To deploy the WidgetCicdStack, run the following command:

```bash
cdk deploy
```

## Testing

### Unit Tests
Unit tests are defined in the project and will be triggered in the UnitTest step. They can also be run locally with:

```bash
npm test
```

### Integration Tests
Integration tests are configured to test the deployed resources in the IntegrationTest step. To run integration tests locally:

```bash
npm run integ-test
```

## Environment Configuration
The pipeline uses environment variables configured in a .env file for sensitive or configurable information. Ensure that the .env file is set up before deploying.

## Additional Information
- **CodePipeline**: Orchestrates the CI/CD workflow.
- **CodeBuild**: Runs the build and test commands.
- **IAM**: Manages permissions required by the pipeline and its stages.

For more details, consult the AWS CDK documentation: [AWS CDK](https://docs.aws.amazon.com/cdk/v2/guide/home.html).

## License
This project is licensed under the MIT License.


## System Architecture
![alt text]()

## Prerequisites
To manage and deploy this stac, you will need the following:
- AWS CDK installed ([CDK Installation](https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html))
- AWS CLI configured with your AWS credentials that have permissions to deploy resources
- Node.js (v14 or later)
- CodeStar connection set up to GitHub repository


## Run app
Please make sure you have created repository using aws cdk before pull this repository.
Once you've got repository, take following steps to run app

```bash
npm install
npm run build
cdk bootstrap (You might need to configure your account)
cdk synth
cdk deploy
```