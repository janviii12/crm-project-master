// src/components/ExcelEditor.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Save, X, Plus, Edit2, Trash2 } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.css';

registerAllModules();

interface ExcelFile {
  _id: string;
  fileName: string;
  originalFileName: string;
}

interface ExcelEditorProps {
  file: ExcelFile;
  onClose: () => void;
}

const ExcelEditor: React.FC<ExcelEditorProps> = ({ file, onClose }) => {

  const [sheetsData, setSheetsData] = useState<Record<string, string[][]>>({});
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheetName, setActiveSheetName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const hotTableRef = useRef<any>(null);

  /** ------------------------------------------------------
   * LOAD DATA
   * ------------------------------------------------------ */
  useEffect(() => {
    loadExcel();
  }, [file._id]);

  const loadExcel = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/excel/${file._id}/view`);

      const sheets = res.data?.data?.sheets || {};
      const names = Object.keys(sheets);

      if (names.length === 0) {
        setSheetsData({ Sheet1: [['']] });
        setSheetNames(['Sheet1']);
        setActiveSheetName('Sheet1');
      } else {
        // normalize
        const normalized: Record<string, string[][]> = {};
        names.forEach((n) => {
          const s = sheets[n];
          normalized[n] = Array.isArray(s) && s.length > 0 ? s : [['']];
        });

        setSheetsData(normalized);
        setSheetNames(names);
        setActiveSheetName(names[0]);
      }
    } catch (err) {
      toast.error('Error loading Excel file');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  /** ------------------------------------------------------
   * SYNC HOT WITH REACT STATE
   * ------------------------------------------------------ */
  const persistHotToState = () => {
    const hot = hotTableRef.current?.hotInstance;
    if (!hot) return;

    const data = hot.getData();
    const normalized = data.map((row) =>
      row.map((cell) => (cell == null ? '' : String(cell)))
    );

    setSheetsData((prev) => ({
      ...prev,
      [activeSheetName]: normalized,
    }));
  };

  const handleSheetChange = (changes: any, source: string) => {
    if (!changes || source === 'loadData') return;
    persistHotToState();
  };

  /** ------------------------------------------------------
   * SHEET SWITCH
   * ------------------------------------------------------ */
  const handleSelectSheet = (name: string) => {
    if (name === activeSheetName) return;
    persistHotToState();
    setActiveSheetName(name);
  };

  /** ------------------------------------------------------
   * ADD ROW / ADD COLUMN
   * (React state controlled)
   * ------------------------------------------------------ */

  const addRow = () => {
    setSheetsData((prev) => {
      const sheet = prev[activeSheetName] || [];
      const colCount = sheet[0]?.length || 1;
      const newRow = Array(colCount).fill("");

      return {
        ...prev,
        [activeSheetName]: [...sheet, newRow]
      };
    });
  };

  const addColumn = () => {
    setSheetsData((prev) => {
      const sheet = prev[activeSheetName] || [];

      return {
        ...prev,
        [activeSheetName]: sheet.map((row) => [...row, ""])
      };
    });
  };

  /** ------------------------------------------------------
   * ADD SHEET
   * ------------------------------------------------------ */
  const addSheet = () => {
    persistHotToState();

    let index = sheetNames.length + 1;
    let name = `Sheet${index}`;
    while (sheetNames.includes(name)) {
      index++;
      name = `Sheet${index}`;
    }

    setSheetsData((prev) => ({ ...prev, [name]: [['']] }));
    setSheetNames((prev) => [...prev, name]);
    setActiveSheetName(name);
  };

  /** ------------------------------------------------------
   * SAVE
   * ------------------------------------------------------ */
  const handleSave = async () => {
    setSaving(true);
    persistHotToState();

    try {
      const payload: Record<string, string[][]> = {};
      sheetNames.forEach((name) => {
        payload[name] = sheetsData[name] || [['']];
      });

      const res = await axiosInstance.put(
        `/api/excel/${file._id}/update`,
        { sheetsData: payload }
      );

      if (res.data?.success) {
        toast.success("Saved successfully");
        onClose();
      } else {
        toast.error("Save failed");
      }
    } catch (err) {
      toast.error("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const getActiveSheetData = () => {
    return sheetsData[activeSheetName] || [[""]];
  };

  /** ------------------------------------------------------
   * UI RENDER
   * ------------------------------------------------------ */

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[80vh]">
          <div className="flex justify-center items-center h-64">
            Loading Excel file...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background p-6">
      <div className="flex flex-col h-full bg-white rounded shadow">

        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-semibold">
              Editing: {file.originalFileName}
            </h2>
            <p className="text-sm text-muted-foreground">
              Active Sheet: {activeSheetName}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={addRow}>Add Row</Button>
            <Button variant="outline" onClick={addColumn}>Add Column</Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" /> Exit
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {/* MAIN SHEET */}
        <div className="flex-1 p-4 overflow-hidden">
          <HotTable
            ref={hotTableRef}
            data={getActiveSheetData()}
            colHeaders={true}
            rowHeaders={true}
            stretchH="all"
            height="calc(100vh - 260px)"
            manualRowResize={true}
            manualColumnResize={true}
            afterChange={handleSheetChange}
            licenseKey="non-commercial-and-evaluation"
          />
        </div>

        {/* SHEET TABS */}
        <div className="flex items-center gap-2 p-3 border-t">
          {sheetNames.map((name) => (
            <div
              key={name}
              onClick={() => handleSelectSheet(name)}
              className={`px-3 py-2 rounded cursor-pointer ${
                activeSheetName === name
                  ? "bg-primary/20 border border-primary"
                  : "bg-muted/30"
              }`}
            >
              {name}
            </div>
          ))}

          <div
            onClick={addSheet}
            className="flex items-center px-3 py-2 cursor-pointer bg-muted/20 rounded"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Sheet
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExcelEditor;
