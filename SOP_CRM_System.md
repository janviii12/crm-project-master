# CRM System Standard Operating Procedure (SOP)

## 1. System Overview

The CRM (Customer Relationship Management) system is a comprehensive web-based application designed to manage customer registrations, document processing, workflow management, and real-time notifications. The system supports multiple user roles with specific permissions and features.

### Technology Stack
- **Frontend**: React + TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Node.js + Express, MongoDB, Socket.IO
- **Authentication**: JWT tokens with role-based access control
- **File Management**: Multer for uploads, support for images and PDFs
- **Real-time Communication**: Socket.IO for instant messaging and notifications
- **Notifications**: Real-time in-app notifications with polling mechanism

---

## 2. User Roles and Permissions

### 2.1 Admin Role
**Full system access with management capabilities**

**Permissions:**
- Complete user management (create, edit, delete users)
- Access to all customer data and documents
- Approve/reject customer applications
- Assign work to staff members
- Access audit logs (password-protected)
- Change audit password
- View system statistics and reports

**Key Features:**
- Role Management: Create/edit/delete users, assign roles
- Customer Management: Full CRUD operations on customer data
- Audit Logs: Password-protected access to document access logs
- System Settings: Profile and password management
- Notifications: Receive system-wide notifications for all activities

### 2.2 Staff Role
**Document processing and work assignment**

**Permissions:**
- View all customer submissions
- Approve/reject customer applications
- Assign approved work to Staff2 or Staff3
- Put applications on hold with remarks
- Send email notifications to customers
- View customer documents and details

**Key Features:**
- Customer Review: Approve/reject/hold applications
- Work Assignment: Delegate tasks to specialized staff
- Document Access: View and download customer files
- Communication: Send status update emails
- Notifications: Receive notifications for new customer registrations and status updates

### 2.3 Staff2/Staff3 Roles
**Specialized task execution**

**Permissions:**
- View assigned customer tasks
- Start work on assigned tasks
- Mark tasks as completed
- Send notifications to clients
- Access assigned customer documents

**Key Features:**
- Task Management: View "My Tasks" assigned by Staff
- Work Progress: Start and complete assigned work
- Client Communication: Send progress notifications
- Document Access: View customer files for processing
- Notifications: Receive notifications for task assignments and progress updates

### 2.4 Client Role
**Self-service customer portal**

**Permissions:**
- Submit registration forms with documents
- Track application status
- View next steps after approval
- Update profile information
- Change password

**Key Features:**
- Registration: Submit forms with document uploads
- Status Tracking: Monitor application progress
- Next Steps: View post-approval instructions
- Profile Management: Update personal information
- Notifications: Receive notifications for application status updates and approvals

### 2.5 Chat Roles
**Specialized communication roles for team collaboration**

#### DeveloperChatAccess Role
**Basic chat access for development team communication**

**Permissions:**
- Access to chat system
- Create and participate in group chats
- Send and receive messages
- View chat history
- Delete own messages

**Key Features:**
- Group Chat: Create and join development discussion groups
- Real-time Messaging: Instant communication with team members
- Message Management: Send, receive, and delete own messages
- Typing Indicators: See when others are typing
- Read Receipts: Visual confirmation of message delivery

#### DevLead Role
**Leadership access to chat system**

**Permissions:**
- All DeveloperChatAccess permissions
- Leadership-level communication access
- Group management capabilities
- Enhanced moderation features

**Key Features:**
- All DeveloperChatAccess features
- Team Leadership: Guide development discussions
- Project Coordination: Organize team communication
- Progress Tracking: Monitor team communication patterns

#### ChatModerator Role
**Full chat moderation and management capabilities**

**Permissions:**
- All chat access permissions
- Delete any message in moderated groups
- Manage group memberships
- Access to chat administration tools
- Monitor chat activity

**Key Features:**
- Message Moderation: Delete inappropriate or off-topic messages
- Group Management: Control group membership and settings
- Content Oversight: Ensure professional communication standards
- Activity Monitoring: Track chat usage and engagement
- Conflict Resolution: Handle communication disputes

