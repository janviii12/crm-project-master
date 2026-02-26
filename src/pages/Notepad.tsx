import { useState, useEffect } from 'react';
import { Plus, Search, Edit3, Share2, Trash2, Users, Lock, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/config';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import NotepadEditor from '@/components/NotepadEditor';
import ShareNoteModal from '@/components/ShareNoteModal';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface Note {
  _id: string;
  title: string;
  content: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  sharedWith: Array<{
    userId: {
      _id: string;
      name: string;
      email: string;
    };
    role?: string;
    permission: 'read' | 'write';
  }>;
  updatedAt: string;
  createdAt: string;
}

const Notepad = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState('my-notes');

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/notes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setNotes(result.data);
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to fetch notes',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch notes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      // Listen for note updates
      socket.on('note-updated', (data) => {
        console.log('Note updated via socket:', data);
        fetchNotes(); // Refresh notes list
        toast({
          title: 'Note Updated',
          description: `Note "${data.title}" was updated by another user`
        });
      });

      // Listen for note sharing
      socket.on('note-shared', (data) => {
        console.log('Note shared via socket:', data);
        fetchNotes(); // Refresh notes list
        toast({
          title: 'Note Shared',
          description: `A note was shared with you`
        });
      });

      // Listen for note deletion
      socket.on('note-deleted', (data) => {
        console.log('Note deleted via socket:', data);
        fetchNotes(); // Refresh notes list
        toast({
          title: 'Note Deleted',
          description: `Note "${data.title}" was deleted`
        });
      });

      // Join note rooms for shared notes
      notes.forEach(note => {
        if (note.sharedWith.some(shared => shared.userId && shared.userId._id === user?.id)) {
          socket.emit('join-note-room', note._id);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('note-updated');
        socket.off('note-shared');
        socket.off('note-deleted');
      }
    };
  }, [socket, isConnected, notes, user]);

  const handleCreateNote = () => {
    setSelectedNote(null);
    setShowEditor(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setShowEditor(true);
  };

  const handleShareNote = (note: Note) => {
    setSelectedNote(note);
    setShowShareModal(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Emit socket event for real-time deletion
        if (socket && isConnected) {
          socket.emit('noteDelete', { noteId, title: notes.find(n => n._id === noteId)?.title });
        }

        toast({
          title: 'Success',
          description: 'Note deleted successfully'
        });
        fetchNotes();
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to delete note',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive'
      });
    }
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         note.content.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'my-notes':
        return note.createdBy && note.createdBy._id === user?.id;
      case 'shared-with-me':
        return note.sharedWith.some(shared => shared.userId && shared.userId._id === user?.id);
      case 'all-notes':
        return true;
      default:
        return false;
    }
  });

  useEffect(() => {
    fetchNotes();
  }, []);

  const getPermissionBadge = (permission: string) => {
    return permission === 'write' ? (
      <Badge variant="default" className="text-xs">
        <Edit3 className="w-3 h-3 mr-1" />
        Write
      </Badge>
    ) : (
      <Badge variant="secondary" className="text-xs">
        <Eye className="w-3 h-3 mr-1" />
        Read
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notepad</h1>
          <p className="text-gray-600 mt-1 dark:text-white">Create and manage your notes</p>
          {!isConnected && (
            <p className="text-sm text-yellow-600 mt-1">⚠️ Real-time updates unavailable</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchNotes}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateNote}>
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-notes">My Notes</TabsTrigger>
          <TabsTrigger value="shared-with-me">Shared with Me</TabsTrigger>
          <TabsTrigger value="all-notes">All Notes</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading notes...</p>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                {activeTab === 'my-notes' && <Edit3 className="w-12 h-12 mx-auto" />}
                {activeTab === 'shared-with-me' && <Users className="w-12 h-12 mx-auto" />}
                {activeTab === 'all-notes' && <Search className="w-12 h-12 mx-auto" />}
              </div>
              <p className="text-gray-600">
                {activeTab === 'my-notes' && 'No personal notes found'}
                {activeTab === 'shared-with-me' && 'No notes shared with you'}
                {activeTab === 'all-notes' && 'No notes found'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <Card key={note._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg truncate" title={note.title}>
                        {note.title}
                      </CardTitle>
                      <div className="flex gap-1">
                        {note.createdBy && note.createdBy._id === user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShareNote(note)}
                            className="h-8 w-8 p-0"
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditNote(note)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        {note.createdBy && note.createdBy._id === user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note._id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      By {note.createdBy?.name || 'Unknown'} • {new Date(note.updatedAt).toLocaleDateString()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-700 mb-3 line-clamp-3">
                      {note.content}
                    </div>
                    {note.sharedWith.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.sharedWith.slice(0, 3).map((shared, index) => (
                          <div key={index} className="flex items-center gap-1">
                            {getPermissionBadge(shared.permission)}
                          </div>
                        ))}
                        {note.sharedWith.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{note.sharedWith.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Note Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {selectedNote ? 'Edit Note' : 'Create New Note'}
            </DialogTitle>
          </DialogHeader>
          <NotepadEditor
            note={selectedNote}
            onSave={() => {
              setShowEditor(false);
              fetchNotes();
            }}
            onCancel={() => setShowEditor(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Share Note Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Share Note</DialogTitle>
          </DialogHeader>
          {selectedNote && (
            <ShareNoteModal
              note={selectedNote}
              onSuccess={() => {
                setShowShareModal(false);
                fetchNotes();
              }}
              onCancel={() => setShowShareModal(false)}
            />
          )}
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Notepad;
