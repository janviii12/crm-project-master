import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Download, Edit, Trash2, Search, Home, Upload, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { servicesData } from '@/data/servicesData';
import QuotationForm from '@/components/quotation/QuotationForm';
import QuotationTable from '@/components/quotation/QuotationTable';
import DashboardLayout from '@/components/layout/DashboardLayout';

const QuotationManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);
  // Upload dialog state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedQuotationForUpload, setSelectedQuotationForUpload] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quotations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setQuotations(data);
      } else {
        toast.error('Failed to fetch quotations');
      }
    } catch (error) {
      toast.error('Error fetching quotations');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateQuotation = async (quotationData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quotations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(quotationData)
      });
      const data = await response.json();
      if (response.ok) {
        setQuotations([data, ...quotations]);
        setIsFormOpen(false);
        toast.success('Quotation created successfully');
      } else {
        toast.error(data.message || 'Failed to create quotation');
      }
    } catch (error) {
      toast.error('Error creating quotation');
    }
  };

  const handleUpdateQuotation = async (quotationData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quotations/${editingQuotation._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(quotationData)
      });
      const data = await response.json();
      if (response.ok) {
        setQuotations(quotations.map(q => q._id === editingQuotation._id ? data : q));
        setIsFormOpen(false);
        setEditingQuotation(null);
        toast.success('Quotation updated successfully');
      } else {
        toast.error(data.message || 'Failed to update quotation');
      }
    } catch (error) {
      toast.error('Error updating quotation');
    }
  };

  const handleDeleteQuotation = async (id) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        setQuotations(quotations.filter(q => q._id !== id));
        toast.success('Quotation deleted successfully');
      } else {
        toast.error('Failed to delete quotation');
      }
    } catch (error) {
      toast.error('Error deleting quotation');
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quotations/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quotation-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error('Failed to download PDF');
      }
    } catch (error) {
      toast.error('Error downloading PDF');
    }
  };

  // Handle file upload
  const handleUploadFile = async () => {
    if (!uploadFile || !selectedQuotationForUpload) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);

    try {
      const response = await fetch(`${API_BASE_URL}/api/quotations/${selectedQuotationForUpload._id}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const data = await response.json();
      if (response.ok) {
        setQuotations(quotations.map(q => q._id === selectedQuotationForUpload._id ? data : q));
        setIsUploadOpen(false);
        setUploadFile(null);
        setSelectedQuotationForUpload(null);
        toast.success('File uploaded successfully');
      } else {
        toast.error(data.message || 'Failed to upload file');
      }
    } catch (error) {
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  // Handle download uploaded file
  const handleDownloadUploadedFile = async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/quotations/${id}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Extract filename from content-disposition header or use default
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = `quotation-file-${id}`;
        if (contentDisposition) {
          const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
          if (fileNameMatch) fileName = fileNameMatch[1];
        }
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to download file');
      }
    } catch (error) {
      toast.error('Error downloading file');
    }
  };

  // Open upload dialog for a quotation
  const openUploadDialog = (quotation) => {
    setSelectedQuotationForUpload(quotation);
    setIsUploadOpen(true);
  };

  const filteredQuotations = quotations.filter(quotation =>
    quotation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-3xl font-bold">Quotation Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Quotation
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <QuotationTable
        quotations={filteredQuotations}
        onEdit={(quotation) => {
          setEditingQuotation(quotation);
          setIsFormOpen(true);
        }}
        onDelete={handleDeleteQuotation}
        onDownload={handleDownloadPDF}
        onUpload={openUploadDialog}
        onDownloadUploaded={handleDownloadUploadedFile}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuotation ? 'Edit Quotation' : 'Create New Quotation'}
            </DialogTitle>
          </DialogHeader>
          <QuotationForm
            quotation={editingQuotation}
            onSubmit={editingQuotation ? handleUpdateQuotation : handleCreateQuotation}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingQuotation(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Upload File Dialog */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Quotation File</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Quotation</Label>
              <p className="text-sm font-medium mt-1">
                {selectedQuotationForUpload?.quotationNumber} - {selectedQuotationForUpload?.title}
              </p>
            </div>
            <div>
              <Label htmlFor="file-upload">Select File (PDF or Word)</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported formats: PDF, DOC, DOCX
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsUploadOpen(false);
                setUploadFile(null);
                setSelectedQuotationForUpload(null);
              }}>
                Cancel
              </Button>
              <Button onClick={handleUploadFile} disabled={uploading || !uploadFile}>
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
};

export default QuotationManagement;
