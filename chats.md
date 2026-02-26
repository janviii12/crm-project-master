# Chat System Standard Operating Procedure (SOP)

## Overview
The Chat System is a real-time group messaging feature integrated into the CRM application. It allows users with developer roles to create groups, send messages, and communicate in real-time using Socket.IO for instant messaging capabilities.

## Architecture

### Backend Components

#### 1. Data Models

##### Message Model (`backend/models/Message.js`)
```javascript
{
  sender: ObjectId (ref: 'User'), // Required
  content: String, // Required
  timestamp: Date, // Default: Date.now
  media: {
    type: String, // 'image', 'file', 'gif'
    url: String,
    filename: String,
    size: Number
  },
  group: ObjectId (ref: 'Group'), // Required
  deleted: Boolean, // Default: false
  readBy: [{
    user: ObjectId (ref: 'User'),
    readAt: Date
  }],
  messageType: String, // enum: ['text', 'image', 'file', 'gif'], default: 'text'
  replyTo: ObjectId (ref: 'Message')
}
```

##### Group Model (`backend/models/Group.js`)
```javascript
{
  name: String, // Required, trimmed
  participants: [ObjectId (ref: 'User')], // Required
  createdBy: ObjectId (ref: 'User'), // Required
  createdAt: Date, // Default: Date.now
  lastMessage: ObjectId (ref: 'Message'),
  lastMessageTime: Date,
  groupType: String // enum: ['direct', 'group'], default: 'group'
}
```

#### 2. API Routes (`backend/routes/chatRoutes.js`)

All routes require authentication and chat access middleware.

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/chat/groups` | Get user's groups | Authenticated users with chat access |
| POST | `/api/chat/groups` | Create new group | Authenticated users with chat access |
| GET | `/api/chat/groups/:groupId/messages` | Get group messages | Group participants only |
| POST | `/api/chat/messages` | Send message | Group participants only |
| PUT | `/api/chat/messages/:messageId/read` | Mark messages read | Group participants only |
| DELETE | `/api/chat/messages/:messageId` | Delete message | Message sender or chat moderator |

#### 3. Controller Logic (`backend/controllers/chatController.js`)

##### Group Management

**getUserGroups()**
- Retrieves all groups where user is a participant
- Populates participants, creator, and last message
- Sorts by last message time (descending)
- Returns: `{ success: true, data: groups[] }`

**createGroup()**
- Validates group name and participants
- Ensures all participants have 'developer' role
- Auto-adds creator to participants if not included
- Creates direct message if 2 participants, group chat otherwise
- Returns: `{ success: true, data: populatedGroup }`

##### Message Management

**getGroupMessages()**
- Verifies user is group participant
- Fetches messages with pagination (default: 50 per page)
- Populates sender, reply-to message, and nested data
- Auto-marks messages as read by current user
- Returns messages in chronological order

**sendMessage()**
- Validates user is group participant
- Validates reply-to message if provided
- Creates message with read receipt for sender
- Updates group's last message reference
- Returns: `{ success: true, data: populatedMessage }`

**deleteMessage()**
- Allows message sender or chat moderators to delete
- Performs soft delete (sets deleted: true)
- Returns: `{ success: true, message: 'Message deleted successfully' }`

**markMessagesRead()**
- Updates read receipts for all unread messages in group
- Adds current user to readBy array with timestamp

#### 4. Access Control (`backend/middleware/chatAccess.js`)

**chatAccessMiddleware**
- Verifies JWT token
- Checks if user has 'developer' role
- Ensures roles array compatibility
- Returns 403 if access denied

**chatModeratorMiddleware**
- Additional check for chat moderator permission
- Required for message deletion by non-senders

#### 5. Real-Time Communication (`backend/server.js`)

Socket.IO integration handles real-time events:

**Connection Events:**
- `join-groups`: Join user to group rooms
- `send-message`: Broadcast new messages to group members
- `delete-message`: Broadcast message deletions
- `typing`/`stop-typing`: Handle typing indicators
- `mark-read`: Broadcast read receipts

### Frontend Components

#### 1. Main Chat Component (`src/pages/Chat.tsx`)

##### State Management
```typescript
interface Message {
  _id: string;
  sender: { _id: string; name: string; email: string; avatar?: string };
  content: string;
  timestamp: string;
  messageType: 'text' | 'image' | 'file' | 'gif';
  media?: { type: string; url: string; filename?: string };
  readBy: Array<{ user: string; readAt: string }>;
  group: string;
  replyTo?: { _id: string; sender: { name: string }; content: string };
}

