import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Search, Plus, Trash2, Calendar, User, Phone, MessageSquare, Edit, Filter, Eye, BarChart3, Users, Activity, ImageIcon, Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config';
import { useAuth } from '@/contexts/AuthContext';
import InteractionForm from '@/components/InteractionForm';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Interaction {
  _id: string;
  date: string;
  clientName: string;
  contactNumber: string;
  clientStatus: 'existing' | 'potential';
  clientType?: string;
  interactionType: 'Call' | 'WhatsApp' | 'Email' | 'Meeting';
  handledBy: {
    _id: string;
    name: string; 
    email: string;
  };
  notes: string;
  clientMessage?: string;
  replyMessage?: string;
  referenceSource?: string;
  images?: string[];
  createdAt: string;
}

interface Conversation {
  _id: string;
  clientName: string;
  contactNumber: string;
  clientStatus: 'existing' | 'potential';
  clientType?: string;
  lastInteractionDate: string;
  totalInteractions: number;
  interactions: Interaction[];
}

const Interactions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [clientStatus, setClientStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  const [viewingConversation, setViewingConversation] = useState<Conversation | null>(null);
  const [addingInteraction, setAddingInteraction] = useState<Conversation | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [uploadingInteractionId, setUploadingInteractionId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [editingConversationDialog, setEditingConversationDialog] = useState<Conversation | null>(null);
  const [editFormData, setEditFormData] = useState({
    clientName: '',
    contactNumber: '',
    clientStatus: 'potential',
    clientType: 'Luke Warm'
  });
      const [pagination, setPagination] = useState({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  itemsPerPage: 10
  });
  const [stats, setStats] = useState({
  totalConversations: 0,
  existingClients: 0,
  potentialClients: 0,
  thisMonth: 0
});

  const [updatingConversation, setUpdatingConversation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = user?.roles?.includes('admin');
  const isStaff = user?.roles?.some(role => ['admin', 'manager' , 'executive'].includes(role));

const fetchConversations = async () => { 
  try {
    setLoading(true);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: pageSize.toString(),
      search: searchTerm,
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
      ...(clientName && { clientName }),
      ...(contactNumber && { contactNumber }),
      ...(clientStatus && clientStatus !== 'all' && { clientStatus })
    });

    const response = await fetch(
      `${API_BASE_URL}/api/admin/conversations?${params}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      setConversations(result.data);

      // ✅ THIS is your missing "total conversation code"
      setPagination({
        currentPage: result.pagination.currentPage,
        totalPages: result.pagination.totalPages,
        totalItems: result.pagination.totalItems,
        itemsPerPage: result.pagination.itemsPerPage
      });
      setStats(result.stats);
    } else {
      toast({
        title: 'Error',
        description: result.message || 'Failed to fetch conversations',
        variant: 'destructive'
      });
    }
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Failed to fetch conversations',
      variant: 'destructive'
    });
  } finally {
    setLoading(false);
  }
};

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this interaction?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/interactions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: 'Interaction deleted successfully'
        });
        fetchConversations();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to delete interaction',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete interaction',
        variant: 'destructive'
      });
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchConversations();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setClientName('');
    setContactNumber('');
    setClientStatus('');
    setPage(1);
    fetchConversations();
  };

  const handleImageUpload = async (interactionId: string, files: FileList) => {
    if (!files || files.length === 0) return;

    setUploadingInteractionId(interactionId);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const response = await fetch(`${API_BASE_URL}/api/admin/interactions/${interactionId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: 'Images uploaded successfully'
        });
        fetchConversations();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to upload images',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload images',
        variant: 'destructive'
      });
    } finally {
      setUploadingInteractionId(null);
    }
  };

  const triggerFileInput = (interactionId: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-interaction-id', interactionId);
      fileInputRef.current.click();
    }
  };

  const handleEditConversation = (conversation: Conversation) => {
    setEditingConversationDialog(conversation);
    setEditFormData({
      clientName: conversation.clientName,
      contactNumber: conversation.contactNumber,
      clientStatus: conversation.clientStatus,
      clientType: conversation.clientType || 'Luke Warm'
    });
  };

  const handleUpdateConversation = async () => {
    if (!editingConversationDialog) return;

    try {
      setUpdatingConversation(true);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/conversations/${encodeURIComponent(editingConversationDialog.contactNumber)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            clientName: editFormData.clientName,
            newContactNumber: editFormData.contactNumber,
            clientStatus: editFormData.clientStatus,
            clientType: editFormData.clientStatus === 'potential' ? editFormData.clientType : ''
          })
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Conversation updated successfully'
        });
        setEditingConversationDialog(null);
        fetchConversations();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to update conversation',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update conversation',
        variant: 'destructive'
      });
    } finally {
      setUpdatingConversation(false);
    }
  };

  const handleExportToExcel = async () => {
    setExporting(true);
    
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(clientName && { clientName }),
        ...(contactNumber && { contactNumber }),
        ...(clientStatus && clientStatus !== 'all' && { clientStatus })
      });

      const response = await fetch(`${API_BASE_URL}/api/admin/conversations/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `interactions_export_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Success',
          description: 'Interactions exported to Excel successfully'
        });
      } else {
        const result = await response.json();
        toast({
          title: 'Error',
          description: result.message || 'Failed to export interactions',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export interactions',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (isStaff) {
      fetchConversations();
    }
  }, [page, pageSize, isStaff]);

  const getInteractionTypeColor = (type: string) => {
    switch (type) {
      case 'Call': return 'bg-blue-100 text-blue-800';
      case 'WhatsApp': return 'bg-green-100 text-green-800';
      case 'Email': return 'bg-purple-100 text-purple-800';
      case 'Meeting': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Client name colour for "Yet to be Client" leads: Luke Warm -> pink, Warm -> yellow, Hot -> green
  const getClientNameColor = (clientStatus: string, clientType?: string) => {
    if (clientStatus !== 'potential') return '';
    switch (clientType) {
      case 'Hot': return 'text-green-600';
      case 'Warm': return 'text-yellow-600';
      default: return 'text-pink-500'; // Luke Warm (default, also for older records without a type)
    }
  };

  const getClientStatusColor = (status: string) => {
    switch (status) {
      case 'existing': return 'bg-green-100 text-green-800';
      case 'potential': return 'bg-yellow-100 text-yellow-800';
      case 'closed-not-interested': return 'bg-red-100 text-red-800';
      case 'closed-service-done': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getClientStatusLabel = (status: string) => {
    switch (status) {
      case 'existing': return 'Existing Client';
      case 'potential': return 'Yet to be Client';
      case 'closed-not-interested': return 'Closed (Not Interested)';
      case 'closed-service-done': return 'Closed (Service Done)';
      default: return status;
    }
  };

  if (!isStaff) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to view this page.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Client Interactions</h1>
            <p className="text-gray-600 mt-1">Manage and view client interaction history</p>
          </div>
          {isStaff && (
            <Dialog open={showForm} onOpenChange={(open) => {
              setShowForm(open);
              if (!open) {
                setEditingInteraction(null);
              } else if (!editingInteraction) {
                // Set default date/time for new interaction to current real-time
                setEditingInteraction({
                  _id: '',
                  clientName: '',
                  contactNumber: '',
                  clientStatus: 'potential',
                  interactionType: 'Call' as const,
                  handledBy: { _id: '', name: '', email: '' },
                  notes: '',
                  date: new Date().toISOString(),
                  clientMessage: '',
                  replyMessage: '',
                  images: [],
                  createdAt: ''
                });
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Interaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingInteraction && editingInteraction._id ? 'Edit Interaction' : 'Add New Interaction'}</DialogTitle>
                </DialogHeader>
                <InteractionForm
                  editData={editingInteraction && editingInteraction._id ? editingInteraction : undefined}
                  onSuccess={() => {
                    setShowForm(false);
                    setEditingInteraction(null);
                    fetchConversations();
                  }}
                  onCancel={() => {
                    setShowForm(false);
                    setEditingInteraction(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Conversations</p>
                  <p className="text-2xl font-bold text-gray-900">{pagination.totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Existing Clients</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.existingClients || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card> 
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <User className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Potential Clients</p>
                  <p className="text-2xl font-bold text-gray-900">
{stats?.potentialClients || 0}                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats?.thisMonth || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="text-lg">Filters</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="text-gray-600 hover:text-gray-800"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Client name, number, or notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Status</label>
                <Select value={clientStatus} onValueChange={setClientStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="existing">Existing Client</SelectItem>
                    <SelectItem value="potential">Yet to be Client</SelectItem>
                    <SelectItem value="closed-not-interested">Closed (Not Interested)</SelectItem>
                    <SelectItem value="closed-service-done">Closed (Service Done)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleSearch} disabled={loading} className="flex-1">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  Clear
                </Button>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <Input
                      placeholder="Filter by client name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <Input
                      placeholder="Filter by contact number"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversations Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xl">Conversations</CardTitle>
            {isStaff && !exporting && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportToExcel}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export Excel
              </Button>
            )}
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading conversations...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No conversations found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Last Interaction</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Last Handled By</TableHead>
                    <TableHead>Total Interactions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map((conversation) => (
                    <TableRow
                      key={conversation._id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setViewingConversation(conversation)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium">{new Date(conversation.lastInteractionDate).toLocaleDateString()}</p>
                          <p className="text-sm text-gray-500">{new Date(conversation.lastInteractionDate).toLocaleTimeString('en-US', { hour12: true })}</p>
                        </div>
                      </TableCell>
                      <TableCell className={`font-medium ${getClientNameColor(conversation.clientStatus, conversation.clientType)}`}>
                        {conversation.clientName}
                      </TableCell>
                      <TableCell>{conversation.contactNumber}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{conversation.interactions[0]?.handledBy?.name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800">
                          {conversation.totalInteractions}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getClientStatusColor(conversation.clientStatus)}>
                          {getClientStatusLabel(conversation.clientStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditConversation(conversation)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            title="Edit conversation"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setViewingConversation(conversation);
                            }}
                            className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                            title="View conversation"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View Conversation Dialog */}
        <Dialog open={!!viewingConversation} onOpenChange={() => setViewingConversation(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>View Conversation Details</DialogTitle>
            </DialogHeader>
            {viewingConversation && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className={`font-medium ${getClientNameColor(viewingConversation.clientStatus, viewingConversation.clientType)}`}>{viewingConversation.clientName}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium">{viewingConversation.contactNumber}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Status</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <Badge className={getClientStatusColor(viewingConversation.clientStatus)}>
                        {getClientStatusLabel(viewingConversation.clientStatus)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Handled By</label>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{viewingConversation.interactions[0]?.handledBy?.name || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                  <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Reference Source
  </label>
  <div className="p-3 bg-gray-50 rounded-lg">
    <p className="font-medium">
              {viewingConversation.interactions?.[0]?.referenceSource || 'Not Available'}
    </p>
  </div>
</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interaction History</label>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {viewingConversation.interactions.map((interaction, idx) => (
                      <div key={interaction._id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={getInteractionTypeColor(interaction.interactionType)}>
                              {interaction.interactionType}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              {new Date(interaction.date).toLocaleDateString()} at {new Date(interaction.date).toLocaleTimeString('en-US', { hour12: true })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">#{viewingConversation.interactions.length - idx}</span>
                          </div>
                        </div>
                        {/* Client Conversation */}
                        {interaction.clientMessage && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-black-600 uppercase">Client Said:</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{interaction.clientMessage}</p>
                          </div>
                        )}
                        {/* Reply Message */}
                        {interaction.replyMessage && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-black-600 uppercase">Our Reply:</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{interaction.replyMessage}</p>
                          </div>
                        )}
                        {/* Notes */}
                        {interaction.notes && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-gray-500 uppercase">Notes:</p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{interaction.notes}</p>
                          </div>
                        )}
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Handled by:</strong> {interaction.handledBy?.name || 'Unknown'}
                        </p>
                        <div className="flex justify-end mb-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerFileInput(interaction._id);
                            }}
                            disabled={uploadingInteractionId === interaction._id}
                            className="text-xs"
                          >
                            {uploadingInteractionId === interaction._id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-600 mr-1"></div>
                                Uploading...
                              </>
                            ) : (
                              <>
                                <Upload className="w-3 h-3 mr-1" />
                                Upload Images
                              </>
                            )}
                          </Button>
                        </div>
                        {interaction.images && interaction.images.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Attached Images:</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {interaction.images.map((image, imgIndex) => (
                                <div key={imgIndex} className="relative">
                                  <img
                                    src={`${API_BASE_URL}/api/uploads/${image}`}
                                    alt={`Attachment ${imgIndex + 1}`}
                                    className="w-full h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                                    onClick={() => window.open(`${API_BASE_URL}/api/uploads/${image}`, '_blank')}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => {
                      setAddingInteraction(viewingConversation);
                      setViewingConversation(null);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Interaction
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewingConversation(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Conversation Dialog */}
        <Dialog open={!!editingConversationDialog} onOpenChange={() => setEditingConversationDialog(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Conversation</DialogTitle>
            </DialogHeader>
            {editingConversationDialog && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editClientName">Client Name</Label>
                  <Input
                    id="editClientName"
                    value={editFormData.clientName}
                    onChange={(e) => setEditFormData({ ...editFormData, clientName: e.target.value })}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <Label htmlFor="editContactNumber">Contact Number</Label>
                  <Input
                    id="editContactNumber"
                    value={editFormData.contactNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, contactNumber: e.target.value })}
                    placeholder="Enter contact number"
                  />
                </div>
                <div>
                  <Label htmlFor="editClientStatus">Client Status</Label>
                  <Select 
                    value={editFormData.clientStatus} 
                    onValueChange={(value) => setEditFormData({ ...editFormData, clientStatus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="existing">Existing Client</SelectItem>
                      <SelectItem value="potential">Yet to be Client</SelectItem>
                      <SelectItem value="closed-not-interested">Closed (Not Interested)</SelectItem>
                      <SelectItem value="closed-service-done">Closed (Service Done)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editFormData.clientStatus === 'potential' && (
                  <div>
                    <Label htmlFor="editClientType">Client Type</Label>
                    <Select
                      value={editFormData.clientType}
                      onValueChange={(value) => setEditFormData({ ...editFormData, clientType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Luke Warm">Luke Warm</SelectItem>
                        <SelectItem value="Warm">Warm</SelectItem>
                        <SelectItem value="Hot">Hot</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setEditingConversationDialog(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateConversation}
                    disabled={updatingConversation || !editFormData.clientName || !editFormData.contactNumber}
                  >
                    {updatingConversation ? 'Updating...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

                {/* Add Interaction Dialog */}
        <Dialog open={!!addingInteraction} onOpenChange={() => setAddingInteraction(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
            <DialogTitle>Add New Interaction</DialogTitle>
            </DialogHeader>
            {addingInteraction && (
              <InteractionForm
                quickAdd={true}
                editData={{
                  clientName: addingInteraction.clientName,
                  contactNumber: addingInteraction.contactNumber,
                  clientStatus: addingInteraction.clientStatus,
                  clientType: addingInteraction.clientType,
                  interactionType: 'Call' as const,
                  notes: '',
                  date: new Date().toISOString()
                }}
                onSuccess={() => {
                  setAddingInteraction(null);
                  fetchConversations();
                }}
                onCancel={() => setAddingInteraction(null)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Pagination */}
        {pagination.totalItems > 0 && (
          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="flex items-center gap-2"
                  >
                    <span className="text-sm">←</span>
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-600">Page</span>
                    <span className="font-medium text-gray-900">{page}</span>
                    <span className="text-sm text-gray-600">of</span>
                    <span className="font-medium text-gray-900">{pagination.totalPages}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="flex items-center gap-2"
                  >
                    Next
                    <span className="text-sm">→</span>
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Rows per page</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => {
                        setPageSize(parseInt(value));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-[80px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[10, 25, 50, 100].map((size) => (
                          <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-gray-500">
                    Showing {conversations.length} of {pagination.totalItems} conversations
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Hidden file input for image uploads */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          multiple
          accept="image/*"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const interactionId = e.currentTarget.getAttribute('data-interaction-id');
            if (interactionId && e.target.files) {
              handleImageUpload(interactionId, e.target.files);
            }
            e.target.value = '';
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default Interactions;