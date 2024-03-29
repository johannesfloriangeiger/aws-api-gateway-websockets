# AWS API Gateway with WebSockets

An example application deploying a WebSocket API using API Gateway that allows clients to register to "tasks" with IDs and getting notified specifically for a task by a Lambda.

## Setup

Checkout the code, run

```npm install```

and

```npm run build```

to build the stack and package the Lambdas. Run

```cdk bootstrap```

and

```cdk deploy```

to bootstrap and deploy the CDK stack.

## Demo

Connect to the WebSocket URL of the stack (output after the deployment was successful) using e.g. `wscat` and the query
parameter `?taskId=1`.

Invoke the send Lambda via

```
aws lambda invoke \
    --function-name WebSocketSend \
    --payload $(echo '{"taskId":"1","message":"Hello 1"}' | base64) \
    out
```

and notice the message appearing for the respective WebSocket connection.

Connect to the same URL in parallel using different task IDs and repeat the above to see that the message will only be delivered to the clients registered to the respective task ID.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
