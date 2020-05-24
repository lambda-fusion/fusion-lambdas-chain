const { FunctionFusion, handlerWrapper } = require("aws-lambda-fusion");
const fetch = require("node-fetch");
const { v4: uuid } = require("uuid");

exports.handler = async (event, context, callback) => {
  let traceId;
  if (event.traceId) {
    traceId = event.traceId;
  } else {
    traceId = uuid();
  }
  console.log("trace id", traceId);
  const response = await fetch(
    "https://fusion-config.s3.eu-central-1.amazonaws.com/fusionConfiguration.json"
  );
  const fusionConfiguration = await response.json();
  const target = event.target;
  const source = event.source;

  if (!target) {
    throw Error("Error. No target found in event", event);
  }

  const fusion = new FunctionFusion(
    fusionConfiguration,
    {
      region: "eu-central-1",
    },
    __dirname
  );
  let args = [];
  if (event.args) {
    args = [...event.args];
  }

  return fusion.invokeFunctionSync(
    { source, target, context, traceId },
    ...args
  );
};
