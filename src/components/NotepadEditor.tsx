import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config';

interface Note {
  _id?: string;
  title: string;
  content: string;
  createdBy?: {
    _id: string;
    name: string;
    email: string;
  };
  sharedWith?: Array<{
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    role?: string;
    permission: 'read' | 'write';
  }>;
  updatedAt?: string;
  createdAt?: string;
}

interface NotepadEditorProps {
  note: Note | null;
  onSave: () => void;
  onCancel: () => void;
}

const NotepadEditor = ({ note, onSave, onCancel }: NotepadEditorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        content: note.content || ''
      });
    } else {
      setFormData({
        title: '',
        content: ''
      });
    }
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and content are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const url = note?._id
        ? `${API_BASE_URL}/api/notes/${note._id}`
        : `${API_BASE_URL}/api/notes`;

      const method = note?._id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: `Note ${note ? 'updated' : 'created'} successfully`
        });
        onSave();
      } else {
        toast({
          title: 'Error',
          description: result.message || `Failed to ${note ? 'update' : 'create'} note`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${note ? 'update' : 'create'} note`,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="title" className="dark:text-white">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="Enter note title"
          required
          className="dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
        />
      </div>

      <div>
        <Label htmlFor="content" className="dark:text-white">Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => handleInputChange('content', e.target.value)}
          placeholder="Enter note content..."
          rows={15}
          required
          className="resize-none dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-400"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="dark:text-white">
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (note ? 'Updating...' : 'Creating...') : (note ? 'Update Note' : 'Create Note')}
        </Button>
      </div>
    </form>
  );
};

export default NotepadEditor;
