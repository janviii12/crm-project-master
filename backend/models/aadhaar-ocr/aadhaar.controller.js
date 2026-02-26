import AadhaarService from './aadhaar.service.js';
import { generateExcel, getExcel, deleteExcel } from './aadhaar.service.js';

export const uploadAadhaar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await AadhaarService.processAadhaar({
      file: req.file,
      userId: req.user.id
    });

    return res.status(200).json({
      message: 'Aadhaar scanned successfully',
      data: result
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'OCR processing failed' });
  }
};

export const generateExcelController = async (req, res) => {
  try {
    const excel = await generateExcel(req.user.id);

    return res.status(201).json({
      message: 'Excel generated successfully',
      excelId: excel.id
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Excel generation failed' });
  }
};

export const downloadExcel = async (req, res) => {
  try {
    const filePath = await getExcel(
      req.params.id,
      req.user.id
    );

    return res.download(filePath);

  } catch (err) {
    return res.status(404).json({ message: 'Excel not found' });
  }
};

export const deleteExcelController = async (req, res) => {
  try {
    await deleteExcel(
      req.params.id,
      req.user.id
    );

    return res.status(200).json({ message: 'Excel deleted permanently' });

  } catch (err) {
    return res.status(500).json({ message: 'Delete failed' });
  }
};
