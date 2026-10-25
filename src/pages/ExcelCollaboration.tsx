import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Edit, Trash2, MessageSquare, Eye, Download, Search, Calendar } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';
import ExcelEditor from '@/components/ExcelEditor';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface ExcelFile {
  _id: string;
  fileName: string;
  originalFileName: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  uploadedAt: string;
  lastUpdatedAt: string;
  version: number;
  fileSize: number;
  notes: Array<{
    userId: {
      _id: string;
      name: string;
    };
    content: string;
    createdAt: string;
  }>;
}

const ExcelCollaboration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [files, setFiles] = useState<ExcelFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<ExcelFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<ExcelFile | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    filterFiles();
  }, [files, searchTerm, startDate, endDate]);

  const filterFiles = () => {
    let filtered = files;

    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.originalFileName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (startDate) {
      filtered = filtered.filter(file =>
        new Date(file.uploadedAt) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(file =>
        new Date(file.uploadedAt) <= new Date(endDate)
      );
    }

    setFilteredFiles(filtered);
  };

  const fetchFiles = async () => {
    try {
      const response = await axiosInstance.get('/api/excel');
      if (response.data.success) {
        setFiles(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx')) {
      toast.error('Only .xlsx files are allowed');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('excelFile', file);

    try {
      const response = await axiosInstance.post('/api/excel/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data.success) {
        toast.success('File uploaded successfully');
        fetchFiles();
      } else {
        toast.error(response.data.message || 'Upload failed');
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await axiosInstance.delete(`/api/excel/${fileId}`);
      if (response.data.success) {
        toast.success('File deleted successfully');
        fetchFiles();
      } else {
        toast.error(response.data.message || 'Delete failed');
      }
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleAddNote = async () => {
    if (!selectedFile || !newNote.trim()) return;

    try {
      const response = await axiosInstance.post(`/api/excel/${selectedFile._id}/notes`, {
        content: newNote,
      });
      if (response.data.success) {
        toast.success('Note added successfully');
        setNewNote('');
        fetchFiles();
        setSelectedFile(null);
        setShowNotes(false);
      } else {
        toast.error(response.data.message || 'Failed to add note');
      }
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const canDelete = (file: ExcelFile) => {
    return user?.roles?.includes('admin') || user?.roles?.includes('manager');
  };

  const canDownload = (file: ExcelFile) => {
    return user?.roles?.includes('executive') || user?.roles?.includes('admin') || user?.roles?.includes('manager');
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await axiosInstance.get(`/api/excel/${fileId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Excel Collaboration</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button asChild disabled={uploading}>
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Excel'}
              </span>
            </Button>
          </label>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Excel Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                <Input
                  placeholder="Search by filename..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <Input
                  type="date"
                  placeholder="Start date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span>to</span>
                <Input
                  type="date"
                  placeholder="End date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => (
                <TableRow key={file._id}>
                  <TableCell className="font-medium">{file.originalFileName}</TableCell>
                  <TableCell>{file.uploadedBy.name}</TableCell>
                  <TableCell>{new Date(file.lastUpdatedAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">v{file.version}</Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(file.fileSize)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(file);
                          setShowEditor(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFile(file)}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Notes for {file.originalFileName}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="max-h-60 overflow-y-auto">
                              {file.notes.length === 0 ? (
                                <p className="text-muted-foreground">No notes yet</p>
                              ) : (
                                file.notes.map((note, index) => (
                                  <div key={index} className="border-b pb-2 mb-2">
                                    <div className="flex justify-between items-start">
                                      <span className="font-medium">{note.userId.name}</span>
                                      <span className="text-sm text-muted-foreground">
                                        {new Date(note.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-sm mt-1">{note.content}</p>
                                  </div>
                                ))
                              )}
                            </div>
                            <div className="space-y-2">
                              <Textarea
                                placeholder="Add a note..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                              />
                              <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                                Add Note
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      {canDownload(file) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file._id, file.originalFileName)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {canDelete(file) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(file._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredFiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {files.length === 0 ? 'No Excel files uploaded yet. Upload your first file to get started.' : 'No files match your search criteria.'}
            </div>
          )}
        </CardContent>
      </Card>

      {showEditor && selectedFile && (
        <ExcelEditor
          file={selectedFile}
          onClose={() => {
            setShowEditor(false);
            setSelectedFile(null);
            fetchFiles();
          }}
        />
      )}
    </div>
    </DashboardLayout>
  );
};

export default ExcelCollaboration;
