import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Upload, DollarSign, CreditCard, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config';

const formSchema = z.object({
  managerId: z.string().min(1, 'Please select a manager'),
  amount: z.string().min(1, 'Amount is required').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'cheque', 'other'], {
    required_error: 'Please select a payment method',
  }),
  description: z.string().min(1, 'Description is required'),
});

type FormData = z.infer<typeof formSchema>;

interface Manager {
  _id: string;
  name: string;
  email: string;
}

interface AddFundsFormProps {
  managers: Manager[];
  onSuccess?: () => void;
}

const AddFundsForm: React.FC<AddFundsFormProps> = ({ managers, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      managerId: '',
      amount: '',
      paymentMethod: 'cash',
      description: '',
    },
  });

  const paymentMethodIcons = {
    cash: DollarSign,
    bank_transfer: CreditCard,
    cheque: FileText,
    other: Upload,
  };

  const paymentMethodLabels = {
    cash: 'Cash',
    bank_transfer: 'Bank Transfer',
    cheque: 'Cheque',
    other: 'Other',
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload a valid image or PDF file.',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload a file smaller than 5MB.',
          variant: 'destructive',
        });
        return;
      }

      setSelectedFile(file);
      // Clear any previous errors for this field
      form.clearErrors('amount'); // Using amount as proxy since file is optional
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('amount', data.amount);
      formData.append('description', data.description);
      formData.append('paymentMethod', data.paymentMethod);

      if (selectedFile) {
        formData.append('bill', selectedFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/petty-cash/wallet/${data.managerId}/add-amount`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Funds added successfully!',
          description: `₹${data.amount} has been added to the manager's wallet.`,
          duration: 3000,
        });

        // Reset form
        form.reset();
        setSelectedFile(null);

        // Call success callback
        onSuccess?.();
      } else {
        toast({
          title: 'Failed to add funds',
          description: result.message || 'An error occurred while adding funds.',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Error adding funds:', error);
      toast({
        title: 'Network error',
        description: 'Please check your connection and try again.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
        <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
          <DollarSign className="w-5 h-5" />
          Add Funds to Manager Wallet
        </CardTitle>
        <CardDescription>
          Add petty cash funds to a manager's wallet with proper documentation
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Manager Selection */}
            <FormField
              control={form.control}
              name="managerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Select Manager</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choose a manager to add funds to" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {managers.map((manager) => (
                        <SelectItem key={manager._id} value={manager._id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{manager.name}</span>
                            <span className="text-xs text-muted-foreground">{manager.email}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Amount (₹)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        {...field}
                        type="number"
                        placeholder="Enter amount"
                        className="pl-10 h-11 text-lg"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Method */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(paymentMethodLabels).map(([value, label]) => {
                        const Icon = paymentMethodIcons[value as keyof typeof paymentMethodIcons];
                        return (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              <span>{label}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter description (e.g., Monthly allowance, Project funds, etc.)"
                      className="min-h-[80px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Receipt/Bill (Optional)</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:border-muted-foreground/50 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="bill-upload"
                />
                <label
                  htmlFor="bill-upload"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {selectedFile ? selectedFile.name : 'Click to upload receipt/bill'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF, PDF up to 5MB
                    </p>
                  </div>
                </label>
              </div>
              {selectedFile && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>File selected: {selectedFile.name}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Funds...
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5 mr-2" />
                  Add Funds to Wallet
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddFundsForm;
