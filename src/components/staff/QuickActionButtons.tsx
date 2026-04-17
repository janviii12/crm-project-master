import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimePicker } from '@/components/ui/time-picker';
import { 
  Utensils, ClockIcon, 
  Video, Calendar, 
  Briefcase, LogOut
} from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/lib/axiosInstance';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';

type TimeKey = 'startTime' | 'endTime';
type TextKey = 'details' | 'reason';

interface FormField {
  key: TimeKey | TextKey;
  label: string;
  type: 'time' | 'input';
}

interface Action {
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

const QuickActionButtons = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState('');
  const [currentStatus, setCurrentStatus] = useState('offline');
  const [formData, setFormData] = useState<Record<string, Date | string>>({
    startTime: new Date(),
    endTime: new Date(),
    details: '',
    reason: ''
  });

const actions: Action[] = [
{ key: 'lunch_start', label: 'Start Lunch', icon: Utensils, 
 color: 'bg-yellow-400/70 hover:bg-yellow-500/80 text-gray-800 shadow-md hover:shadow-xl backdrop-blur-sm bg-gradient-to-br from-yellow-300/60 to-white/40'},

  { key: 'meeting_start', label: 'Start Meeting', icon: Video, 
  color: 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-xl' },

  { key: 'outside_work_start', label: 'Outside Work', icon: Briefcase, 
  color: 'bg-orange-400 hover:bg-orange-500 text-gray-800 shadow-md hover:shadow-xl' },

{ key: 'lunch_end', label: 'End Lunch', icon: ClockIcon, 
  color: 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-xl' },



{ key: 'meeting_end', label: 'End Meeting', icon: Calendar, 
  color: 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-xl' },



{ key: 'outside_work_end', label: 'End Outside Work', icon: ClockIcon, 
  color: 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-xl' },

{ key: 'logout', label: 'Logout', icon: LogOut, 
  color: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 to-red-700 text-white shadow-lg hover:shadow-xl border-red-400' }
];

  useEffect(() => {
    const status = (user as any)?.currentStatus ?? 'offline';
    setCurrentStatus(status as string);
  }, [user]);

  const getFormFields = (action: string): FormField[] => {
    const baseFields: FormField[] = [
      { key: 'startTime', label: 'Start Time', type: 'time' },
      { key: 'endTime', label: 'End Time', type: 'time' }
    ];
    if (action.includes('meeting')) {
      baseFields.unshift({ key: 'details', label: 'Meeting Title', type: 'input' });
    } else if (action.includes('outside_work')) {
      baseFields.unshift({ key: 'reason', label: 'Reason *', type: 'input' });
      baseFields[0].label = 'Out Time';
      baseFields[1].label = 'In Time';
    }
    return baseFields;
  };

  const resetForm = () => {
    setFormData({
      startTime: new Date(),
      endTime: new Date(),
      details: '',
      reason: ''
    });
  };

  const handleAction = async (action: string) => {
    // Validate time range
    const start = formData.startTime as Date;
    const end = formData.endTime as Date;
    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const payload = {
        action,
        ...(action.includes('_start') ? { startTime: now } : {}),
        ...(action.includes('_end') ? { endTime: now } : {}),
        currentStatus
      };

      const response = await axiosInstance.post('/api/activities/activity-log', payload);
      if (response.data.success) {
        toast.success(response.data.message || 'Activity logged successfully');
        setCurrentStatus(response.data.newStatus || currentStatus);
        setOpenDialog(false);
        resetForm();
        
        // 🔄 Trigger My Activity refetch for IMMEDIATE timeline update
        window.dispatchEvent(new CustomEvent('activitiesRefetch'));
        console.log('🚀 QuickAction: Dispatched activitiesRefetch');
      }
    } catch (error: any) {
      const status = error.response?.status;
      let message = 'Action failed';
      
      if (status === 401 || status === 403) {
        message = 'Session expired. Please login again.';
      } else if (status === 404) {
        message = 'Activity service not found. Contact admin.';
      } else if (status === 500) {
        message = 'Server error. Try again later.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      toast.error(message);
      console.error('QuickAction error:', { status, message, error });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormField = (key: string, value: Date | string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const openActionDialog = (action: string) => {
    setCurrentAction(action);
    const now = new Date();
    setFormData({
      startTime: now,
      endTime: new Date(now.getTime() + 60 * 60 * 1000),
      details: '',
      reason: ''
    });
    setOpenDialog(true);
  };

      const handleQuickAction = async (act: Action) => {
    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();
      const payload: any = {
        action: act.key
      };
      if (act.key.includes('_start')) {
        payload.startTime = now;
      }
      // Logout handled separately in backend - no open activity needed
      const response = await axiosInstance.post('/api/activities/activity-log', payload);
      console.log("PAYLOAD SENT:", payload);
      if (response.data.success) {
        toast.success(response.data.message || `${act.label} completed`);
      } else {
        toast.error(response.data.message || 'Action failed');
      }
      
      // 🔄 Quick action success → immediate timeline refresh
      window.dispatchEvent(new CustomEvent('activitiesRefetch'));
    } catch (error: any) {
      const status = error.response?.status;
      let message = 'Action failed';
      
      if (status === 401 || status === 403) {
        message = 'Session expired. Please login again.';
      } else if (status === 404) {
        message = 'Activity service not found. Contact admin.';
      } else if (status === 500) {
        message = 'Server error. Try again later.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      
      toast.error(message);
      console.error('QuickAction error:', { status, message, error });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentAct = actions.find((a) => a.key === currentAction);

  return (
    <>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full p-4">
        {/* Lunch Card */}
<div className="p-6 border backdrop-blur-md rounded-xl shadow-lg w-full max-w-md">          <h4 className="font-bold mb-4 text-lg text-pastel-blue tracking-tight flex items-center gap-2">
            <Utensils className="w-5 h-5" />
             Lunch
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" className={`${actions.find(a => a.key === 'lunch_start')?.color || ''}`} onClick={() => handleQuickAction(actions.find(a => a.key === 'lunch_start')!)} disabled={isSubmitting}>
              <Utensils className="w-4 h-4 mr-2" />
              Start
            </Button>
            <Button size="lg" className={`${actions.find(a => a.key === 'lunch_end')?.color || ''}`} onClick={() => handleQuickAction(actions.find(a => a.key === 'lunch_end')!)} disabled={isSubmitting}>
              <ClockIcon className="w-4 h-4 mr-2" />
              End
            </Button>
          </div>
        </div>

        {/* Meeting Card */}
        <div className="p-6 border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-pastel-gray w-full">
          <h4 className="font-bold mb-4 text-lg text-pastel-blue tracking-tight flex items-center gap-2">
            <Video className="w-5 h-5" />
             Meeting
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" className={`${actions.find(a => a.key === 'meeting_start')?.color || ''}`} onClick={() => handleQuickAction(actions.find(a => a.key === 'meeting_start')!)} disabled={isSubmitting}>
              <Video className="w-4 h-4 mr-2" />
              Start
            </Button>
            <Button size="lg" className={`${actions.find(a => a.key === 'meeting_end')?.color || ''}`} onClick={() => handleQuickAction(actions.find(a => a.key === 'meeting_end')!)} disabled={isSubmitting}>
              <Calendar className="w-4 h-4 mr-2" />
              End
            </Button>
          </div>
        </div>

        {/* Outside Work Card */}
        <div className="p-6 border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-pastel-gray w-full">
          <h4 className="font-bold mb-4 text-lg text-pastel-blue tracking-tight flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
             Outside
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <Button size="lg" className={`${actions.find(a => a.key === 'outside_work_start')?.color || ''}`} onClick={() => handleQuickAction(actions.find(a => a.key === 'outside_work_start')!)} disabled={isSubmitting}>
              <Briefcase className="w-4 h-4 mr-2" />
              Start
            </Button>
            <Button size="lg" className={`${actions.find(a => a.key === 'outside_work_end')?.color || ''}`} onClick={() => handleQuickAction(actions.find(a => a.key === 'outside_work_end')!)} disabled={isSubmitting}>
              <ClockIcon className="w-4 h-4 mr-2" />
              End
            </Button>
          </div>
        </div>
      </div>
        {/* Logout Button */}
        <div className="flex justify-center w-full p-6">
  <div className="w-full max-w-sm">
    <Button 
      className={`${actions.find(a => a.key === 'logout')?.color || ''} h-14 w-full text-lg font-semibold`}
      onClick={() => handleQuickAction(actions.find(a => a.key === 'logout')!)} 
      size="lg"
    >
      <LogOut className="w-6 h-6 mr-3" />
      Logout
    </Button>
  </div>
</div>


      <Dialog open={openDialog} onOpenChange={(open) => {
        setOpenDialog(open);
        if (!open) {
          setCurrentAction('');
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-md p-8 max-h-[90vh] overflow-y-auto rounded-2xl border-pastel-gray shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-pastel-blue">
              {currentAct?.label}
            </DialogTitle>
            <DialogDescription className="text-lg">
              Log your activity. All times are today&apos;s date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {getFormFields(currentAction).map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="text-lg font-medium">
                  {field.label}
                </Label>
                {field.type === 'time' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <TimePicker
                      date={formData[field.key] as Date}
                      onChange={(date) => updateFormField(field.key, date || new Date())}
                    />
                  </div>
                ) : (
                  <Input
                    id={field.key}
                    type="text"
                    value={String(formData[field.key] || '')}
                    onChange={(e) => updateFormField(field.key, e.target.value)}
                    placeholder={field.label === 'Meeting Title' ? 'Client discussion' : 'Enter details...'}
                    className="h-12 text-lg border-pastel-gray focus:border-pastel-blue"
                    required={field.key === 'reason'}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => setOpenDialog(false)}
              className="h-12 px-8 border-pastel-gray hover:bg-pastel-gray/20 flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleAction(currentAction)}
              disabled={isSubmitting}
              className="h-12 px-8 bg-gradient-to-r from-pastel-blue to-pastel-green hover:from-pastel-blue/90 flex-1 shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <ClockIcon className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Log Activity'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickActionButtons;
