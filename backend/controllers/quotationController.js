import Quotation from "../models/Quotation.js";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Upload directory for quotation files
const uploadDir = path.join(__dirname, '..', 'uploads', 'quotations');

// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Helper to generate quotation number
const generateQuotationNumber = async () => {
  const lastQuotation = await Quotation.findOne().sort({ createdAt: -1 });
  let nextNumber = 1;
  if (lastQuotation && lastQuotation.quotationNumber) {
    const match = lastQuotation.quotationNumber.match(/GCRM-Q-(\d+)/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }
  return `GCRM-Q-${nextNumber.toString().padStart(4, '0')}`;
};

// Create quotation
export const createQuotation = async (req, res) => {
  try {
    const { serviceKey, title, documents, steps, time, baseAmount, gstPercent = 18, notes, clientName, societyName, executiveName, website, youtube, contactPhone, contactEmail, address, ownerName, paymentTerms } = req.body;
    const totalAmount = baseAmount * (1 + gstPercent / 100);
    const quotationNumber = await generateQuotationNumber();

    // Handle documents field - if it's a string, try to parse it
    let processedDocuments = documents;
    if (typeof documents === 'string') {
      try {
        // Remove any extra quotes and parse
        const cleanString = documents.replace(/^["']|["']$/g, '');
        processedDocuments = JSON.parse(cleanString);
      } catch (parseError) {
        // If parsing fails, keep as string or convert to array
        processedDocuments = [documents];
      }
    }

    const quotation = new Quotation({
      quotationNumber,
      serviceKey,
      title,
      documents: processedDocuments,
      steps,
      time,
      baseAmount,
      gstPercent,
      totalAmount,
      notes,
      clientName,
      societyName,
      executiveName,
      website,
      youtube,
      contactPhone,
      contactEmail,
      address,
      ownerName,
      paymentTerms,
      createdBy: req.user.username,
      lastEditedBy: req.user.username,
    });

    await quotation.save();
    res.status(201).json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all quotations
export const getQuotations = async (req, res) => {
  try {
    const quotations = await Quotation.find().sort({ createdAt: -1 });
    res.json(quotations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update quotation
export const updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const quotation = await Quotation.findById(id);
    if (!quotation) return res.status(404).json({ message: "Quotation not found" });

    // Track changes for audit
    const changes = {};
    Object.keys(updates).forEach(key => {
      if (quotation[key] !== updates[key]) {
        changes[key] = { old: quotation[key], new: updates[key] };
      }
    });

    if (Object.keys(changes).length > 0) {
      quotation.history.push({
        editedBy: req.user.username,
        editedAt: new Date(),
        changes,
      });
    }

    Object.assign(quotation, updates);
    quotation.lastEditedBy = req.user.username;
    if (updates.baseAmount || updates.gstPercent) {
      quotation.totalAmount = quotation.baseAmount * (1 + quotation.gstPercent / 100);
    }

    await quotation.save();
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete quotation (Admin only)
export const deleteQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    await Quotation.findByIdAndDelete(id);
    res.json({ message: "Quotation deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Generate PDF
export const generatePDF = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);
    if (!quotation) return res.status(404).json({ message: "Quotation not found" });

    const doc = new PDFDocument({ margin: 50 });
    const fileName = `quotation-${quotation.quotationNumber}.pdf`;
    const filePath = path.join(__dirname, "../uploads", fileName);

    // Ensure uploads directory exists
    if (!fs.existsSync(path.join(__dirname, "../uploads"))) {
      fs.mkdirSync(path.join(__dirname, "../uploads"));
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header with branding
    doc.fontSize(24).text("Growup India Consultancy Pvt. Ltd", { align: "center", bold: true });
    doc.moveDown();

    // Dynamic website and YouTube links
    let contactLine = "";
    if (quotation.website) {
      contactLine += `Website: ${quotation.website}`;
    }
    if (quotation.youtube) {
      if (contactLine) contactLine += " | ";
      contactLine += `YouTube: ${quotation.youtube}`;
    }
    if (contactLine) {
      doc.fontSize(10).text(contactLine, { align: "center" });
    }

    doc.fontSize(10).text("Contact: +91-9911930022 | Email: growupindia14@gmail.com", { align: "center" });
    doc.moveDown(2);

    // Greeting section
    if (quotation.clientName && quotation.executiveName) {
      doc.fontSize(12).text(`Dear ${quotation.clientName},`, { align: "left" });
      doc.moveDown();
      doc.fontSize(10).text(`Thank you for considering Growup India for your ${quotation.title} needs. We are pleased to present this quotation prepared by our executive ${quotation.executiveName}.`, { align: "left" });
      doc.moveDown(2);
    }

    // Quotation title
    doc.fontSize(18).text("QUOTATION", { align: "center", underline: true });
    doc.moveDown();
    if (quotation.societyName) {
      doc.fontSize(12).text(`Society Name: ${quotation.societyName}`, { align: "center" });
      doc.moveDown();
    }
    doc.fontSize(12).text(`Quotation Number: ${quotation.quotationNumber}`, { align: "center" });
    doc.text(`Date: ${quotation.createdAt.toDateString()}`, { align: "center" });
    doc.moveDown(2);

    // Document list sections
    if (quotation.documents && typeof quotation.documents === 'object' && !Array.isArray(quotation.documents)) {
      doc.fontSize(14).text("Required Documents", { underline: true });
      doc.moveDown();

      if (quotation.documents.membersDetails && quotation.documents.membersDetails.length > 0) {
        doc.fontSize(12).text("Member's Details (Max 7 Members):", { bold: true });
        quotation.documents.membersDetails.forEach(docItem => {
          doc.fontSize(10).text(`- ${docItem}`);
        });
        doc.moveDown();
      }

      if (quotation.documents.societyDetails && quotation.documents.societyDetails.length > 0) {
        doc.fontSize(12).text("Society Details:", { bold: true });
        quotation.documents.societyDetails.forEach(docItem => {
          doc.fontSize(10).text(`- ${docItem}`);
        });
        doc.moveDown();
      }

      if (quotation.documents.witnessDetails && quotation.documents.witnessDetails.length > 0) {
        doc.fontSize(12).text("Witness Details (Max 2):", { bold: true });
        quotation.documents.witnessDetails.forEach(docItem => {
          doc.fontSize(10).text(`- ${docItem}`);
        });
        doc.moveDown();
      }
    } else if (Array.isArray(quotation.documents)) {
      doc.fontSize(14).text("Required Documents", { underline: true });
      doc.moveDown();
      quotation.documents.forEach(docItem => {
        doc.fontSize(10).text(`- ${docItem}`);
      });
      doc.moveDown();
    }

    // Charges table
    doc.fontSize(14).text("Charges Breakdown", { underline: true });
    doc.moveDown();

    // Table headers
    const tableTop = doc.y;
    doc.fontSize(10).text("Description", 50, tableTop, { width: 200 });
    doc.text("Amount", 300, tableTop, { width: 100 });
    doc.text("Notes", 420, tableTop, { width: 150 });

    // Table rows
    const notes = quotation?.notes || "";
    let yPosition = tableTop + 20;
    doc.text(quotation.title, 50, yPosition, { width: 200 });
    doc.text(`Rs. ${quotation.baseAmount}`, 300, yPosition, { width: 100 });
   doc.text(notes, 420, yPosition, { width: 150 });

    yPosition += 20;
    doc.text(`GST (${quotation.gstPercent}%)`, 50, yPosition, { width: 200 });
    doc.text(`Rs. ${(quotation.baseAmount * quotation.gstPercent / 100).toFixed(2)}`, 300, yPosition, { width: 100 });

    yPosition += 20;
    doc.fontSize(12).text("Total Amount", 50, yPosition, { width: 200, bold: true });
    doc.text(`Rs. ${quotation.totalAmount}`, 300, yPosition, { width: 100, bold: true });
    doc.text("", 420, yPosition, { width: 150 });

    doc.moveDown(2);

    // Payment terms
    if (quotation.paymentTerms) {
      doc.fontSize(14).text("Payment Terms", 50, doc.y, { align: "left", underline: true });
      doc.moveDown();
      doc.fontSize(10).text(quotation.paymentTerms, 50, doc.y, { width: 450, align: 'left' });
      doc.moveDown(3);
    }

    // Terms and Conditions
    doc.fontSize(12).text("Terms and Conditions:", { bold: true, underline: false });
    doc.moveDown();
    doc.fontSize(9).text("1. This quotation is valid for 30 days from the date of issue.", { underline: false });
    doc.text("2. All payments should be made in advance as per the payment terms mentioned above.", { underline: false });
    doc.text("3. Service delivery will commence only after receipt of full payment.", { underline: false });
    doc.text("4. Any additional requirements beyond the scope of this quotation will be charged separately.", { underline: false });
    doc.moveDown(2);

    // Footer section
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 100;

    // Draw a line above footer
    doc.moveTo(50, footerY).lineTo(545, footerY).stroke();

    doc.fontSize(10).text("Thank you for choosing Growup India Consultancy Pvt. Ltd", { align: "center" });
    doc.moveDown();
    doc.fontSize(8).text("This is a computer-generated quotation and does not require signature.", { align: "center" });
    doc.moveDown();
    doc.fontSize(8).text("For any queries, please contact us at growupindia14@gmail.com or +91-9911920022", { align: "center" });

    // Executive signature section
    if (quotation.executiveName) {
      doc.moveDown(2);
      doc.fontSize(10).text(`Prepared by: ${quotation.executiveName}`, { align: "right" });
      doc.fontSize(8).text("Executive", { align: "right" });
    }

    doc.end();

    stream.on("finish", () => {
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error(err);
        }
        // Optionally delete file after download
        fs.unlinkSync(filePath);
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload quotation file (Word or PDF)
export const uploadQuotationFile = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);
    
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Check file type - allow only PDF and Word documents
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(req.file.mimetype)) {
      // Delete the uploaded file if type is not allowed
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Only PDF and Word files are allowed" });
    }

    // If there's an existing uploaded file, delete it
    if (quotation.uploadedFile && quotation.uploadedFile.filePath) {
      const existingFilePath = path.join(__dirname, '..', quotation.uploadedFile.filePath);
      if (fs.existsSync(existingFilePath)) {
        fs.unlinkSync(existingFilePath);
      }
    }

    // Update quotation with uploaded file info
    quotation.uploadedFile = {
      fileName: req.file.originalname,
      filePath: path.relative(path.join(__dirname, '..'), req.file.path),
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedAt: new Date(),
      uploadedBy: req.user.username
    };

    await quotation.save();
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download uploaded quotation file
export const downloadUploadedFile = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findById(id);
    
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }

    if (!quotation.uploadedFile || !quotation.uploadedFile.filePath) {
      return res.status(404).json({ message: "No file uploaded for this quotation" });
    }

    const filePath = path.join(__dirname, '..', quotation.uploadedFile.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found on server" });
    }

    res.download(filePath, quotation.uploadedFile.fileName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
