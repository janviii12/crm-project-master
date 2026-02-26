import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { servicesData } from '@/data/servicesData.js';

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').regex(/^\d+$/, 'Phone number must contain only digits'),
  serviceType: z.enum(['company_registration', 'ngo_registration', 'trademark_filing'], {
    required_error: 'Please select a service type',
  }),
  address: z.string().min(5, 'Address must be at least 5 characters').max(500),
});

type CustomerFormData = z.infer<typeof customerSchema>;

const CustomerForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

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

  const onSubmit = async (data: CustomerFormData) => {
    if (!selectedFile) {
      toast.error('Please upload an ID document');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('serviceType', data.serviceType);
      formData.append('address', data.address);
      formData.append('file', selectedFile);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/api/customers/create`, {

        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Customer information submitted successfully!');
        reset();
        setSelectedFile(null);
      } else {
        toast.error(result.message || 'Failed to submit form');
      }
    } catch (error: any) {
      toast.error('Network error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Customer Information Form</h1>
          <p className="text-muted-foreground mt-2">
            Please fill in all required information and upload a valid ID document.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personal Details</CardTitle>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Select value={watch('serviceType')} onValueChange={(value) => setValue('serviceType', value as any)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service type" />
                    </SelectTrigger>
                  </Select>
                  {errors.serviceType && (
                    <p className="text-sm text-destructive">{errors.serviceType.message}</p>
                  )}
                </div>
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

              <div className="space-y-2">
                <Label htmlFor="idDocument">Upload your email screenshot *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    id="idDocument"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="idDocument" className="cursor-pointer">
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
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding Customer...
                    </>
                  ) : (
                    'Submit Form'
                  )}
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

export default CustomerForm;
