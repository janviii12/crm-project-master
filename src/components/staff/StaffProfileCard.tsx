import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Circle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StaffProfileCardProps {
  name?: string;
  role?: string;
  status?: string;
  avatarUrl?: string;
  isLoading?: boolean;
}

const getStatusConfig = (status: string) => {
  switch (status) {
  case 'online':
      return { color: 'bg-pastel-green hover:bg-pastel-green/90 shadow-lg', icon: '●', label: 'Online', className: 'border-pastel-green/50 bg-pastel-green/10 text-pastel-green font-semibold' };
    case 'lunch':
      return { color: 'bg-pastel-yellow hover:bg-pastel-yellow/90 shadow-lg', icon: '🍱', label: 'Lunch', className: 'border-pastel-yellow/50 bg-pastel-yellow/10 text-pastel-yellow font-semibold' };
    case 'meeting':
      return { color: 'bg-pastel-blue hover:bg-pastel-blue/90 shadow-lg', icon: '📅', label: 'Meeting', className: 'border-pastel-blue/50 bg-pastel-blue/10 text-pastel-blue font-semibold' };
    case 'outside_work':
      return { color: 'bg-pastel-orange hover:bg-pastel-orange/90 shadow-lg', icon: '💼', label: 'Outside Work', className: 'border-pastel-orange/50 bg-pastel-orange/10 text-pastel-orange font-semibold' };
    case 'offline':
    default:
      return { color: 'bg-pastel-gray hover:bg-pastel-gray/90 shadow-lg', icon: '●', label: 'Offline', className: 'border-pastel-gray/50 bg-pastel-gray/10 text-pastel-gray font-semibold' };
  }
};

const StaffProfileCard: React.FC<StaffProfileCardProps> = ({
  name = 'John Doe',
  role = 'Executive',
  status = 'offline',
  avatarUrl,
  isLoading = false
}) => {
  const { user } = useAuth();
  const config = getStatusConfig(status);

  if (isLoading) {
    return (
      <Card className="w-full max-w-sm border-dashed animate-pulse">
        <CardHeader className="space-y-2">
          <div className="w-16 h-16 bg-muted rounded-full mx-auto" />
          <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
          <div className="h-3 bg-muted rounded w-1/2 mx-auto" />
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm border hover:shadow-md transition-shadow">
      <CardHeader className="text-center pb-2">
        <Avatar className="w-20 h-20 mx-auto border-4 border-background shadow-lg">
          <AvatarImage src={avatarUrl} />
          <AvatarFallback>
            <User className="w-8 h-8" />
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-lg">{name}</CardTitle>
        <Badge variant="secondary" className="text-xs">{role}</Badge>
      </CardHeader>
      <CardContent className="flex items-center justify-center space-x-2 pt-0 pb-4">
        <div className={`p-2 rounded-full ${config.color} shadow-lg`}>
          <span className="text-xl font-bold">{config.icon}</span>
        </div>
        <div>
          <p className={`font-medium text-sm ${config.className}`}>{config.label}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffProfileCard;
