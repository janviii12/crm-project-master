import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useAuth } from '@/contexts/AuthContext';
import axiosInstance from '@/lib/axiosInstance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Calendar as CalendarIcon, Clock, User, AlertCircle, Home, Edit, Trash2, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface FollowUp {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  status: 'pending' | 'completed' | 'missed';
  priority: 'low' | 'medium' | 'high';
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  clientId?: {
    _id: string;
    name: string;
    email: string;
    company: string;
  } | null;
}

interface Customer {
  _id: string;
  name: string;
  email: string;
  company: string;
}

const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<FollowUp | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const [isEditMode, setIsEditMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    clientId: 'none',
    reminderBefore: 30,
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    clientId: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    fetchFollowUps();
    fetchCustomers();
  }, []);

  const fetchFollowUps = async () => {
    try {
      const response = await axiosInstance.get('/api/followups');
      setFollowUps(response.data.data);
    } catch (error) {
      console.error('Error fetching follow-ups:', error);
      toast.error('Failed to load follow-ups');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get('/api/customers');
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const handleCreateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = { ...formData };
      if (dataToSend.clientId === 'none') {
        dataToSend.clientId = null;
      }
      await axiosInstance.post('/api/followups', dataToSend);
      toast.success('Follow-up created successfully');
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        description: '',
        date: '',
        time: '',
        clientId: 'none',
        reminderBefore: 30,
        priority: 'medium'
      });
      fetchFollowUps();
    } catch (error) {
      console.error('Error creating follow-up:', error);
      toast.error('Failed to create follow-up');
    }
  };
  const handleEventClick = (info: any) => {
    const event = followUps.find(f => f._id === info.event.extendedProps._id);
    if (event) {
      setSelectedEvent(event);
      setIsEditMode(false);
      setEditFormData({
        title: event.title,
        description: event.description || '',
        date: new Date(event.date).toISOString().split('T')[0],
        time: event.time,
        clientId: event.clientId?._id || '',
        priority: event.priority
      });
    }
  };

  const handleSelectSlot = (info: any) => {
    const date = info.startStr.split('T')[0];
    const time = info.startStr.split('T')[1] ? info.startStr.split('T')[1].substring(0, 5) : '09:00';
    setFormData({
      ...formData,
      date,
      time
    });
    setIsCreateDialogOpen(true);
  };

 const handleUpdateFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      const dataToSend = { ...editFormData };
      if (dataToSend.clientId === 'none') {
        dataToSend.clientId = null;
      }
      await axiosInstance.patch(`/api/followups/${selectedEvent._id}`, dataToSend);
      toast.success('Follow-up updated successfully');
      setIsEditMode(false);
      setSelectedEvent(null);
      fetchFollowUps();
    } catch (error) {
      console.error('Error updating follow-up:', error);
      toast.error('Failed to update follow-up');
    }
  };
  const handleDeleteFollowUp = async () => {
    if (!selectedEvent) return;
    try {
      await axiosInstance.delete(`/api/followups/${selectedEvent._id}`);
      toast.success('Follow-up deleted successfully');
      setSelectedEvent(null);
      fetchFollowUps();
    } catch (error) {
      console.error('Error deleting follow-up:', error);
      toast.error('Failed to delete follow-up');
    }
  };

  const eventContent = (eventInfo: any) => {
    const isDark = document.documentElement.classList.contains("dark");

    let backgroundColor = isDark ? "#2563eb" : "#3174ad"; // base blue

    switch (eventInfo.event.extendedProps.priority) {
      case "high":
        backgroundColor = isDark ? "#dc2626" : "#ef4444";
        break;
      case "medium":
        backgroundColor = isDark ? "#f59e0b" : "#fbbf24";
        break;
      case "low":
        backgroundColor = isDark ? "#10b981" : "#34d399";
        break;
    }

    if (eventInfo.event.extendedProps.status === "completed") backgroundColor = "#6b7280";
    if (eventInfo.event.extendedProps.status === "missed") backgroundColor = "#b91c1c";

    return {
      html: `<div style="background-color: ${backgroundColor}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500;">${eventInfo.event.title}</div>`
    };
  };

  const events = followUps.map(followUp => ({
    ...followUp,
    start: new Date(`${followUp.date.split('T')[0]}T${followUp.time}`),
    end: new Date(`${followUp.date.split('T')[0]}T${followUp.time}`),
    title: `${followUp.title} - ${followUp.clientId?.name || 'No Client'}`
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar & Follow-ups</h1>
          <p className="text-gray-600 dark:text-white">Manage your follow-up appointments and reminders</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Follow-up
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Follow-up</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateFollowUp} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({...formData, time: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="clientId">Client (Optional)</Label>
                <Select value={formData.clientId} onValueChange={(value) => setFormData({...formData, clientId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Client</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.name} - {customer.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData({...formData, priority: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Create Follow-up</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              eventClick={handleEventClick}
              select={handleSelectSlot}
              eventContent={eventContent}
              height={600}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              dayMaxEvents={true}
              moreLinkClick="popover"
              selectable={true}
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upcoming Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Upcoming Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {followUps
                .filter(f => f.status === 'pending')
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .slice(0, 5)
                .map((followUp) => (
                  <div key={followUp._id} className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-sm">{followUp.title}</h4>
                      <Badge variant={
                        followUp.priority === 'high' ? 'destructive' :
                        followUp.priority === 'medium' ? 'default' : 'secondary'
                      }>
                        {followUp.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{followUp.clientId?.name || 'No Client'}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon className="w-3 h-3 mr-1" />
                      {new Date(followUp.date).toLocaleDateString()}
                      <Clock className="w-3 h-3 ml-2 mr-1" />
                      {followUp.time}
                    </div>
                  </div>
                ))}
              {followUps.filter(f => f.status === 'pending').length === 0 && (
                <p className="text-sm text-gray-500 text-center">No upcoming reminders</p>
              )}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-600 rounded mr-2"></div>
                <span className="text-sm">High Priority</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-amber-500 rounded mr-2"></div>
                <span className="text-sm">Medium Priority</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                <span className="text-sm">Low Priority</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-500 rounded mr-2"></div>
                <span className="text-sm">Completed</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Details Dialog */}
      {selectedEvent && (
        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Edit Follow-up' : selectedEvent.title}</DialogTitle>
            </DialogHeader>
            {isEditMode ? (
              <form onSubmit={handleUpdateFollowUp} className="space-y-4">
                <div>
                  <Label htmlFor="editTitle">Title</Label>
                  <Input
                    id="editTitle"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea
                    id="editDescription"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editDate">Date</Label>
                    <Input
                      id="editDate"
                      type="date"
                      value={editFormData.date}
                      onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editTime">Time</Label>
                    <Input
                      id="editTime"
                      type="time"
                      value={editFormData.time}
                      onChange={(e) => setEditFormData({...editFormData, time: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editClientId">Client (Optional)</Label>
                  <Select value={editFormData.clientId} onValueChange={(value) => setEditFormData({...editFormData, clientId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Client</SelectItem>
                      {customers.map((customer) => (
                        <SelectItem key={customer._id} value={customer._id}>
                          {customer.name} - {customer.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editPriority">Priority</Label>
                  <Select value={editFormData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setEditFormData({...editFormData, priority: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setIsEditMode(false)}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Client</Label>
                  <p className="text-sm text-gray-600">{selectedEvent.clientId?.name || 'No Client'} - {selectedEvent.clientId?.company || ''}</p>
                </div>
                <div>
                  <Label>Description</Label>
                  <p className="text-sm">{selectedEvent.description || 'No description'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <p className="text-sm">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label>Time</Label>
                    <p className="text-sm">{selectedEvent.time}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Priority</Label>
                    <Badge variant={
                      selectedEvent.priority === 'high' ? 'destructive' :
                      selectedEvent.priority === 'medium' ? 'default' : 'secondary'
                    }>
                      {selectedEvent.priority}
                    </Badge>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={selectedEvent.status === 'completed' ? 'default' : 'secondary'}>
                      {selectedEvent.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setIsEditMode(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the follow-up.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteFollowUp}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
