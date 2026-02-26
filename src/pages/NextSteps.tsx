import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Phone, Mail, Calendar, FileText, CreditCard, UserCheck } from 'lucide-react';
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

const NextSteps = () => {
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
        // Only show this page if status is verified
        if (result.data.status === 'verified') {
          setCustomerData(result.data);
        } else {
          // Redirect back to status page if not verified
          navigate('/application-status');
        }
      } else {
        toast.error('Unable to fetch application data');
        navigate('/application-status');
      }
    } catch (error) {
      toast.error('Network error occurred');
      navigate('/application-status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [user?.email, navigate]);

  const nextSteps = [
    {
      step: 1,
      title: 'Contact Assignment',
      description: 'Our team will assign a dedicated account manager to your case within 24 hours.',
      icon: <UserCheck className="w-6 h-6" />,
      status: 'pending',
      details: 'You will receive an email with your account manager\'s contact information.'
    },
    {
      step: 2,
      title: 'Initial Consultation',
      description: 'Schedule your first consultation call to discuss your specific requirements.',
      icon: <Phone className="w-6 h-6" />,
      status: 'pending',
      details: 'This call typically lasts 30-45 minutes and helps us understand your needs better.'
    },
    {
      step: 3,
      title: 'Document Verification',
      description: 'Complete any additional document verification as requested by your account manager.',
      icon: <FileText className="w-6 h-6" />,
      status: 'pending',
      details: 'We may require additional documentation based on your specific service requirements.'
    },
    {
      step: 4,
      title: 'Service Agreement',
      description: 'Review and sign the service agreement outlining terms and conditions.',
      icon: <FileText className="w-6 h-6" />,
      status: 'pending',
      details: 'This agreement will detail all services, pricing, and timelines.'
    },
    {
      step: 5,
      title: 'Payment Setup',
      description: 'Set up payment method and process initial payment if applicable.',
      icon: <CreditCard className="w-6 h-6" />,
      status: 'pending',
      details: 'We accept various payment methods including bank transfer, credit card, and digital wallets.'
    },
    {
      step: 6,
      title: 'Service Activation',
      description: 'Your services will be activated and you\'ll receive access credentials.',
      icon: <CheckCircle className="w-6 h-6" />,
      status: 'pending',
      details: 'You will receive login credentials and access to your personalized dashboard.'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customerData) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Congratulations!</h1>
          <p className="text-xl text-muted-foreground mt-2">
            Your application has been approved. Here are your next steps.
          </p>
          <Badge variant="secondary" className="bg-green-100 text-green-800 mt-4">
            Application Approved
          </Badge>
        </div>
      
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
      
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              Welcome to Our Service Family!
            </CardTitle>
            <CardDescription className="text-green-700">
              Your application has been successfully verified. Our team is excited to work with you!
            </CardDescription>
          </CardHeader>
      
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-green-800">Application ID</p>
                <p className="font-mono text-green-700">{customerData._id}</p>
              </div>
              <div>
                <p className="font-medium text-green-800">Approval Date</p>
                <p className="text-green-700">{new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="font-medium text-green-800">Contact Email</p>
                <p className="text-green-700">{customerData.email}</p>
              </div>
              <div>
                <p className="font-medium text-green-800">Contact Phone</p>
                <p className="text-green-700">{customerData.phone}</p>
              </div>
            </div>
          </CardContent>
      
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              Your Next Steps
            </CardTitle>
            <CardDescription>
              Follow these steps to complete your onboarding process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {nextSteps.map((step, index) => (
              <div key={step.step} className="flex gap-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary">{step.step}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-primary">{step.icon}</div>
                    <h3 className="font-semibold">{step.title}</h3>
                    <Badge variant="outline" className="text-xs">
                      {step.status === 'pending' ? 'Upcoming' : 'Completed'}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mb-2">{step.description}</p>
                  <p className="text-sm text-muted-foreground">{step.details}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Mail className="w-5 h-5" />
              Stay Updated
            </CardTitle>
            <CardDescription className="text-blue-700">
              We'll keep you informed throughout the process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Email Updates</p>
                  <p className="text-sm text-blue-600">Regular progress updates</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Phone className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Phone Support</p>
                  <p className="text-sm text-blue-600">Direct contact when needed</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Scheduled Calls</p>
                  <p className="text-sm text-blue-600">Important meetings & consultations</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-blue-700">
                Expect to hear from us within the next 24 hours with your account manager assignment.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => navigate('/application-status')}>
            Back to Status
          </Button>
          <Button onClick={fetchCustomerData}>
            Refresh Page
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NextSteps;
