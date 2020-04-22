const sharp = require('sharp')
const { FunctionFusion, handlerWrapper } = require('aws-lambda-fusion')
const fetch = require('node-fetch')
const { handler: handlerSaveS3 } = require('./saveS3')

let traceId
exports.handler = async (event, context, callback) => {
  traceId = event.args[1]
  return handlerWrapper({ event, context, callback, handler: internalHandler, traceId, lambdaName: 'resize' })
}

const internalHandler = async (event, context) => {
  const response = await fetch('https://fusion-config.s3.eu-central-1.amazonaws.com/fusionConfiguration.json')
  const fusionConfiguration = await response.json()

  const fusion = new FunctionFusion(fusionConfiguration, { region: 'eu-central-1' })


  const base64String = event.args[0]
  const base64Buffer = Buffer.from(base64String, 'base64')

  const resizedBase64 = (await sharp(base64Buffer)
    .resize(null,800)
    .blur(10)
    .normalize()
    .rotate(90)
    .toBuffer()
    ).toString('base64')

  result = await fusion.invokeFunctionSync('resize', { name: 'saveS3', handler: handlerSaveS3 }, context, resizedBase64, traceId)

  if(result.FunctionError){
    throw Error(result.Payload)
  }
  return {
    status: 200,
    result
  }
}