interface Group {
  _id: string;
  name: string;
  participants: Array<{ _id: string; name: string; email: string; avatar?: string }>;
  createdBy: { _id: string; name: string };
  lastMessage?: Message;
  lastMessageTime?: string;
  groupType: 'direct' | 'group';
}
```

##### Key State Variables
- `socket`: Socket.IO client instance
- `groups`: Array of user's groups
- `selectedGroup`: Currently active group
- `messages`: Messages for selected group
- `newMessage`: Input field value
- `typingUsers`: Array of currently typing users
- `replyTo`: Message being replied to
- `showCreateGroup`: Dialog visibility
- `availableUsers`: Users available for group creation

#### 2. Socket.IO Integration

**Connection Setup:**
```typescript
const newSocket = io(API_BASE_URL, {
  auth: { token: localStorage.getItem('token') }
});
```

**Event Listeners:**
- `new-message`: Handle incoming messages
- `message-deleted`: Handle message deletions
- `user-typing`/`user-stop-typing`: Handle typing indicators

#### 3. Message Handling

**Sending Messages:**
1. Create optimistic message for immediate UI update
2. Send to backend API
3. Replace optimistic message with real message on success
4. Emit to socket for real-time broadcast
5. Handle typing indicators (3-second timeout)

**Receiving Messages:**
1. Check for duplicates (prevent optimistic update conflicts)
2. Add to messages state
3. Update group's last message
4. Auto-scroll to bottom

#### 4. Group Management

**Creating Groups:**
1. Load available users with chat access roles
2. Validate group name and participant selection
3. Send creation request to backend
4. Add new group to local state on success

**Group Selection:**
1. Clear typing indicators
2. Load group messages
3. Join socket room for real-time updates

#### 5. UI Components

**Groups Sidebar:**
- Displays user's groups with last message preview
- Shows unread indicators
- Create new group dialog

**Chat Area:**
- Group header with participant count
- Message list with sender avatars
- Typing indicators
- Reply preview
- Message input with send button

**Message Features:**
- Reply to messages
- Delete own messages or as moderator
- Read receipts (blue dot indicator)
- Message timestamps
- Sender identification

## Operational Flow

### 1. User Authentication & Access
1. User logs in with valid credentials
2. JWT token contains user roles
3. Chat access verified via `chatAccessMiddleware`
4. Only users with 'developer' role can access chat features

### 2. Group Creation & Management
1. User selects "New Group" from sidebar
2. System loads available users with chat access
3. User provides group name and selects participants
4. Backend validates all participants have required roles
5. Group created and added to user's group list

### 3. Real-Time Messaging
1. User selects a group from sidebar
2. System loads message history via API
3. Socket.IO connection established for real-time updates
4. User types message with typing indicators
5. Message sent via API with optimistic UI update
6. Real-time broadcast to all group participants
7. Read receipts updated automatically

### 4. Message Interactions
1. Users can reply to specific messages
2. Messages can be deleted by sender or moderators
3. Typing indicators show when users are composing
4. Read receipts indicate message visibility

## Error Handling

### Backend Error Responses
- 401: Missing or invalid authentication token
- 403: Insufficient permissions or group access denied
- 404: Message or group not found
- 400: Invalid request data (malformed reply-to, etc.)
- 500: Internal server errors

### Frontend Error Handling
- API request failures show toast notifications
- Socket connection errors logged to console
- Optimistic updates reverted on send failures
- Graceful degradation for missing features

## Security Considerations

1. **Authentication**: All chat routes require valid JWT tokens
2. **Authorization**: Role-based access control ('developer' role required)
3. **Group Isolation**: Users can only access messages from groups they're participants in
4. **Message Ownership**: Users can only delete their own messages unless they're moderators
5. **Input Validation**: Message content and group data validated on backend
6. **Rate Limiting**: Consider implementing rate limiting for message sending

## Performance Optimizations

1. **Pagination**: Messages loaded in pages of 50
2. **Optimistic Updates**: Immediate UI feedback for better UX
3. **Socket Rooms**: Users only receive messages for joined groups
4. **Read Receipts**: Efficient bulk updates for message read status
5. **Lazy Loading**: Groups and messages loaded on demand

## Monitoring & Maintenance

### Logs
- Socket connection/disconnection events
- Message send/delete operations
- Group creation activities
- Authentication failures

### Health Checks
- Socket.IO connection status
- Database connectivity for chat models
- Real-time message delivery verification

### Database Indexes
- Groups: participants, createdBy
- Messages: group, timestamp (for efficient queries)

## Future Enhancements

1. **File Sharing**: Media upload and sharing capabilities
2. **Message Search**: Full-text search within conversations
3. **Push Notifications**: Browser notifications for new messages
4. **Message Reactions**: Emoji reactions to messages
5. **Voice Messages**: Audio recording and playback
6. **Message Encryption**: End-to-end encryption for sensitive chats
