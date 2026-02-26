# Chat.tsx Explanation
Chat.tsx is a React component that implements a real-time chat interface with group messaging, message replies, typing indicators, and Socket.IO integration for live updates.

## Create Group Functionality

The create group feature allows users to create new chat groups by selecting participants from a list of available users.

### How it Works

1. **Fetching Available Users**: When the "Create New Group" dialog opens, it fetches users from the API endpoint `http://localhost:5000/api/users`. It filters users who have specific roles: `DeveloperChatAccess`, `DevLead`, or `ChatModerator`. Only these users appear in the participant selection list.

2. **User Selection**: Users can check/uncheck participants from the filtered list.

3. **Group Creation**: The `handleCreateGroup` function sends a POST request to `http://localhost:5000/api/chat/groups` with the group name and selected participant IDs. On success, the new group is added to the groups list.

### Code Snippet for handleCreateGroup

```typescript
const handleCreateGroup = async () => {
  if (!newGroupName.trim() || selectedUsers.length === 0) return;

  try {
    const response = await axios.post('http://localhost:5000/api/chat/groups', {
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
```

### Role-Based Access

- **Who can be added as participants**: Only users with roles `DeveloperChatAccess`, `DevLead`, or `ChatModerator` are visible in the add participants list. This ensures chat access is restricted to authorized personnel.
- **Access Control**: The filtering happens on the frontend after fetching all users, but backend middleware (like `chatAccess.js`) likely enforces role-based permissions for actual chat operations.

### Data Fetching

- Users are fetched via Axios GET request to `/api/users`.
- Groups are created via Axios POST to `/api/chat/groups`.
- Real-time updates are handled via Socket.IO for messages and typing indicators.