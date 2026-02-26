import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config';

interface Note {
  _id: string;
  title: string;
  content: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  sharedWith: Array<{
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    role?: string;
    permission: 'read' | 'write';
  }>;
  updatedAt: string;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  roles: string[];
}

interface ShareNoteModalProps {
  note: Note;
  onSuccess: () => void;
  onCancel: () => void;
}

const ShareNoteModal = ({ note, onSuccess, onCancel }: ShareNoteModalProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [permission, setPermission] = useState<'read' | 'write'>('read');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Filter out the note creator
        const filteredUsers = result.data.filter((user: User) => user._id !== note.createdBy._id);
        setUsers(filteredUsers);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch users',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please select at least one user to share with',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/notes/share/${note._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          permission
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: 'Success',
          description: `Note shared with ${selectedUsers.length} user(s)`
        });
        onSuccess();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to share note',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to share note',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label className="text-sm font-medium">Sharing "{note.title}"</Label>
        <p className="text-sm text-gray-600 mt-1">
          Select users and permission level to share this note
        </p>
      </div>

      <div>
        <Label htmlFor="permission">Permission Level</Label>
        <Select value={permission} onValueChange={(value: 'read' | 'write') => setPermission(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="read">Read Only - Users can view the note</SelectItem>
            <SelectItem value="write">Read & Write - Users can edit the note</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-sm font-medium">Select Users</Label>
        <div className="mt-2 max-h-60 overflow-y-auto border rounded-md p-3">
          {users.length === 0 ? (
            <p className="text-sm text-gray-500">No users available to share with</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => {
                const isAlreadyShared = note.sharedWith.some(shared => shared.userId._id === user._id);
                return (
                  <div key={user._id} className="flex items-center space-x-3">
                    <Checkbox
                      id={user._id}
                      checked={selectedUsers.includes(user._id)}
                      onCheckedChange={(checked) => handleUserToggle(user._id, checked as boolean)}
                      disabled={isAlreadyShared}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={user._id}
                        className={`text-sm font-medium ${isAlreadyShared ? 'text-gray-500' : 'cursor-pointer'}`}
                      >
                        {user.name}
                      </Label>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {isAlreadyShared && (
                        <p className="text-xs text-green-600">Already shared</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user.roles.join(', ')}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || selectedUsers.length === 0}>
          {loading ? 'Sharing...' : `Share with ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}`}
        </Button>
      </div>
    </form>
  );
};

export default ShareNoteModal;
