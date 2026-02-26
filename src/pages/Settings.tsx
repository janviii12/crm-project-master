
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect } from 'react';
import { Shield } from 'lucide-react';
import { API_BASE_URL } from '@/config';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Password must be at least 6 characters'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^[A-Z]/, 'Password must start with a capital letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
    .refine((password) => {
      const words = password.split(/\s+/);
      const uniqueWords = new Set(words);
      return uniqueWords.size === words.length;
    }, 'Password must not contain repeated words'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.newPassword !== data.currentPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

const auditPasswordSchema = z.object({
  currentAuditPassword: z.string().min(1, 'Current audit password is required'),
  newAuditPassword: z.string()
    .min(8, 'Audit password must be at least 8 characters')
    .regex(/^[A-Z]/, 'Password must start with a capital letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  confirmAuditPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newAuditPassword === data.confirmAuditPassword, {
  message: "Passwords don't match",
  path: ["confirmAuditPassword"],
}).refine((data) => data.newAuditPassword !== data.currentAuditPassword, {
  message: "New password must be different from current password",
  path: ["newAuditPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type AuditPasswordFormData = z.infer<typeof auditPasswordSchema>;

const Settings = () => {
  const { user, updateUser } = useAuth();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', email: '' },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const auditPasswordForm = useForm<AuditPasswordFormData>({
    resolver: zodResolver(auditPasswordSchema),
  });

  // Reset form when user data loads
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${user?.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        updateUser(result.user);
        toast.success('Profile updated successfully');
      } else {
        toast.error(result.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/users/${user?.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Password changed successfully');
        passwordForm.reset();
      } else {
        toast.error(result.message || 'Failed to change password');
      }
    } catch (error) {
      toast.error('Failed to change password');
    }
  };

  const onAuditPasswordSubmit = async (data: AuditPasswordFormData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/logs/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: data.currentAuditPassword,
          newPassword: data.newAuditPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Audit password changed successfully');
        auditPasswordForm.reset();
      } else {
        toast.error(result.message || 'Failed to change audit password');
      }
    } catch (error) {
      toast.error('Failed to change audit password');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and GIF files are allowed');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${API_BASE_URL}/api/users/${user?.id}/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        updateUser({ avatar: result.avatar });
        toast.success('Avatar updated successfully');
      } else {
        toast.error(result.message || 'Failed to update avatar');
      }
    } catch (error) {
      toast.error('Failed to update avatar');
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                {user?.avatar ? (
                  <AvatarImage src={`${API_BASE_URL}/api/uploads/${user.avatar}`} alt="Avatar" />
                ) : (
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {user ? getInitials(user.name) : ''}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/jpeg,image/png,image/jpg,image/gif"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <label htmlFor="avatar-upload">
                  <Button variant="outline" asChild>
                    <span>Change Avatar</span>
                  </Button>
                </label>
                <p className="text-sm text-muted-foreground mt-2">
                  JPG, PNG or GIF (max 2MB)
                </p>
              </div>
            </div>

            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...profileForm.register('name')} />
                {profileForm.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...profileForm.register('email')} />
                {profileForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {profileForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <Button type="submit">Save Changes</Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...passwordForm.register('currentPassword')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  {...passwordForm.register('newPassword')}
                />
                {passwordForm.formState.errors.newPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters, start with a capital letter, contain uppercase, lowercase, number, and special character. No repeated words allowed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...passwordForm.register('confirmPassword')}
                />
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit">Update Password</Button>
            </form>
          </CardContent>
        </Card>

        {/* Audit Password Settings - Only for Admin */}
        {user?.roles?.includes('admin') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Change Audit Password
              </CardTitle>
              <CardDescription>Update the password required to access audit logs</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={auditPasswordForm.handleSubmit(onAuditPasswordSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentAuditPassword">Current Audit Password</Label>
                  <Input
                    id="currentAuditPassword"
                    type="password"
                    {...auditPasswordForm.register('currentAuditPassword')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newAuditPassword">New Audit Password</Label>
                  <Input
                    id="newAuditPassword"
                    type="password"
                    {...auditPasswordForm.register('newAuditPassword')}
                  />
                  {auditPasswordForm.formState.errors.newAuditPassword && (
                    <p className="text-sm text-destructive">
                      {auditPasswordForm.formState.errors.newAuditPassword.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters, start with a capital letter, contain uppercase, lowercase, number, and special character.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmAuditPassword">Confirm New Audit Password</Label>
                  <Input
                    id="confirmAuditPassword"
                    type="password"
                    {...auditPasswordForm.register('confirmAuditPassword')}
                  />
                </div>

                <Button type="submit">Update Audit Password</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Settings;
