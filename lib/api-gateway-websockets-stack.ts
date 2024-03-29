import * as cdk from 'aws-cdk-lib';
import {CfnOutput} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import {AttributeType} from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as api_gw_v2 from "aws-cdk-lib/aws-apigatewayv2";
import {WebSocketLambdaIntegration} from "aws-cdk-lib/aws-apigatewayv2-integrations";

export class ApiGatewayWebsocketsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const connectionsTable = new dynamodb.Table(this, 'Connections', {
            tableName: 'connections',
            partitionKey: {
                type: AttributeType.STRING,
                name: 'connection_id'
            },
        })
        connectionsTable.addGlobalSecondaryIndex({
            indexName: 'task_id-index',
            partitionKey: {
                type: AttributeType.STRING,
                name: 'task_id'
            }
        })

        const connectLambda = new lambda.Function(this, 'Connect', {
            functionName: 'WebSocketConnect',
            handler: 'bootstrap',
            runtime: lambda.Runtime.PROVIDED_AL2023,
            code: lambda.Code.fromAsset('./lib/connect/connect.zip'),
        });
        connectionsTable.grantWriteData(connectLambda);

        const disconnectLambda = new lambda.Function(this, 'Disconnect', {
            functionName: 'WebSocketDisconnect',
            handler: 'bootstrap',
            runtime: lambda.Runtime.PROVIDED_AL2023,
            code: lambda.Code.fromAsset('./lib/disconnect/disconnect.zip'),
        });
        connectionsTable.grantWriteData(disconnectLambda);

        const apiGateway = new api_gw_v2.WebSocketApi(this, 'WebSocketAPI', {
            apiName: 'tasks',
            connectRouteOptions: {
                integration: new WebSocketLambdaIntegration('Connect', connectLambda)
            },
            disconnectRouteOptions: {
                integration: new WebSocketLambdaIntegration('Disconnect', disconnectLambda)
            }
        });
        const stage = new api_gw_v2.WebSocketStage(this, 'Stage', {
            stageName: 'development',
            webSocketApi: apiGateway,
            autoDeploy: true
        });

        const sendLambda = new lambda.Function(this, 'Send', {
            functionName: 'WebSocketSend',
            handler: 'bootstrap',
            runtime: lambda.Runtime.PROVIDED_AL2023,
            code: lambda.Code.fromAsset('./lib/send/send.zip'),
            environment: {
                'CONNECTIONS_URL': stage.callbackUrl
            }
        });
        connectionsTable.grantReadData(sendLambda);
        apiGateway.grantManageConnections(sendLambda);

        new CfnOutput(this, 'WebSocketURL', {
            key: 'WebSocketURL',
            value: stage.url
        });
    }
}
