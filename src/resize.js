const sharp = require('sharp')
const { FunctionFusion } = require('aws-lambda-fusion')
const fusionConfiguration = require('../fusionConfiguration.json')
const { handler } = require('./saveS3')

exports.handler = async (event, context) => {
  console.log('got event', event)

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

  result = await fusion.invokeFunctionSync('resize', { name: 'saveS3', handler }, context, resizedBase64)

  if(result.FunctionError){
    throw Error(result.Payload)
  }
  return {
    status: 200,
    result
  }
}