import ExcelFile from '../models/ExcelFile.js';
import User from '../models/User.js';
import fs from 'fs';
import XLSX from 'xlsx';

/*---------------------------------------------
  UPLOAD EXCEL (.xlsx only)
----------------------------------------------*/
export const uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    if (!req.file.originalname.endsWith('.xlsx')) {
      return res.status(400).json({ success: false, message: 'Only .xlsx files allowed' });
    }

    // Validate file (just read, don't modify)
    try {
      const buffer = fs.readFileSync(req.file.path);
      XLSX.read(buffer, { type: 'buffer' });
    } catch (e) {
      return res.status(400).json({ success: false, message: "Invalid Excel file" });
    }

    const excelFile = new ExcelFile({
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      filePath: req.file.path,
      uploadedBy: req.user.id,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      version: 1
    });

    excelFile.history.push({
      userId: req.user.id,
      action: "upload",
      version: 1
    });

    await excelFile.save();

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: excelFile
    });

  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/*---------------------------------------------
  FETCH ALL FILES
----------------------------------------------*/
export const getExcelFiles = async (req, res) => {
  try {
    const files = await ExcelFile.find()
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 });

    res.json({ success: true, data: files });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/*---------------------------------------------
  VIEW MULTIPLE SHEETS — 100% FIXED
----------------------------------------------*/
export const getExcelFile = async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id)
      .populate('uploadedBy', 'name email');

    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    const buffer = fs.readFileSync(file.filePath);

    const workbook = XLSX.read(buffer, {
      type: 'buffer',
      cellDates: true,
      raw: false,
      sheetStubs: true
    });

    const sheetsData = {};

    workbook.SheetNames.forEach(sheetName => {
      const ws = workbook.Sheets[sheetName];
      let data = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: "",
        blankrows: true
      });

      data = data.map(row =>
        row.map(c => c instanceof Date ? c.toLocaleDateString("en-GB") : c)
      );

      sheetsData[sheetName] = data;
    });

    res.json({
      success: true,
      data: {
        file,
        sheets: sheetsData
      }
    });

  } catch (err) {
    console.error("Get file error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/*---------------------------------------------
  UPDATE MULTI-SHEET — FINAL FIXED VERSION
----------------------------------------------*/
export const updateExcelFile = async (req, res) => {
  try {
    let { sheetsData } = req.body;

    // Handle FormData case (stringified JSON)
    if (typeof sheetsData === "string") {
      try {
        sheetsData = JSON.parse(sheetsData);
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid sheets JSON" });
      }
    }

    if (!sheetsData || typeof sheetsData !== "object") {
      return res.status(400).json({ success: false, message: "Invalid sheets data" });
    }

    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    const wb = XLSX.utils.book_new();

    for (const sheetName of Object.keys(sheetsData)) {
      const sheet = sheetsData[sheetName];

      if (!Array.isArray(sheet)) continue;

      const maxCols = Math.max(...sheet.map(r => (Array.isArray(r) ? r.length : 0)), 1);

      const normalized = sheet.map(row => {
        const arr = Array.isArray(row) ? [...row] : [];
        while (arr.length < maxCols) arr.push("");
        return arr;
      });

      const worksheet = XLSX.utils.aoa_to_sheet(normalized);

      worksheet["!cols"] = normalized[0]?.map((_, colIndex) => {
        let maxLen = 10;
        normalized.forEach(r => {
          const val = r[colIndex] ?? "";
          maxLen = Math.max(maxLen, String(val).length);
        });
        return { wch: Math.min(maxLen + 2, 40) };
      });

      XLSX.utils.book_append_sheet(wb, worksheet, sheetName);
    }

    if (wb.SheetNames.length === 0) {
      return res.status(400).json({ success: false, message: "No valid sheets provided" });
    }

    XLSX.writeFile(wb, file.filePath);

    file.version += 1;
    file.lastUpdatedAt = new Date();

    file.history.push({
      userId: req.user.id,
      action: "edit",
      version: file.version,
      changes: "Multi-sheet update"
    });

    await file.save();

    res.json({ success: true, message: "File updated successfully", data: file });

  } catch (e) {
    console.error("Update error:", e);
    res.status(500).json({ success: false, message: "Server error during update" });
  }
};

/*---------------------------------------------
  ADD NOTE
----------------------------------------------*/
export const addNote = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "Note content required" });
    }

    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: 'File not found' });

    file.notes.push({
      userId: req.user.id,
      content: content.trim()
    });

    await file.save();
    await file.populate('notes.userId', 'name');

    res.json({ success: true, message: "Note added", data: file.notes });

  } catch (err) {
    console.error("Note error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/*---------------------------------------------
  DOWNLOAD
----------------------------------------------*/
export const downloadExcelFile = async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    if (!fs.existsSync(file.filePath)) {
      return res.status(404).json({ success: false, message: "File missing on disk" });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalFileName}"`);

    fs.createReadStream(file.filePath).pipe(res);

  } catch (e) {
    console.error("Download error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/*---------------------------------------------
  DELETE
----------------------------------------------*/
export const deleteExcelFile = async (req, res) => {
  try {
    const file = await ExcelFile.findById(req.params.id);
    if (!file) return res.status(404).json({ success: false, message: "File not found" });

    if (fs.existsSync(file.filePath)) fs.unlinkSync(file.filePath);

    file.history.push({
      userId: req.user.id,
      action: "delete",
      version: file.version
    });

    await ExcelFile.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "File deleted successfully" });

  } catch (e) {
    console.error("Delete error:", e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
