import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  Users,
  Plus,
  MoreVertical,
  Trash2,
  MessageCircle,
  UserPlus,
  Reply,
  Settings,
  UserMinus
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import axiosInstance from '../lib/axiosInstance';
import { API_BASE_URL } from '../config';
import axios from 'axios';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  content: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'file' | 'gif';
  media?: {
    type: string;
    url: string;
    filename?: string;
  };
  readBy: Array<{
    user: string;
    readAt: string;
  }>;
  group: string; // Add group field for socket messages
  replyTo?: {
    _id: string;
    sender: {
      _id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    content: string;
  };
}

interface Group {
  _id: string;
  name: string;
  participants: Array<{
    _id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
  }>;
  createdBy: {
    _id: string;
    name: string;
  };
  lastMessage?: Message;
  lastMessageTime?: string;
  groupType: 'direct' | 'group';
}

const Chat = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; username: string }[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [developerUsers, setDeveloperUsers] = useState<any[]>([]);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    console.log('Initializing socket connection with token:', token.substring(0, 20) + '...');

    const newSocket = io(API_BASE_URL, {
      auth: { token }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected successfully');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Load user's groups
  useEffect(() => {
    if (!user) return;

    const loadGroups = async () => {
      try {
        console.log('📡 Chat.tsx: Loading groups for user:', user.id);
        const response = await axiosInstance.get('/api/chat/groups');
        console.log('✅ Chat.tsx: Groups API response:', response);
        if (response.data.success) {
          console.log('📋 Chat.tsx: Groups loaded successfully:', response.data.data.length, 'groups');
          setGroups(response.data.data);
        }
      } catch (error: any) {
        console.error('❌ Chat.tsx: Error loading groups:', error);
        console.error('❌ Chat.tsx: Error response:', error.response?.data);
        console.error('❌ Chat.tsx: Error status:', error.response?.status);
        toast.error('Failed to load chat groups');
      }
    };

    loadGroups();
  }, [user]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Join user's groups
    const groupIds = groups.map(g => g._id);
    socket.emit('join-groups', groupIds);

    // Listen for new messages
    socket.on('new-message', (message: Message) => {
      // Only add if not already in messages (prevent duplicates)
      setMessages(prev => {
        const exists = prev.some(msg => msg._id === message._id);
        if (exists) return prev;
        return [...prev, message];
      });
      // Update last message in groups list
      setGroups(prev => prev.map(group =>
        group._id === message.group ? {
          ...group,
          lastMessage: message,
          lastMessageTime: message.timestamp
        } : group
      ));
    });

    // Listen for message deletions
    socket.on('message-deleted', (data: { messageId: string; groupId: string }) => {
      if (data.groupId === selectedGroup?._id) {
        setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
        // Update groups list if the deleted message was the last message
        setGroups(prev => prev.map(group =>
          group.lastMessage?._id === data.messageId ? {
            ...group,
            lastMessage: undefined,
            lastMessageTime: undefined
          } : group
        ));
      }
    });

    // Listen for typing indicators
    socket.on('user-typing', (data: { userId: string; username: string; groupId: string }) => {
      if (data.groupId === selectedGroup?._id && data.userId !== user?.id) {
        setTypingUsers(prev => {
          const exists = prev.some(u => u.userId === data.userId);
          if (exists) return prev;
          return [...prev, { userId: data.userId, username: data.username }];
        });
      }
    });

    socket.on('user-stop-typing', (data: { userId: string; groupId: string }) => {
      if (data.groupId === selectedGroup?._id) {
        setTypingUsers(prev => prev.filter(u => u.userId !== data.userId));
      }
    });

    return () => {
      socket.off('new-message');
      socket.off('message-deleted');
      socket.off('user-typing');
      socket.off('user-stop-typing');
    };
  }, [socket, groups, selectedGroup, user]);

  // Load messages when group is selected
  useEffect(() => {
    if (!selectedGroup) return;

    // Clear typing users when switching groups
    setTypingUsers([]);

    const loadMessages = async () => {
      try {
        const response = await axiosInstance.get(`/api/chat/groups/${selectedGroup._id}/messages`);
        console.log('Messages API response:', response);
        if (response.data.success) {
          setMessages(response.data.data);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        toast.error('Failed to load messages');
      }
    };

    loadMessages();
  }, [selectedGroup]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load available users for group creation
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await axiosInstance.get('/api/users');
        if (response.data.success) {
          // Include all users except the current user for group creation
          const chatUsers = response.data.data.filter((u: any) => u._id !== user?.id);
          setAvailableUsers(chatUsers);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    if (showCreateGroup) {
      loadUsers();
    }
  }, [showCreateGroup, user]);

  // Load developer users for direct chat
  useEffect(() => {
    const loadDeveloperUsers = async () => {
      try {
        const response = await axiosInstance.get('/api/users');
        if (response.data.success) {
          const developers = response.data.data.filter((u: any) =>
            u.roles && u.roles.includes('developer') && u._id !== user?.id
          );
          setDeveloperUsers(developers);
        }
      } catch (error) {
        console.error('Error loading developer users:', error);
      }
    };

    loadDeveloperUsers();
  }, [user]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup || !socket) return;

    // Create optimistic message for immediate display
    const optimisticMessage: Message = {
      _id: `temp_${Date.now()}`, // Temporary ID
      sender: {
        _id: user?.id || '',
        name: user?.name || '',
        email: user?.email || '',
        avatar: user?.avatar
      },
      content: newMessage,
      timestamp: new Date().toISOString(),
      messageType: 'text',
      readBy: [{
        user: user?.id || '',
        readAt: new Date().toISOString()
      }],
      group: selectedGroup._id,
      replyTo: replyTo ? {
        _id: replyTo._id,
        sender: replyTo.sender,
        content: replyTo.content
      } : undefined
    };

    // Immediately add to local state for instant display
    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const response = await axiosInstance.post('/api/chat/messages', {
        groupId: selectedGroup._id,
        content: newMessage,
        messageType: 'text',
        replyTo: replyTo?._id
      });

      if (response.data.success) {
        // Replace optimistic message with real message
        setMessages(prev => prev.map(msg =>
          msg._id === optimisticMessage._id ? response.data.data : msg
        ));

        // Emit to socket for other clients
        socket.emit('send-message', {
          groupId: selectedGroup._id,
          message: response.data.data
        });

        setNewMessage('');
        setReplyTo(null);
        setIsTyping(false);
        socket.emit('stop-typing', {
          userId: user?.id,
          username: user?.name,
          groupId: selectedGroup._id
        });
      } else {
        // Remove optimistic message on failure
        setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
        toast.error('Failed to send message');
      }
    } catch (error) {
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== optimisticMessage._id));
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleTyping = () => {
    if (!socket || !selectedGroup || isTyping) return;

    setIsTyping(true);
    socket.emit('typing', {
      userId: user?.id,
      username: user?.name,
      groupId: selectedGroup._id
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stop-typing', {
        userId: user?.id,
        groupId: selectedGroup._id
      });
    }, 3000);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedUsers.length === 0) return;

    try {
      const response = await axiosInstance.post('/api/chat/groups', {
        name: newGroupName,
        participants: selectedUsers
      });

      if (response.data.success) {
        setGroups(prev => [...prev, response.data.data]);
        setShowCreateGroup(false);
        setNewGroupName('');
        setSelectedUsers([]);
        toast.success('Group created successfully');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await axiosInstance.delete(`/api/chat/messages/${messageId}`);
      // Emit delete event to socket for real-time updates
      if (socket && selectedGroup) {
        socket.emit('delete-message', {
          messageId,
          groupId: selectedGroup._id
        });
      }
      // Remove from local state (will be updated via socket for all clients)
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyTo(message);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleDirectChat = async (devUser: any) => {
    try {
      // Check if a direct chat already exists with this user
      const existingDirectChat = groups.find(group =>
        group.groupType === 'direct' &&
        group.participants.length === 2 &&
        group.participants.some(p => p._id === devUser._id) &&
        group.participants.some(p => p._id === user?.id)
      );

      if (existingDirectChat) {
        // If direct chat exists, select it
        setSelectedGroup(existingDirectChat);
      } else {
        // Create new direct chat
        const response = await axiosInstance.post('/api/chat/groups', {
          name: `${user?.name || user?.email} & ${devUser.name || devUser.email}`,
          participants: [devUser._id],
          groupType: 'direct'
        });

        if (response.data.success) {
          setGroups(prev => [...prev, response.data.data]);
          setSelectedGroup(response.data.data);
          toast.success('Direct chat created');
        }
      }
    } catch (error) {
      console.error('Error creating direct chat:', error);
      toast.error('Failed to create direct chat');
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await axiosInstance.delete(`/api/chat/groups/${groupId}`);
      setGroups(prev => prev.filter(group => group._id !== groupId));
      if (selectedGroup?._id === groupId) {
        setSelectedGroup(null);
        setMessages([]);
      }
      toast.success('Group deleted successfully');
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const handleAddMember = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      const response = await axiosInstance.post(`/api/chat/groups/${selectedGroup._id}/members`, {
        userId
      });

      if (response.data.success) {
        setGroups(prev => prev.map(group =>
          group._id === selectedGroup._id ? response.data.data : group
        ));
        if (selectedGroup._id === response.data.data._id) {
          setSelectedGroup(response.data.data);
        }
        toast.success('Member added successfully');
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedGroup) return;

    try {
      const response = await axiosInstance.delete(`/api/chat/groups/${selectedGroup._id}/members/${userId}`);

      if (response.data.success) {
        setGroups(prev => prev.map(group =>
          group._id === selectedGroup._id ? response.data.data : group
        ));
        if (selectedGroup._id === response.data.data._id) {
          setSelectedGroup(response.data.data);
        }
        toast.success('Member removed successfully');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Groups Sidebar */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Chat Groups</h2>
            <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  New Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select participants:</label>
                    <ScrollArea className="h-40">
                      {availableUsers.map((user) => (
                        <div key={user._id} className="flex items-center space-x-2 p-2">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(prev => [...prev, user._id]);
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== user._id));
                              }
                            }}
                          />
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{getInitials(user.name || user.email)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{user.name || user.email}</span>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  <Button onClick={handleCreateGroup} className="w-full">
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Manage Members Dialog */}
            <Dialog open={showManageMembers} onOpenChange={setShowManageMembers}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Manage Members - {selectedGroup?.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Current Members:</label>
                    <ScrollArea className="h-40">
                      {selectedGroup?.participants.map((participant) => (
                        <div key={participant._id} className="flex items-center justify-between p-2 border-b">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback>{getInitials(participant.name || participant.email)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{participant.name || participant.email}</span>
                          </div>
                          {selectedGroup?.createdBy._id === user?.id && participant._id !== user?.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(participant._id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Add Members:</label>
                    <ScrollArea className="h-40">
                      {availableUsers
                        .filter(u => !selectedGroup?.participants.some(p => p._id === u._id))
                        .map((user) => (
                          <div key={user._id} className="flex items-center justify-between p-2 border-b">
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback>{getInitials(user.name || user.email)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{user.name || user.email}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddMember(user._id)}
                            >
                              <UserPlus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                    </ScrollArea>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Developer Users for Direct Chat */}
          {developerUsers.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Direct Chat
              </div>
              {developerUsers.map((devUser) => (
                <div
                  key={devUser._id}
                  onClick={() => handleDirectChat(devUser)}
                  className="p-4 cursor-pointer hover:bg-accent border-b border-border"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={devUser.avatar} />
                      <AvatarFallback>{getInitials(devUser.name || devUser.email)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{devUser.name || devUser.email}</p>
                      <p className="text-sm text-muted-foreground">Developer</p>
                    </div>
                  </div>
                </div>
              ))}
              <Separator className="my-2" />
            </>
          )}

          {/* Chat Groups */}
          <div className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Groups
          </div>
          {groups.map((group) => (
            <div
              key={group._id}
              onClick={() => setSelectedGroup(group)}
              className={`p-4 cursor-pointer hover:bg-accent border-b border-border ${
                selectedGroup?._id === group._id ? 'bg-accent' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarFallback>
                    <Users className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{group.name}</p>
                  {group.lastMessage && (
                    <p className="text-sm text-muted-foreground truncate">
                      {group.lastMessage.sender.name}: {group.lastMessage.content}
                    </p>
                  )}
                </div>
                {group.lastMessage && (
                  <span className="text-xs text-muted-foreground">
                    {formatTime(group.lastMessage.timestamp)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedGroup ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback>
                      <Users className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{selectedGroup.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedGroup.participants.length} members
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary">
                    {selectedGroup.groupType}
                  </Badge>
                  {/* Group management options for group creator */}
                  {selectedGroup.groupType === 'group' && selectedGroup.createdBy._id === user?.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleDeleteGroup(selectedGroup._id)}>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Group
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShowManageMembers(true)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Manage Members
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`flex ${message.sender._id === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex space-x-2 max-w-xs lg:max-w-md ${message.sender._id === user?.id ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={message.sender.avatar} />
                        <AvatarFallback>{getInitials(message.sender.name)}</AvatarFallback>
                      </Avatar>
                      <div className={`rounded-lg p-3 ${message.sender._id === user?.id ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {message.replyTo && (
                          <div className="mb-2 p-2 bg-muted/50 rounded border-l-2 border-muted-foreground/30">
                            <div className="text-xs text-muted-foreground">
                              Replying to {message.replyTo.sender.name}
                            </div>
                            <p className="text-xs truncate">{message.replyTo.content}</p>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium">{message.sender.name}</span>
                          <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                        </div>
                        <p className="text-sm">{message.content}</p>
                        {message.readBy.length > 1 && (
                          <div className="flex items-center mt-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleReplyToMessage(message)}>
                            <Reply className="w-4 h-4 mr-2" />
                            Reply
                          </DropdownMenuItem>
                          {(message.sender._id === user?.id || user?.roles?.includes('ChatModerator')) && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteMessage(message._id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Typing Indicator */}
            {typingUsers.length > 0 && (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                {typingUsers.map(u => u.username).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            )}

            {/* Reply Preview */}
            {replyTo && (
              <div className="px-4 py-2 border-t border-border bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Reply className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Replying to {replyTo.sender.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyTo(null)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
                <p className="text-sm mt-1 truncate">{replyTo.content}</p>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex space-x-2">
                <Input
                  placeholder={replyTo ? `Replying to ${replyTo.sender.name}...` : "Type a message..."}
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Select a chat group</h3>
              <p className="text-muted-foreground">Choose a group from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
