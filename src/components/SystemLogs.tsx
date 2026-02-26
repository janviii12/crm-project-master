import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, ChevronDown, ChevronRight, Download as DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '../lib/axiosInstance';
import { Badge } from '@/components/ui/badge';

interface SystemLog {
  timestamp: string;
  level: string;
  message: string;
}

const SystemLogs = ({ refreshTrigger }: { refreshTrigger: number }) => {
  const [infoLogs, setInfoLogs] = useState<SystemLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<SystemLog[]>([]);
  const [filteredInfoLogs, setFilteredInfoLogs] = useState<SystemLog[]>([]);
  const [filteredErrorLogs, setFilteredErrorLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [infoCollapsed, setInfoCollapsed] = useState(false);
  const [errorCollapsed, setErrorCollapsed] = useState(false);

  const fetchSystemLogs = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/admin/logs');

      if (response.data) {
        setInfoLogs(response.data.infoLogs || []);
        setErrorLogs(response.data.errorLogs || []);
      } else {
        toast.error('Failed to fetch system logs');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch system logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getLogColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'info':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getLogIcon = (level: string) => {
    switch (level.toLowerCase()) {
      case 'info':
        return '🟢';
      case 'error':
        return '🔴';
      default:
        return '⚪';
    }
  };

  const applyFilters = () => {
    let filteredInfo = infoLogs;
    let filteredError = errorLogs;
    if (fromDate) {
      const from = new Date(fromDate);
      filteredInfo = filteredInfo.filter(log => new Date(log.timestamp) >= from);
      filteredError = filteredError.filter(log => new Date(log.timestamp) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // End of day
      filteredInfo = filteredInfo.filter(log => new Date(log.timestamp) <= to);
      filteredError = filteredError.filter(log => new Date(log.timestamp) <= to);
    }
    setFilteredInfoLogs(filteredInfo);
    setFilteredErrorLogs(filteredError);
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setFilteredInfoLogs([]);
    setFilteredErrorLogs([]);
  };

  useEffect(() => {
    fetchSystemLogs();
  }, [refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [infoLogs, errorLogs, fromDate, toDate]);

  const displayInfoLogs = filteredInfoLogs.length > 0 ? filteredInfoLogs : infoLogs;
  const displayErrorLogs = filteredErrorLogs.length > 0 ? filteredErrorLogs : errorLogs;

  return (
    <Card>
      <CardHeader>
        <CardTitle>🟢 System Logs</CardTitle>
        {/* Date Filters and Export */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="fromDate" className="text-sm font-medium">From:</Label>
            <Input
              id="fromDate"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="toDate" className="text-sm font-medium">To:</Label>
            <Input
              id="toDate"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button variant="outline" onClick={clearFilters} size="sm">
            Clear Filters
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const date = new Date().toISOString().split('T')[0];
              const allLogs = [...displayInfoLogs, ...displayErrorLogs];
              if (allLogs.length === 0) {
                toast.error('No logs to export');
                return;
              }
              const headers = ['Timestamp', 'Level', 'Message'];
              const csvContent = [
                headers.join(','),
                ...allLogs.map(log => [
                  `"${formatDate(log.timestamp)}"`,
                  `"${log.level}"`,
                  `"${log.message.replace(/"/g, '""')}"`
                ].join(','))
              ].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const link = document.createElement('a');
              const url = URL.createObjectURL(blob);
              link.setAttribute('href', url);
              link.setAttribute('download', `system_logs_${date}.csv`);
              link.style.visibility = 'hidden';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            size="sm"
          >
            <DownloadIcon className="w-4 h-4 mr-2" />
            Download Logs
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {/* Info Logs */}
            {displayInfoLogs.length > 0 && (
              <Collapsible open={!infoCollapsed} onOpenChange={setInfoCollapsed}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <h3 className="text-lg font-semibold">Info Logs ({displayInfoLogs.length})</h3>
                    {infoCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {displayInfoLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                      <Badge variant={log.level.toLowerCase() === 'error' ? 'destructive' : 'default'} className="text-xs">
                        {log.level.toUpperCase()}
                      </Badge>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">{formatDate(log.timestamp)}</div>
                        <div className={`text-sm ${getLogColor(log.level)}`}>{log.message}</div>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Error Logs */}
            {displayErrorLogs.length > 0 && (
              <Collapsible open={!errorCollapsed} onOpenChange={setErrorCollapsed}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <h3 className="text-lg font-semibold">Error Logs ({displayErrorLogs.length})</h3>
                    {errorCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  {displayErrorLogs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-red-50 rounded">
                      <Badge variant="destructive" className="text-xs">
                        {log.level.toUpperCase()}
                      </Badge>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500">{formatDate(log.timestamp)}</div>
                        <div className={`text-sm ${getLogColor(log.level)}`}>{log.message}</div>
                      </div>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            )}

            {infoLogs.length === 0 && errorLogs.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No system logs found
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemLogs;
