import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';

// Importing DynamoDB module
import * as ddb from 'aws-cdk-lib/aws-dynamodb';

// Importing Lambda module
import * as lambda from 'aws-cdk-lib/aws-lambda';

// Infrastructure blueprint
export class TodoInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB Table to store tasks
    const table = new ddb.Table(this, 'Tasks', {
      // Primary key (unique ID)
      partitionKey: { name: 'task_id', type: ddb.AttributeType.STRING},
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      // Expired items will auto delete
      timeToLiveAttribute: 'ttl',
    });

    // Add a secondary index to query tasks
    table.addGlobalSecondaryIndex({
      indexName: 'user-index',
      partitionKey: { name: 'user_id', type: ddb.AttributeType.STRING},
      sortKey: { name: 'created_time', type: ddb.AttributeType.NUMBER}
    });

    // Create a Lambda function
    const api = new lambda.Function(this, "API", {
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset('../api'),
      handler: "todo.handler",
      // Getting the DynamoDB Table
      environment: {
        TABLE_NAME: table.tableName
      }
    })

    // Creating a URL so we can access the function
    const functionUrl = api.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      // CORS config sp browser won't block the request
      cors: {
        allowedOrigins: ["*"],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ["*"],
      },
    });

    // Output the API function url. print url for the lambda function after deployment
    new CfnOutput(this, "APIUrl", {
      value: functionUrl.url
    });

    // Give Lambda permissions to read/write to the table
    table.grantReadWriteData(api);
  }
}