---

## 3. Core Workflows

### 3.1 Customer Registration Process

#### Step 1: Client Registration
1. Client logs into the system
2. Navigates to "Begin Registration"
3. Fills out registration form:
   - Full Name
   - Email Address
   - Phone Number
   - Address
   - Service Type selection
4. Uploads required documents (JPG, PNG, PDF, max 5MB)
5. Submits application

#### Step 2: Application Review (Staff/Admin)
1. Staff/Admin views customer list in "Customers" page
2. Searches/filters customers by status, name, or email
3. Opens customer details to review submission
4. Reviews uploaded documents
5. Takes action:
   - **Approve**: Assigns to Staff2/Staff3 for processing
   - **Reject**: Denies application
   - **On Hold**: Pauses with remarks

#### Step 3: Work Assignment and Execution
1. Approved applications assigned to Staff2/Staff3
2. Assigned staff views "My Tasks" page
3. Starts work on assigned tasks
4. Processes customer documents
5. Sends progress notifications to clients
6. Marks tasks as completed

#### Step 4: Client Follow-up
1. Client tracks status in "Application Status" page
2. Upon approval, views "Next Steps" with detailed instructions
3. Receives email notifications at each stage

---

## 4. Module-Specific Procedures

### 4.1 Dashboard
**Available to all roles with role-specific content**

#### Admin/Staff Dashboard:
- Statistics: Total customers, verified documents, pending verifications, issues
- Recent Activity: Latest system actions
- Quick Actions: Common tasks for the role
- Notification Bell: Access to real-time notifications

#### Staff2/Staff3 Dashboard:
- Task Statistics: Assigned, in progress, completed tasks
- Task Overview: Current workload status
- Notification Bell: Access to real-time notifications

#### Client Dashboard:
- Application Statistics: Submitted, pending review, approved
- Status Overview: Current application state
- Notification Bell: Access to real-time notifications

### 4.2 Customer Management (Admin/Staff Only)

#### Viewing Customers:
1. Navigate to "Customers" page
2. Use search bar to find specific customers
3. Apply filters: All, Verified, Pending, Rejected, On Hold
4. Click "View Details" to see full customer information

#### Adding Customers (Manual):
1. Click "Add Customer" button
2. Fill required fields: Name, Email, Phone, Type
3. Upload documents if needed
4. Submit form

#### Customer Details Actions:
- **Approve**: Change status to verified, optionally assign staff
- **Reject**: Change status to rejected
- **On Hold**: Pause with remarks
- **Send Email**: Notify customer of status changes
- **Download Documents**: Access uploaded files

### 4.3 Task Management (Staff2/Staff3 Only)

#### Viewing Assigned Tasks:
1. Navigate to "My Tasks" page
2. View list of assigned customer work
3. See task status: Verified, In Progress, Completed

#### Task Workflow:
1. **Start Work**: Click "Start Work" on verified tasks
2. **Send Notifications**: Use dialog to send progress updates
3. **Mark Complete**: Click "Mark Complete" when finished
4. **View Details**: Access full customer information

### 4.4 Client Portal Procedures

#### Registration:
1. Login as client
2. Go to "Begin Registration"
3. Complete form with all required fields
4. Upload documents (max 5MB, JPG/PNG/PDF)
5. Submit and wait for processing

#### Status Tracking:
1. Visit "Application Status" page
2. View current status with visual indicators
3. See submission date and application ID
4. Refresh to get latest updates

#### Post-Approval:
1. Automatic redirect to "Next Steps" page
2. View detailed onboarding instructions
3. Contact information for account manager
4. Timeline for service activation

### 4.5 Role Management (Admin Only)

#### Creating Users:
1. Navigate to "Role Management"
2. Click "Add New User"
3. Enter name, email, and select role
4. User receives login credentials via email

#### Managing Users:
1. View user list with search and role filters
2. Edit user details and roles
3. Delete users (irreversible action)
4. View role statistics and permissions

