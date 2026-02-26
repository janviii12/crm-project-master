/**
 * Aadhaar OCR Text Parser
 * Handles Name, Father Name, DOB, Gender, Aadhaar, Address
 * Logs added for debugging
 */

export default function parseAadhaar(rawText = '') {
  console.log("===== RAW OCR TEXT =====");
  console.log(rawText);

  const text = normalize(rawText);
  console.log("===== NORMALIZED OCR TEXT =====");
  console.log(text);

  const aadhaar = extractAadhaar(text);
  const dob = extractDOB(text);
  const gender = extractGender(text);
  const name = extractName(text);
  const father = extractFather(text);
  const addressData = extractAddress(text);

  const extractedData = {
    name,
    father,
    dob,
    gender,
    aadhaar,
    address: addressData.address,
    pincode: addressData.pincode,
    state: addressData.state,
    district: addressData.district
  };

  console.log("===== EXTRACTED DATA =====");
  console.log(extractedData);

  return extractedData;
}

/* ================== HELPERS ================== */

function normalize(text) {
    console.log("===== NORMALIZED OCR TEXT =====");
  console.log(text);
  return text
    .replace(/\r/g, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/ {2,}/g, ' ')
    .trim();
}

/* -------- Aadhaar Number -------- */
function extractAadhaar(text) {
    console.log("===== NORMALIZED OCR TEXT =====");
  console.log(text);
  const match = text.match(/\b\d{4}\s\d{4}\s\d{4}\b/);
  return match ? match[0] : '';
}

/* -------- DOB -------- */
function extractDOB(text) {
  let match = text.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
  if (match) return match[0];

  match = text.match(/\b\d{2}[-.]\d{2}[-.]\d{4}\b/);
  if (match) return match[0].replace(/[-.]/g, '/');

  match = text.match(/DOB[:\s]*(\d{2}\/\d{2}\/\d{4})/i);
  if (match) return match[1];

  match = text.match(/\b\d{4}[-.]\d{2}[-.]\d{2}\b/);
  if (match) {
    const parts = match[0].split(/[-.]/);
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return '';
}

/* -------- Gender -------- */
function extractGender(text) {
  const match = text.match(/\b(Male|Female|Transgender)\b/i);
  return match ? capitalize(match[0]) : '';
}

/* -------- Name -------- */
function extractName(text) {
  const lines = text.split('\n');

  for (let line of lines) {
    line = line.trim();
    if (
      line.length > 4 &&
      /^[A-Z ]+$/.test(line) &&
      !line.includes('GOVERNMENT') &&
      !line.includes('INDIA') &&
      !line.includes('DOB') &&
      !line.includes('ADDRESS')
    ) {
      return capitalize(line);
    }
  }

  for (let line of lines) {
    line = line.trim();
    if (
      line.length > 4 &&
      /^[a-zA-Z ]+$/.test(line) &&
      !line.toLowerCase().includes('government') &&
      !line.toLowerCase().includes('india') &&
      !line.toLowerCase().includes('dob') &&
      !line.toLowerCase().includes('address') &&
      !/\d/.test(line)
    ) {
      return capitalize(line);
    }
  }

  return 'N/A';
}

/* -------- Father / Guardian -------- */
function extractFather(text) {
  let match = text.match(/(S\/O|D\/O|W\/O|C\/O)\s*[:\-]?\s*([A-Z ]{4,})/i);
  if (match) return capitalize(match[2]);

  match = text.match(/(s\/o|d\/o|w\/o|c\/o)\s*[:\-]?\s*([a-zA-Z ]{4,})/i);
  if (match) return capitalize(match[2]);

  const lines = text.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (
      line.length > 4 &&
      /^[a-zA-Z ]+$/.test(line) &&
      (line.toLowerCase().includes('father') ||
        line.toLowerCase().includes('guardian') ||
        line.toLowerCase().includes('parent')) &&
      !/\d/.test(line)
    ) {
      return capitalize(line);
    }
  }

  return 'N/A';
}

/* -------- Address -------- */
function extractAddress(text) {
  const result = {
    address: '',
    pincode: '',
    state: '',
    district: ''
  };

  const addrMatch = text.match(/Address[:\s]*([\s\S]*?)\b\d{6}\b/i);
  if (addrMatch) {
    let addrBlock = addrMatch[1]
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    result.address = capitalize(addrBlock);
  }

  const pinMatch = text.match(/\b\d{6}\b/);
  if (pinMatch) result.pincode = pinMatch[0];

  const stateMatch = text.match(/\b(Delhi|Maharashtra|Uttar Pradesh|Haryana|Rajasthan|Punjab|Gujarat|Bihar|MP|UP)\b/i);
  if (stateMatch) result.state = capitalize(stateMatch[0]);

  return result;
}

/* -------- Utilities -------- */
function capitalize(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, char => char.toUpperCase());
}
