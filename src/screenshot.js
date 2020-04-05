const chromium = require('chrome-aws-lambda');
const { FunctionFusion } = require('aws-lambda-fusion')
const fusionConfiguration = require('../fusionConfiguration.json')
const { handler } = require('./resize')

exports.handler = async (event, context) => {
  let base64img = null;
  let browser = null;
  let result = null;

  console.log('Got event', event)

  const fusion = new FunctionFusion(fusionConfiguration, { region: 'eu-central-1' })

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.goto(event.url || 'https://welt.de');

    base64img = await page.screenshot({ encoding: 'base64' })

    result = await fusion.invokeFunctionSync('screenshot', { name: 'resize', handler }, context, base64img)

  } catch (error) {
    return context.fail(error);
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
  return result
};