#### Role Permissions Overview:
- **Admin**: Full system access
- **Staff**: Document approval and assignment
- **Staff2/Staff3**: Task execution
- **Client**: Self-service portal
- **DeveloperChatAccess**: Basic chat access for team communication
- **DevLead**: Leadership chat access with enhanced features
- **ChatModerator**: Full chat moderation and management

### 4.6 Audit Logs (Admin Only)

#### Accessing Logs:
1. Navigate to "Logs" page
2. Enter audit password (default: adminlogs123)
3. Rate limiting: 3 attempts, 2-hour lockout

#### Log Information:
- User details (name, role, ID)
- Action performed (Viewed/Downloaded)
- Document information
- Timestamp, IP address, device info

#### Security Features:
- Password protection with rate limiting
- Comprehensive audit trail
- IP and device tracking

### 4.7 Settings

#### Profile Management (All Roles):
1. Navigate to "Settings"
2. Update name and email
3. Upload/change avatar (max 2MB, JPG/PNG/GIF)
4. Save changes

#### Password Management (All Roles):
1. Enter current password
2. Set new password (complexity requirements)
3. Confirm new password
4. Update password

#### Audit Password (Admin Only):
1. Change audit log access password
2. Follow same complexity rules as regular passwords

### 4.8 Notifications

#### Accessing Notifications:
1. Click the notification bell icon in the header
2. View unread notifications with red badge indicator
3. Click on a notification to mark as read
4. Access full notification list via "View All" link

#### Notification Types:
- **New Customer Registration**: Staff/Admin notified of new submissions
- **Application Status Updates**: Clients notified of approval/rejection
- **Task Assignments**: Staff2/Staff3 notified of new tasks
- **Progress Updates**: Clients notified of task progress

#### Managing Notifications:
1. Navigate to "Notifications" page for full list
2. Use filters: All, Unread, Read
3. Search notifications by content
4. Mark individual or all notifications as read
5. Delete old notifications if needed

### 4.9 Chat System (DeveloperChatAccess, DevLead, ChatModerator Only)

#### Accessing Chat:
1. Navigate to "Chat" from the sidebar menu (role-based visibility)
2. View groups sidebar with recent conversations
3. Click on a group to open chat area
4. See real-time messages with timestamps and sender info

#### Creating Group Chats:
1. Click "New Group" button in chat interface
2. Enter group name
3. Select participants from user list using checkboxes
4. Click "Create Group" to establish the chat

#### Messaging Features:
1. **Send Messages**: Type in input field and press Enter
2. **Real-time Updates**: Messages appear instantly for all participants
3. **Typing Indicators**: See when others are composing messages
4. **Read Receipts**: Visual confirmation when messages are read
5. **Message History**: Scroll to view previous conversations

#### Message Management:
1. **Delete Own Messages**: Click delete icon on your messages
2. **Moderator Deletion**: ChatModerators can delete any message
3. **Content Moderation**: Moderators ensure professional communication

#### Group Management (DevLead/ChatModerator):
1. View group membership and activity
2. Monitor communication patterns
3. Ensure appropriate content standards
4. Handle communication disputes if needed

#### Best Practices for Chat Usage:
- Use professional language in all communications
- Keep discussions relevant to work topics
- Respect team members' time and availability
- Report inappropriate content to moderators
- Use group chats for team coordination, not personal matters

### 4.10 Task Management (Admin/Staff Only)

#### Overview Dashboard:
1. Navigate to "Task Management" page
2. View statistics: Total tasks, staff members, completion rates
3. Monitor task assignments and progress
4. Track monthly task completion metrics

#### Task Assignment:
1. View list of verified customers awaiting assignment
2. Select unassigned tasks from the table
3. Choose staff member from dropdown (Staff2/Staff3 roles)
4. Click "Assign" to delegate work
5. System automatically notifies assigned staff

#### Task Monitoring:
1. Track assigned tasks with progress indicators
2. View staff workload and completion status
3. Monitor task assignment dates and progress
4. Generate reports on task completion rates

#### Staff Management:
1. View available staff members and their roles
2. Monitor staff utilization and performance
3. Reassign tasks if needed for load balancing
4. Track staff assignment history

