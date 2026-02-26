import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config';

interface CustomerData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  address: string;
  status: 'pending' | 'verified' | 'rejected' | 'on_hold';
  submittedAt: string;
  remarks?: string;
  assignedStaff?: any;
  createdAt: string;
  files: any[];
}

const ApplicationStatus = () => {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchCustomerData = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/customers/by-email/${encodeURIComponent(user.email)}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setCustomerData(result.data);
        // If status is verified, redirect to next steps page
        if (result.data.status === 'verified') {
          navigate('/next-steps');
        }
      } else {
        toast.error('Unable to fetch application status');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [user?.email, navigate]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Loader2 className="w-8 h-8 animate-spin text-blue-500" />,
          title: 'Application Under Review',
          description: 'Your application is being processed. We will update you within 48 hours.',
          badge: <Badge variant="secondary" className="bg-blue-100 text-blue-800">Pending</Badge>,
          color: 'text-blue-600'
        };
      case 'verified':
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          title: 'Application Approved!',
          description: 'Congratulations! Your application has been approved. Our team will contact you within the next 48 hours.',
          badge: <Badge variant="secondary" className="bg-green-100 text-green-800">Approved</Badge>,
          color: 'text-green-600'
        };
      case 'rejected':
        return {
          icon: <XCircle className="w-8 h-8 text-red-500" />,
          title: 'Application Rejected',
          description: 'We regret to inform you that your application has been rejected. Please contact support for more information.',
          badge: <Badge variant="secondary" className="bg-red-100 text-red-800">Rejected</Badge>,
          color: 'text-red-600'
        };
      case 'on_hold':
        return {
          icon: <Clock className="w-8 h-8 text-yellow-500" />,
          title: 'Application On Hold',
          description: 'Your application is currently on hold. Our team will review it again soon.',
          badge: <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">On Hold</Badge>,
          color: 'text-yellow-600'
        };
      default:
        return {
          icon: <AlertCircle className="w-8 h-8 text-gray-500" />,
          title: 'Unknown Status',
          description: 'Unable to determine application status.',
          badge: <Badge variant="secondary">Unknown</Badge>,
          color: 'text-gray-600'
        };
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

  if (!customerData) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Application Status</h1>
            <p className="text-muted-foreground">No application found. Please submit your registration first.</p>
            <Button onClick={() => navigate('/begin-registration')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Registration
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const statusConfig = getStatusConfig(customerData.status);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">Application Status</h1>
          <p className="text-muted-foreground mt-2">
            Track your registration progress
          </p>
        </div>

        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              {statusConfig.icon}
            </div>
            <CardTitle className={`text-2xl ${statusConfig.color}`}>
              {statusConfig.title}
            </CardTitle>
            <CardDescription className="text-lg">
              {statusConfig.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              {statusConfig.badge}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Application ID</p>
                <p className="font-mono text-sm">{customerData._id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted Date</p>
                <p>{new Date(customerData.submittedAt || customerData.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Name</p>
                <p>{customerData.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{customerData.email}</p>
              </div>
            </div>

            {customerData.remarks && (
              <div className="text-left">
                <p className="text-sm font-medium text-muted-foreground">Remarks</p>
                <p className="text-sm bg-muted p-3 rounded-md">{customerData.remarks}</p>
              </div>
            )}

            {customerData.status === 'pending' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-blue-800">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Processing your application...</span>
                </div>
                <p className="text-blue-600 text-sm mt-1">
                  Please wait while we review your documents. This may take up to 48 hours.
                </p>
              </div>
            )}

            {customerData.status === 'verified' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Congratulations!</span>
                </div>
                <p className="text-green-600 text-sm mt-1">
                  Your application has been approved. Our team will contact you within 48 hours to proceed with the next steps.
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <Button onClick={fetchCustomerData}>
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ApplicationStatus;
