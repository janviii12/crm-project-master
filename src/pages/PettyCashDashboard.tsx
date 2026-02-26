import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE_URL } from '@/config';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Calendar, Plus, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TransactionHistoryModal from '@/components/TransactionHistoryModal';

const PettyCashDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, [user]);

  const fetchWalletData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/petty-cash/wallet/${user.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setWalletData(result.data);
      } else {
        setError(result.message || 'Failed to fetch wallet data');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={fetchWalletData}>Try Again</Button>
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
          <h1 className="text-3xl font-bold text-gray-900">Petty Cash Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your petty cash expenses and wallet balance</p>
        </div>
        <Button onClick={() => navigate('/add-expense')} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Wallet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₹{walletData?.totalReceived?.toLocaleString() || '0'}
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
              ₹{walletData?.totalSpent?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowTransactionModal(true)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              <Eye className="h-3 w-3 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${walletData?.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ₹{walletData?.balance?.toLocaleString() || '0'}
            </div>
            {walletData?.balance < 0 && (
              <Badge variant="destructive" className="mt-2">Negative Balance</Badge>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Click to view transaction history
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Settlement</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {walletData?.lastSettlementDate
                ? new Date(walletData.lastSettlementDate).toLocaleDateString()
                : 'Never'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing petty cash</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/add-expense')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Expense
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate('/expense-history')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              View Expense History
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wallet Status</CardTitle>
            <CardDescription>Current wallet information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Manager:</span>
                <span className="text-sm font-medium">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Wallet ID:</span>
                <span className="text-sm font-medium">{walletData?._id?.slice(-8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Updated:</span>
                <span className="text-sm font-medium">
                  {walletData?.updatedAt ? new Date(walletData.updatedAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Balance Alert */}
      {walletData?.balance < 100 && walletData?.balance >= 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <p className="text-yellow-800">
                <strong>Low Balance Alert:</strong> Your wallet balance is below ₹100. Consider requesting more funds.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {walletData?.balance < 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <p className="text-red-800">
                <strong>Negative Balance:</strong> Your expenses exceed the allocated funds. Please contact admin.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction History Modal */}
      <TransactionHistoryModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        managerId={user.id}
      />
    </div>
  );
};

export default PettyCashDashboard;
