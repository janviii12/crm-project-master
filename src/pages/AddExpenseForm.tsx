import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AddExpenseForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    paymentType: 'Wallet',
    date: new Date().toISOString().split('T')[0]
  });
  const [billFile, setBillFile] = useState(null);
  const [billPreview, setBillPreview] = useState(null);

  const categories = [
    'Tea', 'Snacks', 'Diesel', 'Stationery', 'Travel', 'Misc'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
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

      setBillFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => setBillPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('amount', formData.amount);
      submitData.append('category', formData.category);
      submitData.append('description', formData.description);
      submitData.append('paymentType', formData.paymentType);
      submitData.append('date', formData.date);

      if (billFile) {
        submitData.append('bill', billFile);
      }

      const response = await fetch(`${API_BASE_URL}/api/petty-cash/expense`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Success",
          description: "Expense added successfully!",
          duration: 3000,
        });
        navigate('/petty-cash-dashboard');
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to add expense",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate('/petty-cash-dashboard')}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add Expense</h1>
          <p className="text-gray-600 mt-2">Record a new petty cash expense</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>
            Fill in the expense information. Bill upload is optional but recommended.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="pl-8 h-11 text-lg"
                  required
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Type */}
            <div className="space-y-2">
              <Label>Payment Type *</Label>
              <RadioGroup
                value={formData.paymentType}
                onValueChange={(value) => handleInputChange('paymentType', value)}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Wallet" id="wallet" />
                  <Label htmlFor="wallet">Wallet (Petty Cash)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Personal" id="personal" />
                  <Label htmlFor="personal">Personal</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the expense..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            {/* Bill Upload */}
            <div className="space-y-2">
              <Label htmlFor="bill">Bill/Receipt (Optional)</Label>
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
                      {billFile ? billFile.name : 'Click to upload bill/receipt'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, GIF, PDF up to 5MB
                    </p>
                  </div>
                </label>
              </div>
              {billFile && (
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  <span>File selected: {billFile.name}</span>
                </div>
              )}
              {billPreview && (
                <div className="mt-4">
                  <img
                    src={billPreview}
                    alt="Bill preview"
                    className="max-w-full h-48 object-contain border rounded"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/petty-cash-dashboard')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Expense'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddExpenseForm;
