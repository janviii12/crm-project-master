import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Shield, User, Users, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserRoleIndicators: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const getRoleConfig = (role: string | undefined) => {
    const roleStr = role || 'user';
    switch (roleStr.toLowerCase()) {
      case 'admin':
        return {
          icon: Crown,
          label: 'Administrator',
          color: 'bg-red-500 hover:bg-red-600',
          glow: 'shadow-red-500/50'
        };
      case 'manager':
        return {
          icon: Shield,
          label: 'Manager',
          color: 'bg-blue-500 hover:bg-blue-600',
          glow: 'shadow-blue-500/50'
        };
      case 'staff':
        return {
          icon: Users,
          label: 'Staff',
          color: 'bg-green-500 hover:bg-green-600',
          glow: 'shadow-green-500/50'
        };
      case 'audit':
        return {
          icon: Settings,
          label: 'Auditor',
          color: 'bg-purple-500 hover:bg-purple-600',
          glow: 'shadow-purple-500/50'
        };
      default:
        return {
          icon: User,
          label: 'User',
          color: 'bg-gray-500 hover:bg-gray-600',
          glow: 'shadow-gray-500/50'
        };
    }
  };

  const roleConfig = getRoleConfig(user.roles?.[0]);

  const IconComponent = roleConfig.icon;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${roleConfig.color} text-white shadow-lg ${roleConfig.glow}`}>
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{user.name}</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Badge
            className={`${roleConfig.color} text-white border-0 px-3 py-1 text-sm font-medium shadow-lg ${roleConfig.glow}`}
          >
            {roleConfig.label}
          </Badge>
        </div>

        {/* Role-specific quick stats or permissions */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {user.roles?.[0] === 'admin' && (
            <>
              <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-xs text-muted-foreground">System Access</div>
                <div className="font-semibold text-red-600 dark:text-red-400">Full</div>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-xs text-muted-foreground">User Management</div>
                <div className="font-semibold text-red-600 dark:text-red-400">Yes</div>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-xs text-muted-foreground">Audit Logs</div>
                <div className="font-semibold text-red-600 dark:text-red-400">Yes</div>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-xs text-muted-foreground">Reports</div>
                <div className="font-semibold text-red-600 dark:text-red-400">Yes</div>
              </div>
            </>
          )}

          {user.roles?.[0] === 'manager' && (
            <>
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-xs text-muted-foreground">Team Size</div>
                <div className="font-semibold text-blue-600 dark:text-blue-400">12</div>
              </div>
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-xs text-muted-foreground">Projects</div>
                <div className="font-semibold text-blue-600 dark:text-blue-400">8</div>
              </div>
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-xs text-muted-foreground">Reports</div>
                <div className="font-semibold text-blue-600 dark:text-blue-400">Yes</div>
              </div>
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-xs text-muted-foreground">Approvals</div>
                <div className="font-semibold text-blue-600 dark:text-blue-400">Yes</div>
              </div>
            </>
          )}

          {user.roles?.[0] === 'staff' && (
            <>
              <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-xs text-muted-foreground">Tasks Today</div>
                <div className="font-semibold text-green-600 dark:text-green-400">5</div>
              </div>
              <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-xs text-muted-foreground">Completed</div>
                <div className="font-semibold text-green-600 dark:text-green-400">3</div>
              </div>
              <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-xs text-muted-foreground">Pending</div>
                <div className="font-semibold text-green-600 dark:text-green-400">2</div>
              </div>
              <div className="text-center p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-xs text-muted-foreground">Efficiency</div>
                <div className="font-semibold text-green-600 dark:text-green-400">85%</div>
              </div>
            </>
          )}

          {user.roles?.[0] === 'audit' && (
            <>
              <div className="text-center p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-xs text-muted-foreground">Audits Today</div>
                <div className="font-semibold text-purple-600 dark:text-purple-400">3</div>
              </div>
              <div className="text-center p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-xs text-muted-foreground">Reports</div>
                <div className="font-semibold text-purple-600 dark:text-purple-400">2</div>
              </div>
              <div className="text-center p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-xs text-muted-foreground">Compliance</div>
                <div className="font-semibold text-purple-600 dark:text-purple-400">98%</div>
              </div>
              <div className="text-center p-2 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="text-xs text-muted-foreground">Issues Found</div>
                <div className="font-semibold text-purple-600 dark:text-purple-400">0</div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserRoleIndicators;
