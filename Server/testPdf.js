const axios = require('axios');
const pdfParse = require('pdf-parse');

async function testPdf() {
  const url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    const data = await pdfParse(buffer, { max: 10 });
    console.log('Text:', data.text.substring(0, 100));
  } catch (err) {
    console.error('Error:', err);
  }
}
testPdf();
