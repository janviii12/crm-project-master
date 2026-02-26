import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Calendar, Download, Eye, Filter, TrendingUp, TrendingDown, FileText, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config';

interface Transaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  paymentMethod?: string;
  bill?: {
    filePath: string;
    fileOriginalName: string;
    uploadedAt: Date;
  };
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
  reference?: {
    category: string;
    description: string;
  };
}

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  managerId: string;
}

const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({
  isOpen,
  onClose,
  managerId
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: ''
  });
  const [selectedBill, setSelectedBill] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTransactions = async (pageNum = 1, reset = false) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20'
      });

      if (filters.type && filters.type !== 'all') queryParams.append('type', filters.type);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await fetch(
        `${API_BASE_URL}/api/petty-cash/transactions/${managerId}?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      const result = await response.json();

      if (response.ok && result.success) {
        const newTransactions = result.data;
        setTransactions(prev => reset ? newTransactions : [...prev, ...newTransactions]);
        setHasMore(newTransactions.length === 20);
        setPage(pageNum);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to fetch transactions',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Network error occurred',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && managerId) {
      fetchTransactions(1, true);
    }
  }, [isOpen, managerId, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchTransactions(1, true);
  };

  const clearFilters = () => {
    setFilters({ type: 'all', startDate: '', endDate: '' });
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchTransactions(page + 1);
    }
  };

  const downloadBill = async (filePath: string, fileName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/${filePath}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to download bill',
          variant: 'destructive',
          duration: 5000,
        });
      }
    } catch (error) {
        toast({
          title: 'Error',
          description: 'Network error occurred',
          variant: 'destructive',
          duration: 5000,
        });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Transaction History
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex-1 min-w-[200px]">
            <Label htmlFor="type-filter">Transaction Type</Label>
            <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="credit">Credits (Money Added)</SelectItem>
                <SelectItem value="debit">Debits (Money Spent)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <Label htmlFor="end-date">End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={applyFilters} size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Apply
            </Button>
            <Button onClick={clearFilters} variant="outline" size="sm">
              Clear
            </Button>
          </div>
        </div>

        {/* Transactions List */}
        <ScrollArea className="h-[500px]">
          <div className="space-y-4">
            {transactions.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                No transactions found
              </div>
            )}

            {transactions.map((transaction, index) => (
              <Card key={transaction._id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'credit'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={transaction.type === 'credit' ? 'default' : 'destructive'}>
                            {transaction.type === 'credit' ? 'Credit' : 'Debit'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(transaction.createdAt)}
                          </span>
                        </div>

                        <p className="font-medium text-sm mb-1">
                          {transaction.description}
                        </p>

                        {transaction.reference && (
                          <p className="text-xs text-muted-foreground mb-2">
                            Category: {transaction.reference.category}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Before: {formatAmount(transaction.balanceBefore)}</span>
                          <span>After: {formatAmount(transaction.balanceAfter)}</span>
                          {transaction.paymentMethod && (
                            <span>Method: {transaction.paymentMethod}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-lg font-bold ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatAmount(transaction.amount)}
                      </div>

                      {transaction.bill && (
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedBill(transaction.bill!.filePath)}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadBill(
                              transaction.bill!.filePath,
                              transaction.bill!.fileOriginalName
                            )}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>

                {index < transactions.length - 1 && <Separator />}
              </Card>
            ))}

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
              </div>
            )}

            {hasMore && !loading && (
              <div className="text-center py-4">
                <Button onClick={loadMore} variant="outline">
                  Load More
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Bill Preview Modal */}
        {selectedBill && (
          <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bill Preview</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center">
                {selectedBill.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={`${API_BASE_URL}/${selectedBill}`}
                    className="w-full h-96 border rounded"
                    title="Bill Preview"
                  />
                ) : (
                  <img
                    src={`${API_BASE_URL}/${selectedBill}`}
                    alt="Bill Preview"
                    className="max-w-full max-h-96 object-contain"
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransactionHistoryModal;
