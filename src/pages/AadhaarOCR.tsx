import React, { useState } from "react";
import axios from "axios";

interface AadhaarRecord {
  name: string;
  father: string;
  dob: string;
  gender: string;
  aadhaar: string;
  address: string;
}

const AadhaarOCR: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [records, setRecords] = useState<AadhaarRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [excelId, setExcelId] = useState<string | null>(null);

  const uploadAadhaar = async () => {
    if (!file) return alert("Select Aadhaar file");

    const formData = new FormData();
    formData.append("aadhaar", file);

    try {
      setLoading(true);
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/aadhaar/upload`,
        formData,
        { withCredentials: true }
      );

      setRecords(prev => [...prev, res.data.data]);
      setFile(null);
    } catch {
      alert("OCR failed");
    } finally {
      setLoading(false);
    }
  };

  const generateExcel = async () => {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/aadhaar/generate-excel`,
      {},
      { withCredentials: true }
    );
    setExcelId(res.data.excelId);
  };

  const downloadExcel = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/aadhaar/excel/${excelId}`,
        {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (!response.ok) {
        throw new Error('Download failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aadhaar-${excelId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      alert('Download failed');
    }
  };

  const deleteExcel = async () => {
    await axios.delete(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/aadhaar/excel/${excelId}`,
      { withCredentials: true }
    );
    setExcelId(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-2xl font-semibold mb-4">
          Aadhaar OCR → Excel
        </h1>

        {/* Upload */}
        <div className="flex items-center gap-4 mb-6">
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0 file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          <button
            onClick={uploadAadhaar}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Scanning..." : "Upload"}
          </button>
        </div>

        {/* Info */}
        <p className="text-sm text-gray-500 mb-4">
          Aadhaar files are automatically deleted after 10 minutes.
        </p>

        {/* Table */}
        {records.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Father</th>
                  <th className="p-2 border">DOB</th>
                  <th className="p-2 border">Gender</th>
                  <th className="p-2 border">Aadhaar</th>
                  <th className="p-2 border">Address</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-2 border">{r.name}</td>
                    <td className="p-2 border">{r.father}</td>
                    <td className="p-2 border">{r.dob}</td>
                    <td className="p-2 border">{r.gender}</td>
                    <td className="p-2 border">{r.aadhaar}</td>
                    <td className="p-2 border">{r.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Actions */}
        {records.length > 0 && (
          <div className="flex gap-4 mt-6">
            <button
              onClick={generateExcel}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Generate Excel
            </button>
          </div>
        )}

        {excelId && (
          <div className="flex gap-4 mt-4">
            <button
              onClick={downloadExcel}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Download Excel
            </button>

            <button
              onClick={deleteExcel}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete Excel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AadhaarOCR;
