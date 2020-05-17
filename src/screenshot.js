const chromium = require("chrome-aws-lambda");
const { FunctionFusion, handlerWrapper } = require("aws-lambda-fusion");
const { handler: handlerResize } = require("./resize");
const fetch = require("node-fetch");
const { v4: uuid } = require("uuid");

let traceId;

const internalHandler = async (event, context) => {
  let base64img = null;
  let browser = null;
  let result = null;

  const response = await fetch(
    "https://fusion-config.s3.eu-central-1.amazonaws.com/fusionConfiguration.json"
  );
  const fusionConfiguration = await response.json();

  const fusion = new FunctionFusion(fusionConfiguration, {
    region: "eu-central-1",
  });

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.goto(event.url || "https://example.com");

    base64img = await page.screenshot({ encoding: "base64" });

    result = await fusion.invokeFunctionSync(
      "screenshot",
      { name: "resize", handler: handlerResize },
      context,
      base64img,
      traceId
    );
  } catch (error) {
    return context.fail(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
  return result;
};

exports.handler = async (event, context, callback) => {
  traceId = uuid();
  return handlerWrapper({
    event,
    context,
    callback,
    handler: internalHandler,
    traceId,
    lambdaName: "screenshot",
  });
};
