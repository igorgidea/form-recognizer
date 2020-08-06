const express = require('express')
const app = express()
const port = 3000
const axios = require('axios').default
const { FormRecognizerClient, AzureKeyCredential } = require("@azure/ai-form-recognizer")
const fs = require("fs")
const path = require("path")
require('dotenv').config()

app.get('/', async (req, res) => {
  try {
    const html = "<p><a href='/recognize-form'><button>Recognize form</button></p>"
    res.send(html);
  } catch (error) {
    // console.error(error);
    res.send(error.message).status(500);
  }
})

// GET Analyze Form with AXIOS
app.get('/recognize-form-2', async (req, res) => {
  const END_POINT_URL = process.env["FORM_RECOGNIZER_ENDPOINT"];
  try {
    const config = {
      headers: {
        'Ocp-Apim-Subscription-Key': '954c3fe2a0a846658b2f7a482aaf0188',
        'Content-Type': 'image/jpeg'
      },
    }
    const fileName = path.join(__dirname, "./assets/nic_1_front.jpg");
    if (!fs.existsSync(fileName)) {
      throw new Error(`Expecting file ${fileName} exists`);
    }
    const readStream = fs.createReadStream(fileName);

    const response = await axios.post(END_POINT_URL, readStream, config);

    console.log(response);
    res.json(response.data);
  } catch (error) {
    // console.error(error);
    res.send(error.message).status(500);
  }
})

// Get Analyze Form Result with AXIOS
app.get('/recognize-form-3', async (req, res) => {

  const END_POINT_URL_RESULT = process.env["FORM_RECOGNIZER_ENDPOINT_RESULT"];
  try {
    const config = {
      headers: {
        'Ocp-Apim-Subscription-Key': '954c3fe2a0a846658b2f7a482aaf0188',
      },
    }
    const response = await axios.get(END_POINT_URL_RESULT, config);

    const fields = response.data.analyzeResult.documentResults[0].fields;
    for (const [fieldName, field] of Object.entries(fields)) {
      // each field is of type FormField
      console.log(
        `Field '${fieldName}' has value '${field.text}' with a confidence score of ${field.confidence}`
      );
    }

    // console.log(response.data.analyzeResult.documentResults);
    // console.log(fields);
    res.json(fields);

  } catch (error) {
    // console.error(error);
    res.send(error.message).status(500);
  }
})


// Recognize Form and get results with SDK
app.get("/recognize-form", async (req, res) => {
  // You will need to set these environment variables or edit the following values
  const endpoint = process.env["FORM_RECOGNIZER_ENDPOINT_BASE"];
  const apiKey = process.env["FORM_RECOGNIZER_API_KEY"];
  const modelId = process.env["UNLABELED_CUSTOM_MODEL_ID"];
  // The form you are recognizing must be of the same type as the forms the custom model was trained on
  const fileName = path.join(__dirname, "./assets/nic_1_front.jpg");
  try {

    if (!fs.existsSync(fileName)) {
      throw new Error(`Expecting file ${fileName} exists`);
    }

    const readStream = fs.createReadStream(fileName);

    const client = new FormRecognizerClient(endpoint, new AzureKeyCredential(apiKey));
    const poller = await client.beginRecognizeCustomForms(modelId, readStream, "image/jpeg");
    const forms = await poller.pollUntilDone();

    console.log("FORMS:");
    for (const form of forms || []) {
      console.log(`${form.formType}, page range: ${JSON.stringify(form.pageRange)}`);
      console.log("Pages:");
      for (const page of form.pages || []) {
        console.log(`Page number: ${page.pageNumber}`);
        console.log("Tables");
        for (const table of page.tables || []) {
          for (const cell of table.cells) {
            console.log(`cell (${cell.rowIndex},${cell.columnIndex}) ${cell.text}`);
          }
        }
      }
      console.log("FIELDS:");
      for (const [fieldName, field] of Object.entries(form.fields)) {
        // The recognized form fields with an unlabeled custom model will also include data about recognized labels.
        console.log(`Field ${fieldName} has label '${field.labelData ? field.labelData.text : field.name}' with a confidence score of ${field.confidence}`
        );
        console.log(`Field ${fieldName} has value '${field.value}' with a confidence score of ${field.confidence}`);
      }
      res.json(Object.entries(form.fields));
    }
  } catch (error) {
    res.send(error.message).status(500);
  }

})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
