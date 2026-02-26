import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config';
import { useAuth } from '@/contexts/AuthContext';

interface InteractionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  editData?: {
    _id?: string;
    clientName: string;
    contactNumber: string;
    clientStatus: string;
    interactionType: string;
    notes: string;
    date: string;
    clientMessage?: string;
    replyMessage?: string;
    images?: string[];
  };
  quickAdd?: boolean;
}

const InteractionForm = ({ onSuccess, onCancel, editData, quickAdd }: InteractionFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    clientName: editData?.clientName || '',
    contactNumber: editData?.contactNumber || '',
    clientStatus: editData?.clientStatus || 'potential',
    interactionType: editData?.interactionType || '',
    notes: editData?.notes || '',
    clientMessage: editData?.clientMessage || '',
    replyMessage: editData?.replyMessage || '',
    date: editData?.date ? new Date(editData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: editData?.date ? new Date(editData.date).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5)
  });

  // Set time to current time (real-time) always when no editData
  useEffect(() => {
    if (!editData) {
      setFormData(prev => ({
        ...prev,
        time: new Date().toTimeString().slice(0, 5)
      }));
    }
  }, [editData]);

  // Update formData when editData changes
  useEffect(() => {
    if (editData) {
      const interactionDate = new Date(editData.date);
      setFormData({
        clientName: editData.clientName || '',
        contactNumber: editData.contactNumber || '',
        clientStatus: editData.clientStatus || 'potential',
        interactionType: editData.interactionType || '',
        notes: editData.notes || '',
        clientMessage: editData.clientMessage || '',
        replyMessage: editData.replyMessage || '',
        date: editData.date ? interactionDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        time: editData.date ? interactionDate.toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5)
      });
      // Clear image previews when switching between interactions
      setImagePreviews([]);
      setSelectedImages([]);
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation - depends on whether it's quickAdd or editing an existing interaction
    if (!quickAdd && !editData?._id) {
      // Full form validation - all fields required for new interaction
      if (!formData.clientName || !formData.contactNumber || !formData.clientStatus || !formData.interactionType) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      // Phone number validation (basic)
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(formData.contactNumber.replace(/[\s\-\(\)]/g, ''))) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid contact number',
          variant: 'destructive'
        });
        return;
      }
    } else {
      // Simplified form validation - only interaction type is required
      if (!formData.interactionType) {
        toast({
          title: 'Validation Error',
          description: 'Please select an interaction type',
          variant: 'destructive'
        });
        return;
      }
    }

    // Combine date and time into a single datetime string
    const dateTime = `${formData.date}T${formData.time}:00`;

    try {
      setLoading(true);
      const url = editData && editData._id
        ? `${API_BASE_URL}/api/admin/interactions/${editData._id}`
        : `${API_BASE_URL}/api/staff/interactions`;
      const method = editData && editData._id ? 'PUT' : 'POST';

      let response;
      if (editData && editData._id) {
        // For updates, use JSON
        response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ ...formData, date: dateTime })
        });
      } else {
        // For new interactions, use FormData to handle images
        const formDataToSend = new FormData();
        
        // Get values from hidden fields if present
        const clientNameEl = document.querySelector('input[name="clientName"]') as HTMLInputElement;
        const contactNumberEl = document.querySelector('input[name="contactNumber"]') as HTMLInputElement;
        const clientStatusEl = document.querySelector('input[name="clientStatus"]') as HTMLInputElement;
        const notesEl = document.querySelector('input[name="notes"]') as HTMLInputElement;
        
        // Use hidden field values if formData values are empty
        formDataToSend.append('clientName', clientNameEl?.value || formData.clientName || 'Unknown');
        formDataToSend.append('contactNumber', contactNumberEl?.value || formData.contactNumber || 'Unknown');
        formDataToSend.append('clientStatus', clientStatusEl?.value || formData.clientStatus || 'potential');
        formDataToSend.append('interactionType', formData.interactionType);
        formDataToSend.append('notes', notesEl?.value || formData.notes || '');
        formDataToSend.append('clientMessage', formData.clientMessage || '');
        formDataToSend.append('replyMessage', formData.replyMessage || '');
        formDataToSend.append('date', dateTime);

        // Add images
        selectedImages.forEach((image) => {
          formDataToSend.append('images', image);
        });

        response = await fetch(url, {
          method,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formDataToSend
        });
      }

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: editData ? 'Interaction updated successfully' : 'Interaction recorded successfully'
        });
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: result.message || `Failed to ${editData ? 'update' : 'create'} interaction`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editData ? 'update' : 'create'} interaction`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 10) {
      toast({
        title: 'Too many images',
        description: 'Maximum 10 images allowed',
        variant: 'destructive'
      });
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not an image file`,
          variant: 'destructive'
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 5MB limit`,
          variant: 'destructive'
        });
        return false;
      }
      return true;
    });

    setSelectedImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Determine which mode we're in
  const isNewInteraction = !quickAdd && !editData?._id;
  const isQuickAdd = quickAdd;
  const isEditing = editData && editData._id;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Hidden fields for backend required data */}
      <input type="hidden" name="clientName" value={formData.clientName} />
      <input type="hidden" name="contactNumber" value={formData.contactNumber} />
      <input type="hidden" name="clientStatus" value={formData.clientStatus} />
      <input type="hidden" name="notes" value={formData.notes} />
      
      {/* Full form fields - shown when creating a NEW interaction (not quickAdd, not editing) */}
      {isNewInteraction && (
        <>
          {/* Row 1: Client Name and Contact Number side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                value={formData.clientName}
                onChange={(e) => handleInputChange('clientName', e.target.value)}
                placeholder="Enter client name"
                required
              />
            </div>

            <div>
              <Label htmlFor="contactNumber">Contact Number *</Label>
              <Input
                id="contactNumber"
                type="tel"
                value={formData.contactNumber}
                onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                placeholder="Enter contact number"
                required
              />
            </div>
          </div>

          {/* Row 2: Client Status and Interaction Type side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientStatus">Client Status *</Label>
              <Select value={formData.clientStatus} onValueChange={(value) => handleInputChange('clientStatus', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="existing">Existing Client</SelectItem>
                  <SelectItem value="potential">Yet to be Client</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="interactionType">Interaction Type *</Label>
              <Select value={formData.interactionType} onValueChange={(value) => handleInputChange('interactionType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Date and Time side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Notes field */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Enter interaction details and notes..."
              rows={4}
            />
          </div>
        </>
      )}

      {/* QuickAdd mode - simplified form for adding new interaction in conversation */}
      {isQuickAdd && (
        <>
          {/* Row 1: Interaction Type and Date side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="interactionType">Interaction Type *</Label>
              <Select value={formData.interactionType} onValueChange={(value) => handleInputChange('interactionType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Client Conversation and Reply Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientMessage">Client Conversation</Label>
              <Textarea
                id="clientMessage"
                value={formData.clientMessage}
                onChange={(e) => handleInputChange('clientMessage', e.target.value)}
                placeholder="What the client said..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="replyMessage">Reply</Label>
              <Textarea
                id="replyMessage"
                value={formData.replyMessage}
                onChange={(e) => handleInputChange('replyMessage', e.target.value)}
                placeholder="Response given to the client..."
                rows={3}
              />
            </div>
          </div>
        </>
      )}

      {/* Edit mode - for editing an existing interaction */}
      {isEditing && (
        <>
          {/* Row 1: Client Status and Interaction Type side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientStatus">Client Status</Label>
              <Select value={formData.clientStatus} onValueChange={(value) => handleInputChange('clientStatus', value)}>
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

            <div>
              <Label htmlFor="interactionType">Interaction Type *</Label>
              <Select value={formData.interactionType} onValueChange={(value) => handleInputChange('interactionType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interaction type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Date and Time side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="time">Time *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Client Conversation and Reply Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clientMessage">Client Conversation</Label>
              <Textarea
                id="clientMessage"
                value={formData.clientMessage}
                onChange={(e) => handleInputChange('clientMessage', e.target.value)}
                placeholder="What the client said..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="replyMessage">Reply</Label>
              <Textarea
                id="replyMessage"
                value={formData.replyMessage}
                onChange={(e) => handleInputChange('replyMessage', e.target.value)}
                placeholder="Response given to the client..."
                rows={3}
              />
            </div>
          </div>
        </>
      )}

      <div>
        <Label htmlFor="images">Images (Optional)</Label>
        <Input
          id="images"
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
          className="mt-1"
        />
        <p className="text-sm text-gray-500 mt-1">
          Upload up to 10 images (max 5MB each)
        </p>

        {imagePreviews.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (editData ? 'Updating...' : 'Creating...') : (editData ? 'Update Interaction' : 'Create Interaction')}
        </Button>
      </div>
    </form>
  );
};

export default InteractionForm;
