import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity, Zap, TrendingUp } from 'lucide-react';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';

interface SummaryData {
  loginTime?: string;
  logoutTime?: string;
  totalWorkingHours: number;
  totalIdleTime?: number;
  breakHours: number;
  productiveHours: number;
  todayActivities: number;
}

const SummaryCard = ({ 
  loginTime, 
  logoutTime, 
  totalWorkingHours = 0, 
  totalIdleTime = 0,
  breakHours = 0, 
  productiveHours = 0, 
  todayActivities = 0 
}: SummaryData) => {
  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
      {/* Login/Logout Session */}
      <Card className="border-pastel-blue/30 shadow-xl xl:col-span-2">
        <CardHeader className="bg-gradient-to-r from-pastel-blue/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pastel-blue/30 rounded-2xl flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-pastel-blue" />
            </div>
            <div>
              <CardTitle className="text-xl text-pastel-blue">Session Times</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-pastel-blue">
                {loginTime ? format(new Date(loginTime), 'HH:mm') : '--:--'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Login</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-pastel-orange">
                {loginTime && !logoutTime ? (totalWorkingHours > 0 ? 'Session Completed' : 'Logged Out') : logoutTime ? format(new Date(logoutTime), 'HH:mm') : 'Ongoing'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Logout</p>
              {(!logoutTime && totalWorkingHours > 0) && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  ✓ Duration persisted
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card className="border-pastel-green/30 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-pastel-green/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pastel-green/30 rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-pastel-green" />
            </div>
            <CardTitle className="text-xl text-pastel-green">Productive Hours</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-4xl font-bold text-pastel-green">{formatDuration(productiveHours)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {breakHours > 0 && `Breaks: ${formatDuration(breakHours)}`}
          </p>
          <div className="w-full bg-pastel-gray/20 rounded-full h-3 mt-4">
            <div 
              className="bg-gradient-to-r from-pastel-green to-pastel-blue h-3 rounded-full shadow-lg transition-all" 
              style={{ width: `${Math.min((productiveHours / 8) * 100, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>



      {/* Total Working & Activity Count */}
      <Card className="border-pastel-pink/30 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-pastel-pink/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-pastel-pink/30 rounded-2xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-pastel-pink" />
            </div>
            <CardTitle className="text-xl text-pastel-pink">Today's Stats</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0 grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-pastel-orange">{formatDuration(totalWorkingHours)}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Working</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-pastel-yellow">{todayActivities}</p>
            <p className="text-xs text-muted-foreground mt-1">Activities</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryCard;

