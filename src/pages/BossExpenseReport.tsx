import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config';
import { Download, TrendingUp, TrendingDown, Users, DollarSign, Plus, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AddFundsForm from '@/components/AddFundsForm';
import TransactionHistoryModal from '@/components/TransactionHistoryModal';

const BossExpenseReport = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reportData, setReportData] = useState([]);
  const [allWallets, setAllWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  useEffect(() => {
    if (user?.roles?.includes('admin')) {
      fetchReportData();
      fetchAllWallets();
    }
  }, [user, filters]);

  const fetchReportData = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`${API_BASE_URL}/api/petty-cash/summary?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setReportData(result.data);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to fetch report data",
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

  const fetchAllWallets = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/petty-cash/wallets`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setAllWallets(result.data);
      }
    } catch (error) {
      console.error('Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const exportAllExpenses = async () => {
    // This would require a new admin endpoint to export all expenses
    toast({
      title: "Feature Coming Soon",
      description: "Bulk export for all managers will be available soon",
    });
  };

  const addWalletAmount = async (managerId, amount, description) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/petty-cash/wallet/${managerId}/add-amount`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ amount, description })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Success",
          description: "Amount added to wallet successfully",
        });
        fetchAllWallets(); // Refresh wallet data
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to add amount",
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

  const totalReceived = allWallets.reduce((sum, wallet) => sum + wallet.totalReceived, 0);
  const totalSpent = allWallets.reduce((sum, wallet) => sum + wallet.totalSpent, 0);
  const totalBalance = allWallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  if (!user?.roles?.includes('admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500">Access denied. Admin privileges required.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expense Reports</h1>
          <p className="text-gray-600 mt-2">Overview of all managers' petty cash expenses</p>
        </div>
        <Button onClick={exportAllExpenses} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export All
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{totalReceived.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₹{totalSpent.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ₹{totalBalance.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Managers</CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {allWallets.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Date Range Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                onClick={() => setFilters({ startDate: '', endDate: '' })}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manager Wallets */}
      <Card>
        <CardHeader>
          <CardTitle>Manager Wallets</CardTitle>
          <CardDescription>Current status of all manager wallets</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : allWallets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No manager wallets found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allWallets.map((wallet) => (
                <div key={wallet._id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{wallet.managerId.name}</h3>
                      <p className="text-sm text-gray-600">{wallet.managerId.email}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${wallet.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{wallet.balance.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-600">Current Balance</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Received</p>
                      <p className="font-semibold text-green-600">₹{wallet.totalReceived.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="font-semibold text-red-600">₹{wallet.totalSpent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Settlement</p>
                      <p className="font-semibold">
                        {wallet.lastSettlementDate
                          ? new Date(wallet.lastSettlementDate).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="font-semibold">
                        {new Date(wallet.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {wallet.balance < 100 && (
                    <Badge variant="destructive" className="mb-2">Low Balance</Badge>
                  )}

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedManagerId(wallet.managerId._id);
                        setShowTransactionModal(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View History
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <Plus className="w-4 h-4 mr-1" />
                          Add Funds
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add Funds to {wallet.managerId.name}'s Wallet</DialogTitle>
                          <DialogDescription>
                            Add petty cash funds with proper documentation and payment method tracking.
                          </DialogDescription>
                        </DialogHeader>
                        <AddFundsForm
                          managers={[wallet.managerId]}
                          onSuccess={() => {
                            fetchAllWallets(); // Refresh wallet data
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Expense Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Expense Summary</CardTitle>
          <CardDescription>Breakdown by manager and category</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No expense data found</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reportData.map((manager) => (
                <div key={manager.managerId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{manager.managerName}</h3>
                      <p className="text-sm text-gray-600">{manager.managerEmail}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">
                        ₹{manager.totalSpent.toLocaleString()}
                      </div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {manager.categories.map((category) => (
                      <div key={category.category} className="text-center">
                        <p className="text-sm font-medium">{category.category}</p>
                        <p className="text-lg font-semibold">₹{category.totalAmount.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">{category.count} expenses</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction History Modal */}
      <TransactionHistoryModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        managerId={selectedManagerId}
      />
    </div>
  );
};

export default BossExpenseReport;
