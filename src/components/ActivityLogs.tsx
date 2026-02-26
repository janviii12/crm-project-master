import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, Download, Shield, Download as DownloadIcon, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '../lib/axiosInstance';
import { format } from 'date-fns';
// import { format } from 'date-fns/format';

const exportToCSV = (logs: Log[], filename: string) => {
  if (logs.length === 0) {
    toast.error('No logs to export');
    return;
  }

  const headers = ['User', 'Role', 'Action', 'Document', 'Timestamp', 'IP Address', 'Device Info'];
  const csvContent = [
    headers.join(','),
    ...logs.map(log => [
      `"${log.userName}"`,
      `"${log.userRole}"`,
      `"${log.action}"`,
      `"${log.documentName}"`,
      `"${format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}"`,
      `"${log.ipAddress}"`,
      `"${log.deviceInfo.replace(/"/g, '""')}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

interface Log {
  id: string;
  userRole: string;
  userName: string;
  userId: string;
  documentName: string;
  documentId: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  deviceInfo: string;
}

const ActivityLogs = ({ refreshTrigger }: { refreshTrigger: number }) => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/logs?page=${currentPage}&limit=50`);

      if (response.data.success) {
        setLogs(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalCount(response.data.pagination.totalCount);
      } else {
        toast.error('Failed to fetch logs');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'Viewed':
        return <Eye className="w-4 h-4" />;
      case 'Downloaded':
        return <Download className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const applyFilters = () => {
    let filtered = logs;
    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter(log => new Date(log.timestamp) >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(log => new Date(log.timestamp) <= to);
    }
    setFilteredLogs(filtered);
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setFilteredLogs([]);
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, refreshTrigger]);

  useEffect(() => {
    applyFilters();
  }, [logs, fromDate, toDate]);

  const displayLogs = filteredLogs.length > 0 ? filteredLogs : logs;

  return (
    <Card>
      <CardHeader>
        <CardTitle>📜 Activity Logs</CardTitle>
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
              exportToCSV(displayLogs, `activity_logs_${date}.csv`);
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
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No logs found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Device Info</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.userName}</TableCell>
                    <TableCell>{log.userRole}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        {log.action}
                      </div>
                    </TableCell>
                    <TableCell>{log.documentName}</TableCell>
                    <TableCell>{formatDate(log.timestamp)}</TableCell>
                    <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                    <TableCell className="max-w-xs truncate" title={log.deviceInfo}>
                      {log.deviceInfo}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6 pb-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({totalCount} total logs)
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ActivityLogs;
