import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ActivityTimeline from '@/components/staff/ActivityTimeline';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw } from 'lucide-react';
import axiosInstance from '@/lib/axiosInstance';
import { toast } from 'sonner';

const StaffActivityTracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Admin-only access
  useEffect(() => {
    if (!user?.roles?.includes('admin')) {
      toast.error('Admin access required');
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchStaffList();
    return () => setSelectedStaffId('');
  }, []);

  const fetchStaffList = async () => {
    try {
      console.log('Fetching staff...');
      const response = await axiosInstance.get('/api/users/staff');
      console.log('Raw API response:', response.data);
      if (response.data.success) {
        const staffList = response.data.data || [];
        const filteredStaff = staffList.filter(s => s.roles.some(r => ['manager', 'executive'].includes(r)));
        console.log('Filtered staff:', filteredStaff.length, filteredStaff.map(s => ({name: s.name || s.email, roles: s.roles})));
        toast.success(`Loaded ${filteredStaff.length} executives/managers`);
        setStaff(filteredStaff);
      } else {
        console.log('API no success:', response.data.message);
        toast.error(response.data.message || 'API failed');
      }
    } catch (error) {
      console.error('Fetch staff error:', error.response?.status, error.response?.data || error.message);
      toast.error(`Staff load failed: ${error.response?.status || error.message} - backend running?`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Users className="w-16 h-16 border-primary text-primary/50 mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading staff members...</p>
            <p className="text-xs text-muted-foreground mt-2">Check browser console for logs</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Staff Activity Tracker</h1>
          <p className="text-muted-foreground">Monitor executive and manager activity timelines</p>
        </div>

      <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Select Staff Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 ">
            <div className="max-w-md">
<div className="relative w-full">

  {/* Button */}
  <button
    className="w-full border p-3 rounded-lg bg-[#4f46ef] hover:bg-[#3b34c9] text-white flex justify-between items-center"
    onClick={() => setDropdownOpen(prev => !prev)}
  >
    <span>
      {selectedStaffId
        ? staff.find(s => s._id === selectedStaffId)?.name ||
          staff.find(s => s._id === selectedStaffId)?.email
        : "Select staff..."}
    </span>

    <span>▼</span>
  </button>

  {/* Dropdown */}
  {dropdownOpen && (
    <div className="absolute z-50 w-full bg-white border mt-1 rounded shadow max-h-60 overflow-auto">

      {staff.length === 0 ? (
        <div className="p-2 text-sm text-gray-500">
          No staff found
        </div>
      ) : (
        staff.map(member => (
          <div
            key={member._id}
            className="p-2 hover:bg-gray-100 cursor-pointer"
            onClick={() => {
              setSelectedStaffId(member._id);
              setDropdownOpen(false);
            }}
          >
            {member.name || member.email} ({member.roles.join(", ")})
          </div>
        ))
      )}

    </div>
  )}
</div>
            </div>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={fetchStaffList}
            >
              <RefreshCw className="w-4 h-4 mr-2 shrink-0" />
              Refresh Staff List
            </Button>
            <p className="text-xs text-muted-foreground">
              Staff count: {staff.length} 
            </p>
          </CardContent>
        </Card>

        {selectedStaffId && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ActivityTimeline staffId={selectedStaffId} />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StaffActivityTracker;