### 4.11 Access Control

#### Unauthorized Access Handling:
1. System automatically redirects unauthorized users
2. Displays "Access Denied" page with clear messaging
3. Provides link to return to dashboard
4. Logs unauthorized access attempts for security review

#### Permission Verification:
1. All pages check user roles before rendering
2. Protected routes validate permissions on access
3. Real-time permission checks prevent unauthorized actions
4. Clear error messages guide users to appropriate sections

---


## 5. Security and Compliance

### 5.1 Authentication
- JWT token-based authentication
- Automatic logout on token expiry
- Secure password hashing with bcrypt

### 5.2 File Security
- File type validation (JPG, PNG, PDF)
- File size limits (5MB for uploads, 2MB for avatars)
- Secure file storage and access
- Audit logging for all file access

### 5.3 Data Protection
- Role-based data access control
- Encrypted password storage
- Secure API endpoints with authentication
- Input validation and sanitization

### 5.4 Audit Trail
- Comprehensive logging of user actions
- Document access tracking
- IP address and device information
- Password-protected audit log access

---

## 6. System Maintenance

### 6.1 User Management
- Regular review of user roles and permissions
- Inactive user cleanup
- Password policy enforcement

### 6.2 Data Management
- Regular backup of customer data and documents
- File storage monitoring and cleanup
- Database performance optimization

### 6.3 Security Updates
- Regular password changes
- Audit log monitoring
- Security patch application

---

## 7. Troubleshooting

### 7.1 Common Issues

#### Login Problems:
- Verify email and password
- Check account status with admin
- Clear browser cache and cookies

#### File Upload Issues:
- Check file size (max 5MB)
- Verify file type (JPG, PNG, PDF)
- Ensure stable internet connection

#### Permission Errors:
- Verify user role and permissions
- Contact admin for role updates
- Check if account is active

#### Chat Connection Issues:
- Refresh the chat page
- Check internet connection stability
- Verify chat role permissions with admin
- Clear browser cache if messages don't load

#### Task Assignment Problems:
- Refresh the Task Management page
- Verify staff member availability
- Check if customer is in verified status
- Contact admin if assignment fails

#### Application Status Not Updating:
- Refresh the page
- Contact staff/admin for manual status check
- Check email for notifications

### 7.2 Support Contacts
- **Technical Issues**: System administrator
- **Account Problems**: Role management admin
- **Process Questions**: Department supervisor

---

## 8. Best Practices

### 8.1 Data Entry
- Always verify customer information before submission
- Use consistent naming conventions
- Upload clear, readable documents

### 8.2 Communication
- Send timely notifications to customers
- Use clear, professional language in communications
- Maintain detailed remarks for status changes

### 8.3 Security
- Never share login credentials
- Change passwords regularly
- Log out when not using the system
- Report suspicious activities immediately

### 8.4 Efficiency
- Use search and filter functions effectively
- Process applications in timely manner
- Keep customer communications updated
- Regular system usage monitoring

---

## 9. System Limits and Constraints

### 9.1 File Upload Limits
- Document uploads: 5MB maximum
- Avatar uploads: 2MB maximum
- Supported formats: JPG, PNG, PDF, GIF

### 9.2 Rate Limiting
- Audit log access: 3 attempts, 2-hour lockout
- API requests: Standard rate limiting applied

### 9.3 Data Validation
- Email format validation
- Phone number format (digits only)
- Password complexity requirements
- Required field validation

### 9.4 User Limits
- No specific user count limits
- Role-based feature restrictions
- Concurrent session management

---

## 10. Change Management

### 10.1 System Updates
- All system changes documented
- User training provided for new features
- Backward compatibility maintained

### 10.2 Process Changes
- SOP updates with process modifications
- User communication for procedural changes
- Training sessions for complex changes

### 10.3 Emergency Procedures
- System downtime communication
- Data backup and recovery procedures
- Alternative workflow documentation

---

This SOP should be reviewed annually and updated as the system evolves or new features are added. All users should receive training on relevant sections of this document.