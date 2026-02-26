export const servicesData = {
  company_registration: {
    title: "Company Registration",
    documents: [
      "PAN card (mandatory for Indian nationals)",
      "Aadhaar card or Passport (as address proof)",
      "Passport-size photograph",
      "Registered Office Proof (utility bill, NOC, rent agreement, etc.)",
      "Digital Signature Certificate (DSC)",
    ],
    steps: [
      "Obtain DSC and DIN for directors",
      "Reserve company name through MCA",
      "Prepare incorporation documents (MOA, AOA, etc.)",
      "File SPICe+ Form for incorporation",
      "Receive Certificate of Incorporation",
    ],
    time: "Approx. 1 month",
  },

  ngo_registration: {
    title: "NGO Registration",
    documents: [
      "PAN Card of all directors/promoters",
      "Aadhaar Card or Passport for address proof",
      "Passport-size photographs",
      "Registered office proof (Rent agreement, utility bill, NOC)",
      "MOA & AOA (Memorandum and Articles of Association)",
      "Digital Signature Certificate (DSC)",
    ],
    steps: [
      "Choose NGO structure (Section 8, Trust, or Society)",
      "Prepare and sign documents",
      "File SPICe+ Part A and Part B forms on MCA portal",
      "Verification and approval by ROC",
      "Receive Certificate of Incorporation",
    ],
    time: "Approx. 25–30 days",
  },

  gst_registration: {
    title: "GST Registration",
    documents: [
      "PAN Card",
      "Aadhaar Card",
      "Passport-size photo",
      "Business Address Proof (Electricity Bill, not older than 2 months)",
      "Bank details (Cancelled Cheque / Statement)",
      "Rent Agreement and NOC (if applicable)",
    ],
    steps: [
      "Generate Temporary Reference Number (TRN)",
      "Login using TRN and fill GST application",
      "Upload supporting documents",
      "Application verification by GST officer",
      "Receive GSTIN certificate upon approval",
    ],
    time: "7–10 days",
  },

  gst_return_filing: {
    title: "GST Return Filing",
    documents: [
      "GSTIN Certificate",
      "Sales invoices (B2B and B2C)",
      "Purchase invoices",
      "Debit/Credit notes (if any)",
      "Input tax credit summary",
      "Bank statement (for reconciliation)",
    ],
    steps: [
      "Collect sales and purchase data for the period",
      "Reconcile GSTR-2A/2B data with books",
      "Prepare GSTR-1 (outward supplies)",
      "Prepare and file GSTR-3B (summary return)",
      "Pay due taxes and submit return",
    ],
    time: "Monthly or Quarterly as per scheme",
  },

  itr_filing: {
    title: "ITR Filing",
    documents: [
      "PAN and Aadhaar",
      "Bank account details",
      "Form 26AS, AIS, and TIS",
      "Form 16 (for salaried individuals)",
      "Salary slips and investment proofs",
      "Capital gains statements (if applicable)",
      "House rent receipts (if claiming HRA)",
    ],
    steps: [
      "Collect all income and investment documents",
      "Choose the correct ITR form based on income type",
      "Compute total income and deductions",
      "Pay any pending taxes and generate challan",
      "File return and e-verify through Aadhaar OTP or DSC",
    ],
    time: "2–5 days (depending on data completeness)",
  },

  tds_return_filing: {
    title: "TDS Return Filing",
    documents: [
      "TAN and PAN of deductor",
      "Details of tax deducted (Form 24Q, 26Q, etc.)",
      "Challans of TDS payment (Form 281)",
      "Employee/vendor details (if applicable)",
    ],
    steps: [
      "Collect TDS data and challans",
      "Prepare quarterly TDS statement using utility software",
      "Validate and generate .fvu file",
      "Upload return on TRACES portal",
      "Download acknowledgment and Form 16/16A",
    ],
    time: "7–10 days",
  },

  msme_registration: {
    title: "MSME Registration (Udyam)",
    documents: [
      "Aadhaar number of proprietor/partner/director",
      "PAN Card",
      "Business name and address details",
      "Bank account number",
      "NIC Code (Nature of Business Activity)",
    ],
    steps: [
      "Visit Udyam Registration Portal",
      "Enter Aadhaar and PAN details",
      "Provide business and bank details",
      "Submit self-declaration form",
      "Receive Udyam Registration Certificate",
    ],
    time: "Same day registration",
  },

  trust_registration: {
    title: "Trust Registration",
    documents: [
      "PAN and Aadhaar of trustees",
      "Trust Deed (prepared on stamp paper)",
      "Passport-size photos of trustees",
      "Proof of registered office (Rent agreement/NOC/Utility bill)",
      "Witness ID proof",
    ],
    steps: [
      "Prepare Trust Deed with objectives",
      "Get the deed signed and notarized",
      "Submit documents to local registrar",
      "Verification and registration of Trust Deed",
      "Obtain registration certificate",
    ],
    time: "15–20 days",
  },

  society_registration: {
    title: "Society Registration",
    documents: {
      membersDetails: [
        "Aadhar card",
        "PAN card",
        "Qualification",
        "Occupation",
        "Caste",
        "Designation",
        "Email ID",
        "Mobile no.",
      ],
      societyDetails: [
        "Proposed Society Name (Max 3)",
        "Society Address Proof (latest electricity bill)",
        "Allotment letter",
      ],
      witnessDetails: [
        "Aadhar Card",
        "Mobile no.",
      ],
    },
    steps: [
      "Prepare MOA and Rules & Regulations",
      "Get signatures from all founding members",
      "Submit documents to Registrar of Societies",
      "Verification by authorities",
      "Receive Certificate of Registration",
    ],
    time: "20–30 days",
  },

  roc_annual_compliances: {
    title: "ROC Annual Compliances",
    documents: [
      "Financial Statements (Balance Sheet, P&L)",
      "Board and AGM Resolutions",
      "Director KYC details",
      "Audit Report",
      "Company Master Data",
    ],
    steps: [
      "Prepare financial statements",
      "Hold board and annual general meetings",
      "File AOC-4 and MGT-7 forms with ROC",
      "Ensure director KYC compliance",
      "Maintain statutory registers and records",
    ],
    time: "Annual compliance cycle",
  },
};
