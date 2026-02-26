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
import { Plus, Download, Edit, Trash2, Search, Home } from 'lucide-react';
import { toast } from 'sonner';
import { servicesData } from '@/data/servicesData';
import QuotationForm from '@/components/quotation/QuotationForm';
import QuotationTable from '@/components/quotation/QuotationTable';

const QuotationManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState(null);

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

  const filteredQuotations = quotations.filter(quotation =>
    quotation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Quotation Management</h1>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/dashboard')}>
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
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
    </div>
  );
};

export default QuotationManagement;
