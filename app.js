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
    const html = `<p><a href='/recognize-form'><button>Recognize NIC</button></p>
    <p><a href='/recognize-cellbill'><button>Recognize cellbill</button></p>
    <p><a href='/recognize-waterbill'><button>Recognize waterbill</button></p>
    <p><a href='/recognize-telephone'><button>Recognize telephone</button></p>
    <p><a href='/recognize-pharmacy'><button>Recognize pharmacy</button></p>
    <p><a href='/recognize-cv'><button>Recognize prescription</button></p>
    <p><a href='/get-result-cv'><button>GET RESULT prescription</button></p>
    `
    res.send(html);
  } catch (error) {
    // console.error(error);
    res.send(error.message).status(500);
  }
})

// GET Analyze Form with AXIOS
app.get('/recognize-form-2', async (req, res) => {
  const apiKey = process.env["FORM_RECOGNIZER_API_KEY"];
  const END_POINT_URL = process.env["FORM_RECOGNIZER_ENDPOINT"];
  try {
    const config = {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
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
  const apiKey = process.env["FORM_RECOGNIZER_API_KEY"];
  const END_POINT_URL_RESULT = process.env["FORM_RECOGNIZER_ENDPOINT_RESULT"];
  try {
    const config = {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
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

// CELLBILL
app.get("/recognize-cellbill", async (req, res) => {
  // You will need to set these environment variables or edit the following values
  const endpoint = process.env["FORM_RECOGNIZER_ENDPOINT_BASE"];
  const apiKey = process.env["FORM_RECOGNIZER_API_KEY"];
  const modelId = process.env["CELLBILL_MODEL_ID"];
  // The form you are recognizing must be of the same type as the forms the custom model was trained on
  const fileName = path.join(__dirname, "./assets/cell.jpg");
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
      // for (const page of form.pages || []) {
      //   console.log(`Page number: ${page.pageNumber}`);
      //   console.log("Tables");
      //   for (const table of page.tables || []) {
      //     for (const cell of table.cells) {
      //       console.log(`cell (${cell.rowIndex},${cell.columnIndex}) ${cell.text}`);
      //     }
      //   }
      // }
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

// WATERBILL
app.get("/recognize-waterbill", async (req, res) => {
  // You will need to set these environment variables or edit the following values
  const endpoint = process.env["FORM_RECOGNIZER_ENDPOINT_BASE"];
  const apiKey = process.env["FORM_RECOGNIZER_API_KEY"];
  const modelId = process.env["WATERBILL_CUSTOM_MODEL_ID"];
  // The form you are recognizing must be of the same type as the forms the custom model was trained on
  const fileName = path.join(__dirname, "./assets/water.jpg");
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
      // for (const page of form.pages || []) {
      //   console.log(`Page number: ${page.pageNumber}`);
      //   console.log("Tables");
      //   for (const table of page.tables || []) {
      //     for (const cell of table.cells) {
      //       console.log(`cell (${cell.rowIndex},${cell.columnIndex}) ${cell.text}`);
      //     }
      //   }
      // }
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

// TELEPHONE
app.get("/recognize-telephone", async (req, res) => {
  // You will need to set these environment variables or edit the following values
  const endpoint = process.env["FORM_RECOGNIZER_ENDPOINT_BASE"];
  const apiKey = process.env["FORM_RECOGNIZER_API_KEY"];
  const modelId = process.env["TELEPHONE_CUSTOM_MODEL_ID"];
  // The form you are recognizing must be of the same type as the forms the custom model was trained on
  const fileName = path.join(__dirname, "./assets/telephone.jpg");
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
      // for (const page of form.pages || []) {
      //   console.log(`Page number: ${page.pageNumber}`);
      //   console.log("Tables");
      //   for (const table of page.tables || []) {
      //     for (const cell of table.cells) {
      //       console.log(`cell (${cell.rowIndex},${cell.columnIndex}) ${cell.text}`);
      //     }
      //   }
      // }
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

app.get("/recognize-pharmacy", async (req, res) => {
  // You will need to set these environment variables or edit the following values
  const endpoint = process.env["FORM_RECOGNIZER_ENDPOINT_BASE"];
  const apiKey = process.env["FORM_RECOGNIZER_API_KEY"];
  // The form you are recognizing must be of the same type as the forms the custom model was trained on
  const fileName = path.join(__dirname, "./assets/pharmacy.png");
  try {
    const readStream = fs.createReadStream(fileName);

    const client = new FormRecognizerClient(endpoint, new AzureKeyCredential(apiKey));
    const poller = await client.beginRecognizeReceipts(readStream, "image/png", {
      onProgress: (state) => { console.log(`status: ${state.status}`); }
    });

    const receipts = await poller.pollUntilDone();

    if (!receipts || receipts.length <= 0) {
      throw new Error("Expecting at lease one receipt in analysis result");
    }

    const receipt = receipts[0];
    console.log("First receipt:");
    // For supported fields recognized by the service, please refer to https://westus2.dev.cognitive.microsoft.com/docs/services/form-recognizer-api-v2-preview/operations/GetAnalyzeReceiptResult.
    const receiptTypeField = receipt.fields["ReceiptType"];
    if (receiptTypeField.valueType === "string") {
      console.log(`  Receipt Type: '${receiptTypeField.value || "<missing>"}', with confidence of ${receiptTypeField.confidence}`);
    }
    const merchantNameField = receipt.fields["MerchantName"];
    if (merchantNameField && merchantNameField.valueType === "string") {
      console.log(`  Merchant Name: '${merchantNameField.value || "<missing>"}', with confidence of ${merchantNameField.confidence}`);
    }
    const transactionDate = receipt.fields["TransactionDate"];
    if (transactionDate && transactionDate.valueType === "date") {
      console.log(`  Transaction Date: '${transactionDate.value || "<missing>"}', with confidence of ${transactionDate.confidence}`);
    }
    const itemsField = receipt.fields["Items"];
    if (itemsField.valueType === "array") {
      for (const itemField of itemsField.value || []) {
        if (itemField.valueType === "object") {
          const itemNameField = itemField.value["Name"];
          if (itemNameField.valueType === "string") {
            console.log(`    Item Name: '${itemNameField.value || "<missing>"}', with confidence of ${itemNameField.confidence}`);
          }
        }
      }
    }
    const totalField = receipt.fields["Total"];
    if (totalField.valueType === "number") {
      console.log(`  Total: '${totalField.value || "<missing>"}', with confidence of ${totalField.confidence}`);
    }
    res.json(Object.entries(receipt));
  }
  catch (error) {
    res.send(error.message).status(500);
  }

})


// Analyze prescription
app.get('/recognize-cv', async (req, res) => {
  const apiKey = process.env["CV_RECOGNIZER_API_KEY"];
  const END_POINT_URL = process.env["CV_RECOGNIZER_ENDPOINT"];
   var uriBase = END_POINT_URL + "vision/v3.0/read/analyze";
  try {
    const config = {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/octet-stream'
      },
    }
    const fileName = path.join(__dirname, "./assets/cv.png");
    if (!fs.existsSync(fileName)) {
      throw new Error(`Expecting file ${fileName} exists`);
    }
    const readStream = fs.createReadStream(fileName);

    const response = await axios.post(uriBase, readStream, config);

    console.log(response);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.send(error.message).status(500);
  }
})

// Get analyzing result of prescription
app.get('/get-result-cv', async (req, res) => {
  const apiKey = process.env["CV_RECOGNIZER_API_KEY"];
  const END_POINT_URL = process.env["CV_RECOGNIZER_ENDPOINT"];
  var uriBase = END_POINT_URL + "vision/v3.0/read/analyzeResults/c2d0ce24-2536-4689-a5e9-a0343e3b73e0"
  try {
    const config = {
      headers: {
        'Ocp-Apim-Subscription-Key': apiKey,
        'Content-Type': 'application/json'
      },
    }
    const response = await axios.get(uriBase, config);

    console.log(response);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.send(error.message).status(500);
  }
})



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
