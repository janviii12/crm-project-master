import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Mail, Phone, MapPin, FileText, Download, Check, X, Loader2, Pause } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '../config';

const CustomerDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showHoldForm, setShowHoldForm] = useState(false);
  const [holdRemarks, setHoldRemarks] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const handleSendEmail = async (status: string, remarks?: string) => {
    setSendingEmail(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/customers/${id}/send-email`, {
        status,
        remarks
      });
      if (response.data.success) {
        alert(`Email sent successfully to ${customer.email}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Fetch customer details
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/customers/${id}`);
        if (response.data.success) {
          setCustomer(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCustomer();
    }
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-success/10 text-success';
      case 'pending':
        return 'bg-warning/10 text-warning';
      case 'rejected':
        return 'bg-destructive/10 text-destructive';
      case 'on_hold':
        return 'bg-orange-500/10 text-orange-600';
      default:
        return 'bg-secondary';
    }
  };

  const handleApprove = async () => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/customers/${id}/status`, {
        status: 'verified'
      });
      if (response.data.success) {
        setCustomer({ ...customer, status: 'verified' });
        // Send email notification
        await handleSendEmail('verified');
      }
    } catch (error) {
      console.error('Error approving customer:', error);
    }
  };

  const handleReject = async () => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/customers/${id}/status`, {
        status: 'rejected'
      });
      if (response.data.success) {
        setCustomer({ ...customer, status: 'rejected' });
        // Send email notification
        await handleSendEmail('rejected');
      }
    } catch (error) {
      console.error('Error rejecting customer:', error);
    }
  };

  const handleHold = () => {
    setShowHoldForm(true);
  };

  const handleHoldSubmit = async () => {
    if (!holdRemarks.trim()) return;

    try {
      const response = await axios.put(`${API_BASE_URL}/api/customers/${id}/status`, {
        status: 'on_hold',
        remarks: holdRemarks
      });
      if (response.data.success) {
        setCustomer({ ...customer, status: 'on_hold', remarks: holdRemarks });
        setShowHoldForm(false);
        setHoldRemarks('');
        // Send email notification
        await handleSendEmail('on_hold', holdRemarks);
      }
    } catch (error) {
      console.error('Error putting customer on hold:', error);
    }
  };





  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Customer not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/customers">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-foreground">{customer.name}</h1>
            <p className="text-muted-foreground mt-1">
              Customer ID: {customer._id}
            </p>
          </div>
          <Badge className={getStatusColor(customer.status)}>
            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <div className="flex items-center gap-2 text-foreground">
                      <Mail className="w-4 h-4" />
                      {customer.email}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Phone</p>
                    <div className="flex items-center gap-2 text-foreground">
                      <Phone className="w-4 h-4" />
                      {customer.phone}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Address</p>
                  <div className="flex items-center gap-2 text-foreground">
                    <MapPin className="w-4 h-4" />
                    {customer.address}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                  <p className="text-foreground">
                    {new Date(customer.createdAt).toLocaleString()}
                  </p>
                </div>
                {customer.type && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Type</p>
                    <p className="text-foreground">{customer.type}</p>
                  </div>
                )}
                {customer.remarks && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Remarks</p>
                    <p className="text-foreground">{customer.remarks}</p>
                  </div>
                )}
                {customer.description && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-foreground">{customer.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Display files from the new files array */}
                  {customer.files && customer.files.length > 0 && customer.files.map((file, index) => (
                    <div key={`new-${index}`} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{file.fileOriginalName || 'Document'}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded • {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(`${API_BASE_URL}/api/uploads/${file.filePath.replace(/^(uploads\/)+/, '')}`, '_blank')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Display legacy single file if it exists */}
                  {customer.filePath && (
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium text-foreground">{customer.fileOriginalName || 'Document'}</p>
                          <p className="text-sm text-muted-foreground">
                            Uploaded • {new Date(customer.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(`${API_BASE_URL}/api/uploads/${customer.filePath.replace(/uploads\//g, '')}`, '_blank')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Show message if no documents */}
                  {(!customer.files || customer.files.length === 0) && !customer.filePath && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No documents uploaded yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {showHoldForm ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reason for On Hold</label>
                      <Textarea
                        value={holdRemarks}
                        onChange={(e) => setHoldRemarks(e.target.value)}
                        placeholder="Enter the reason why this application is being put on hold..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1 gap-2"
                        onClick={handleHoldSubmit}
                        disabled={!holdRemarks.trim()}
                      >
                        <Pause className="w-4 h-4" />
                        Put On Hold
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowHoldForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      className="w-full gap-2"
                      variant="default"
                      onClick={handleApprove}
                      disabled={customer.status !== 'pending'}
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </Button>
                    <Button
                      className="w-full gap-2"
                      variant="outline"
                      onClick={handleHold}
                      disabled={customer.status !== 'pending'}
                    >
                      <Pause className="w-4 h-4" />
                      On Hold
                    </Button>
                    <Button
                      className="w-full gap-2"
                      variant="destructive"
                      onClick={handleReject}
                      disabled={customer.status !== 'pending'}
                    >
                      <X className="w-4 h-4" />
                      Reject
                    </Button>
                    <Button
                      className="w-full gap-2"
                      variant="outline"
                      onClick={() => handleSendEmail(customer.status)}
                      disabled={sendingEmail}
                    >
                      <Mail className="w-4 h-4" />
                      {sendingEmail ? 'Sending...' : 'Send Email'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Log</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Form submitted</p>
                      <p className="text-xs text-muted-foreground">Jan 15, 2024 10:30 AM</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-muted flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Documents uploaded</p>
                      <p className="text-xs text-muted-foreground">Jan 15, 2024 10:35 AM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDetails;
