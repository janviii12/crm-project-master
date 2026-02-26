import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Download, Eye, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ExpenseHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    startDate: '',
    endDate: '',
    page: 1
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, [filters]);

  const fetchExpenses = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: '10',
        ...(filters.category && { category: filters.category }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`${API_BASE_URL}/api/petty-cash/expenses/${user.id}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setExpenses(result.data);
        setPagination(result.pagination);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch expenses",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const exportToCSV = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`${API_BASE_URL}/api/petty-cash/expenses/${user.id}/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expenses_${user.id}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast({
          title: "Error",
          description: "Failed to export expenses",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive"
      });
    }
  };

  const categories = ['Tea', 'Snacks', 'Diesel', 'Stationery', 'Travel', 'Misc'];

  const getCategoryColor = (category) => {
    const colors = {
      'Tea': 'bg-blue-100 text-blue-800',
      'Snacks': 'bg-green-100 text-green-800',
      'Diesel': 'bg-yellow-100 text-yellow-800',
      'Stationery': 'bg-purple-100 text-purple-800',
      'Travel': 'bg-indigo-100 text-indigo-800',
      'Misc': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.Misc;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/petty-cash-dashboard')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expense History</h1>
            <p className="text-gray-600 mt-2">View and manage your expense records</p>
          </div>
        </div>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setFilters({ category: '', startDate: '', endDate: '', page: 1 })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
          <CardDescription>
            {pagination && `Showing ${expenses.length} of ${pagination.total} expenses`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No expenses found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {expenses.map((expense) => (
                <div key={expense._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getCategoryColor(expense.category)}>
                          {expense.category}
                        </Badge>
                        <Badge variant={expense.paymentType === 'Wallet' ? 'default' : 'secondary'}>
                          {expense.paymentType}
                        </Badge>
                        {(!expense.bill || !expense.bill.filePath) && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Bill Missing
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Amount:</span> ₹{expense.amount.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(expense.date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {new Date(expense.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {expense.description && (
                        <p className="text-sm text-gray-600 mt-2">{expense.description}</p>
                      )}
                    </div>
                    {expense.bill && expense.bill.filePath && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`${API_BASE_URL}/api/uploads/${expense.bill.filePath}`, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Bill
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseHistory;
