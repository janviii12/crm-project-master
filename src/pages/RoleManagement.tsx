import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserCog, Shield, User, Edit, Trash2, Plus, Loader2, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface UserRole {
  _id: string;
  name?: string;
  email: string;
  roles: string[];
  createdAt: string;
}

const RoleManagement = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roles: ['client'] as string[],
    password: ''
  });

  const availableRoles = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'executive', label: 'Executive' },
    { value: 'client', label: 'Client' },
    { value: 'developer', label: 'Developer' }
  ];
  const [editFormData, setEditFormData] = useState({
    name: '',
    roles: ['client'] as string[],
    password: ''
  });

  // Delete user state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Fetch users from database
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/users`);
        if (response.data.success) {
          setUsers(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Filtered users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole ? user.roles.includes(selectedRole) : true;
    return matchesSearch && matchesRole;
  });

  // Handle role selection for create form
  const handleRoleChange = (role: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role)
    }));
  };

  // Handle form submission
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    if (formData.roles.length === 0) {
      toast.error('At least one role must be selected');
      return;
    }

    setCreatingUser(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/users`, formData);
      if (response.data.success) {
        toast.success('User created successfully');
        setUsers([...users, response.data.data]);
        setFormData({ name: '', email: '', roles: ['client'], password: '' });
        setIsDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  // Handle role selection for edit form
  const handleEditRoleChange = (role: string, checked: boolean) => {
    setEditFormData(prev => ({
      ...prev,
      roles: checked
        ? [...prev.roles, role]
        : prev.roles.filter(r => r !== role)
    }));
  };

  // Handle edit user
  const handleEditUser = (user: UserRole) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      roles: user.roles,
      password: ''
    });
    setIsEditDialogOpen(true);
  };

  // Handle edit form submission
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (editFormData.roles.length === 0) {
      toast.error('At least one role must be selected');
      return;
    }

    try {
      const updateData: any = {
        name: editFormData.name,
        roles: editFormData.roles
      };

      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/users/${editingUser._id}`, updateData);
      if (response.data.success) {
        toast.success('User updated successfully');
        setUsers(users.map(u => u._id === editingUser._id ? response.data.data : u));
        setIsEditDialogOpen(false);
        setEditingUser(null);
      }
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    setUserToDelete(userId);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete user
  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/users/${userToDelete}`);
      if (response.data.success) {
        toast.success('User deleted successfully');
        setUsers(users.filter(u => u._id !== userToDelete));
        setIsDeleteDialogOpen(false);
        setUserToDelete(null);
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'manager':
        return <UserCog className="w-4 h-4" />;
      case 'executive':
        return <UserCog className="w-4 h-4" />;
      case 'developer':
        return <UserCog className="w-4 h-4" />;
      case 'client':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive/10 text-destructive';
      case 'manager':
        return 'bg-primary/10 text-primary';
      case 'executive':
        return 'bg-blue-500/10 text-blue-500';
      case 'developer':
        return 'bg-purple-500/10 text-purple-500';
      case 'client':
        return 'bg-success/10 text-success';
      default:
        return 'bg-secondary';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Role Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage user roles and permissions
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add New User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter user name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="roles">Roles</Label>
                  <div className="space-y-2 mt-2">
                    {availableRoles.map((role) => (
                      <div key={role.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`create-${role.value}`}
                          checked={formData.roles.includes(role.value)}
                          onCheckedChange={(checked) => handleRoleChange(role.value, checked as boolean)}
                        />
                        <Label htmlFor={`create-${role.value}`} className="text-sm font-normal">
                          {role.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creatingUser}>
                    {creatingUser && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create User
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Role Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Admins</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {users.filter(u => u.roles.includes('admin')).length}
                  </p>
                </div>
                <div className="p-3 bg-destructive/10 text-destructive rounded-xl">
                  <Shield className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Managers</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {users.filter(u => u.roles.includes('manager')).length}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 text-primary rounded-xl">
                  <UserCog className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Executives</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {users.filter(u => u.roles.includes('executive')).length}
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                  <UserCog className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Developers</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {users.filter(u => u.roles.includes('developer')).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                  <UserCog className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Clients</p>
                  <p className="text-3xl font-bold text-foreground mt-2">
                    {users.filter(u => u.roles.includes('client')).length}
                  </p>
                </div>
                <div className="p-3 bg-success/10 text-success rounded-xl">
                  <User className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedRole === null ? "default" : "outline"}
                  onClick={() => setSelectedRole(null)}
                  size="sm"
                >
                  All
                </Button>
                <Button
                  variant={selectedRole === 'admin' ? "default" : "outline"}
                  onClick={() => setSelectedRole('admin')}
                  size="sm"
                >
                  Admin
                </Button>
                <Button
                  variant={selectedRole === 'manager' ? "default" : "outline"}
                  onClick={() => setSelectedRole('manager')}
                  size="sm"
                >
                  Manager
                </Button>
                <Button
                  variant={selectedRole === 'executive' ? "default" : "outline"}
                  onClick={() => setSelectedRole('executive')}
                  size="sm"
                >
                  Executive
                </Button>
                <Button
                  variant={selectedRole === 'developer' ? "default" : "outline"}
                  onClick={() => setSelectedRole('developer')}
                  size="sm"
                >
                  Developer
                </Button>
                <Button
                  variant={selectedRole === 'client' ? "default" : "outline"}
                  onClick={() => setSelectedRole('client')}
                  size="sm"
                >
                  Client
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getRoleColor(user.roles[0] || 'client')}`}>
                      {getRoleIcon(user.roles[0] || 'client')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{user.name || 'N/A'}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role} className={getRoleColor(role)}>
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleEditUser(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDeleteUser(user._id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found matching your search criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="Enter user name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-roles">Roles</Label>
                <div className="space-y-2 mt-2">
                  {availableRoles.map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${role.value}`}
                        checked={editFormData.roles.includes(role.value)}
                        onCheckedChange={(checked) => handleEditRoleChange(role.value, checked as boolean)}
                      />
                      <Label htmlFor={`edit-${role.value}`} className="text-sm font-normal">
                        {role.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="edit-password">New Password (optional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  placeholder="Leave empty to keep current password"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update User
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete this user? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={confirmDeleteUser}>
                  Delete User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Role Permissions */}
        <Card>
          <CardHeader>
            <CardTitle>Role Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-accent">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className="w-5 h-5 text-destructive" />
                  <h4 className="font-semibold text-foreground">Admin</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Full access to all features including user management, customer data, documents, and system settings.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-accent">
                <div className="flex items-center gap-3 mb-2">
                  <UserCog className="w-5 h-5 text-primary" />
                  <h4 className="font-semibold text-foreground">Manager</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Can manage teams, assign tasks, and oversee project progress. Has access to team performance data and can approve requests.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-accent">
                <div className="flex items-center gap-3 mb-2">
                  <UserCog className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold text-foreground">Executive</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Strategic oversight with access to high-level reports, financial data, and decision-making capabilities across the organization.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-accent">
                <div className="flex items-center gap-3 mb-2">
                  <UserCog className="w-5 h-5 text-purple-500" />
                  <h4 className="font-semibold text-foreground">Developer</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Can access development tools, code repositories, and participate in technical discussions. Limited to development-related features.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-accent">
                <div className="flex items-center gap-3 mb-2">
                  <User className="w-5 h-5 text-success" />
                  <h4 className="font-semibold text-foreground">Client</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Can submit forms, upload documents, and view their own submissions. Cannot access other users' data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RoleManagement;
