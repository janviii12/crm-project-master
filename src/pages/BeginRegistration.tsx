import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { servicesData } from '@/data/servicesData';
import axiosInstance from '../lib/axiosInstance';

const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^\d+$/, 'Phone number must contain only digits'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

interface CustomerData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  serviceType: string;
  address: string;
  status: string;
  submittedAt: string;
  remarks?: string;
  assignedStaff?: any;
  createdAt: string;
  files: any[];
}

const BeginRegistration = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      address: '',
    },
  });

  // Fetch customer data to get serviceType
  const fetchCustomerData = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      // Authenticated request; resolve on any status so "not found" is handled below
      const response = await axiosInstance.get(`/api/customers/by-email/${encodeURIComponent(user.email)}`, { validateStatus: () => true });
      const result = response.data;

      if (response.status === 200 && result.success) {
        setCustomerData(result.data);
      } else {
        // Customer not found, that's okay - they might not have registered yet
        console.log('Customer data not found');
      }
    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set form values when user data is available
  useEffect(() => {
    if (user) {
      setValue('name', user.name || '');
      setValue('email', user.email || '');
    }
  }, [user, setValue]);

  // Fetch customer data on component mount
  useEffect(() => {
    fetchCustomerData();
  }, [user?.email]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed');
        return;
      }
      setSelectedFile(file);
      toast.success('File selected successfully');
    }
  };

  const onSubmit = async (data: RegistrationFormData) => {
    if (!selectedFile) {
      toast.error('Please upload the required document');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('type', 'General Registration'); // Default type
      formData.append('address', data.address);
      formData.append('serviceType', customerData?.serviceType || 'company_registration'); // Use customer's serviceType or default
      formData.append('file', selectedFile);
      const response = await axiosInstance.post('/api/customers/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      //const result = await response.json();
      if (response.data.success) {
        console.log('Success data' + response.data);
        toast.success('Registration submitted successfully!');
        reset();
        setSelectedFile(null);
        // Redirect to application status page
        navigate('/application-status');
      } else {
        console.log('Success data' + response.data.message);
        toast.error(response.data.message || 'Failed to submit registration');
      }
    } catch (error: any) {
      toast.error('Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get service data based on customer's serviceType
  const serviceType = customerData?.serviceType || 'company_registration';
  const serviceData = servicesData[serviceType as keyof typeof servicesData];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Begin Registration</h1>
          <p className="text-muted-foreground mt-2">
            Follow the steps below to complete your registration for {serviceData?.title || 'your service'}.
          </p>
        </div>

        {/* Documents Required Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              Documents Required
            </CardTitle>
            <CardDescription>
              Please prepare the following documents for {serviceData?.title || 'your service'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {serviceData ? (
              <ul className="space-y-2">
                {serviceData.documents.map((doc, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{doc}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>Your service setup is pending. Please contact support.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step-by-Step Process Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Step-by-Step Process
            </CardTitle>
            <CardDescription>
              Follow these steps to complete your {serviceData?.title || 'service'} registration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {serviceData ? (
              <ol className="space-y-3">
                {serviceData.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>Your service setup is pending. Please contact support.</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registration Details</CardTitle>
            <CardDescription>
              All fields marked with * are required
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    placeholder="Enter your phone number"
                    {...register('phone')}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    placeholder="Enter your address"
                    {...register('address')}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="document">Upload Required Document *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    id="document"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="document" className="cursor-pointer">
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2 text-success">
                        <FileText className="w-6 h-6" />
                        <span className="font-medium">{selectedFile.name}</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG or PDF (max 5MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Submitting...' : 'Submit Registration'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    reset();
                    setSelectedFile(null);
                  }}
                >
                  Clear Form
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BeginRegistration;
