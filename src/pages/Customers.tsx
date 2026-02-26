import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Eye, Mail, Phone, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../lib/axiosInstance';
import { servicesData } from '@/data/servicesData';

interface ServiceData {
  title: string;
  documents: string[];
  steps: string[];
  time: string;
}

  interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'pending' | 'verified' | 'rejected' | 'on_hold';
    submittedAt: string;
    type?: string;
    filePath?: string;
    fileOriginalName?: string;
  }

  const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCustomer, setNewCustomer] = useState({
      name: '',
      email: '',
      phone: '',
      type: '',
      file: null as File | null,
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Fetch customers from backend
    useEffect(() => {
      const fetchCustomers = async () => {
        try {
          const response = await axiosInstance.get(`/api/customers?page=${currentPage}&limit=10`);
          if (response.data.success) {
            setCustomers(response.data.data);
            setTotalPages(response.data.pagination.totalPages);
            setTotalCount(response.data.pagination.totalCount);
          }
        } catch (error) {
          console.error('Error fetching customers:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchCustomers();
    }, [currentPage]);

    const filteredCustomers = customers.filter(customer => {
      const matchesSearch =
        (customer.name && customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'verified':
          return 'bg-success/10 text-success hover:bg-success/20';
        case 'pending':
          return 'bg-warning/10 text-warning hover:bg-warning/20';
        case 'rejected':
          return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
        case 'on_hold':
          return 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20';
        case 'in_progress':
          return 'bg-gray-500/10 text-blue-600 hover:bg-gray-500/20';
        case 'completed':
          return 'bg-pink-900/10 text-purple-600 hover:bg-black-500/20';
        default:
          return 'bg-secondary';
      }
    };
    const handleAddCustomer = async () => {
      if (!newCustomer.name.trim() || !newCustomer.email.trim() || !newCustomer.phone.trim()) {
        alert('Name, email, and phone are required.');
        return;
      }
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('name', newCustomer.name);
        formData.append('email', newCustomer.email);
        formData.append('phone', newCustomer.phone);
        formData.append('serviceType', newCustomer.type);
        if (newCustomer.file) {
          formData.append('file', newCustomer.file);
        }

        const response = await axiosInstance.post('/api/customers/create', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (!response.data.success) {
          throw new Error(response.data.message || 'Failed to create customer');
        }

        if (response.data.success) {
          setNewCustomer({ name: '', email: '', phone: '', type: '', file: null });
          setShowForm(false);
          // Refresh the customer list
          const fetchResponse = await axiosInstance.get(`/api/customers?page=${currentPage}&limit=10`);
          if (fetchResponse.data.success) {
            setCustomers(fetchResponse.data.data);
            setTotalPages(fetchResponse.data.pagination.totalPages);
            setTotalCount(fetchResponse.data.pagination.totalCount);
          }
        } else {
          console.error('Failed to add customer:', response.data.message || 'Unknown error');
        }
      } catch (error: any) {
        console.error('Error sending data to backend:', error);
      } finally {
        setIsSubmitting(false);
      }
    };
    return (
      <DashboardLayout>
        <div className="space-y-6">
         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Customer Management</h1>
              <p className="text-muted-foreground mt-2">View and manage all customer submissions</p>
            </div>
            <Button onClick={() => setShowForm(prev => !prev)}>{showForm ? 'Close Form' : 'Add Customer'}</Button>
          </div>
          {showForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Customer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  />
                  <Input
                    placeholder="Email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  />
                  <Input
                    placeholder="Mobile"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    required
                  />
                  <select
                    value={newCustomer.type}
                    onChange={(e) => setNewCustomer({ ...newCustomer, type: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Select Type of Work</option>
                    {Object.entries(servicesData).map(([key, service]) => (
                      <option key={key} value={key}>
                        {(service as ServiceData).title}
                      </option>
                    ))}
                  </select>
    
                  <Input
                    type="file"
                    onChange={(e) =>
                      setNewCustomer({ ...newCustomer, file: e.target.files?.[0] || null })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAddCustomer} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Customer...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
         <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === 'verified' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('verified')}
                  >
                    Verified
                  </Button>
                  <Button
                    variant={statusFilter === 'pending' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('pending')}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('rejected')}
                  >
                    Rejected
                  </Button>
                  <Button
                    variant={statusFilter === 'on_hold' ? 'default' : 'outline'}
                    onClick={() => setStatusFilter('on_hold')}
                  >
                    On Hold
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer List */}
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading customers...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold text-foreground">{customer.name}</h3>
                        <Badge className={getStatusColor(customer.status)}>
                          {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {customer.phone}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Submitted: {new Date(customer.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Link to={`/customers/${customer.id}`}>
                      <Button variant="outline" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}

          {!loading && filteredCustomers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No customers found</p>
              </CardContent>
            </Card>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} ({totalCount} total customers)
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  };

  export default Customers;
