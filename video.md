# CRM System Tutorial Video Script

## Login Process

**What credentials are used (email/password, phone/OTP, etc.)?**
- Email and password authentication.

**After login, which page opens first (Dashboard, Leads, etc.)?**
- Dashboard page opens first after successful login.

## Main Modules / Sidebar Items
(List all major sections visible on sidebar, e.g. Dashboard, Leads, Clients, Follow-ups, Quotations, Tasks, Reports, Settings...)

- Dashboard
- Customers (Leads)
- Interactions
- Calendar
- Quotations
- Task Management
- My Tasks
- Notepad
- Begin Registration (for clients)
- Application Status (for clients)
- Next Steps (for clients)
- Chat (for developers)
- Role Management (for admins)
- Logs (for admins and developers)
- Notifications
- Settings

## Dashboard Overview

**What kind of data or widgets are shown? (e.g. total leads, converted leads, charts, etc.)**

For Admin/Manager:
- Total Customers
- Verified Documents
- Pending Verifications
- Issues (rejected/on_hold)
- Server Status Panel
- User Role Indicators
- Live Activity Feed
- Security Alerts
- Recent Activity
- Quick Actions

For Executive:
- Assigned Tasks
- In Progress
- Completed

For Client:
- Submitted Forms
- Pending Review
- Approved

## Leads Section (Customers)

**What info is required to add a lead?**
- Name (required)
- Email (required)
- Phone (required)
- Type of Work/Service (required)
- File upload (optional)

**What actions can users perform (add, edit, delete, assign, change status, etc.)?**
- Add new customer/lead
- View customer details
- Update status
- Assign work to staff
- Reassign tasks
- Search and filter customers
- Pagination for large lists

**Status options available?**
- Pending
- Verified
- Rejected
- On Hold
- In Progress
- Completed

## Follow-ups Section

**How do users add a follow-up?**
- Create follow-up with title, description, date, time, priority, and optional client association.

**Any automatic reminders or notifications?**
- Yes, automatic reminders are triggered based on reminderBefore setting (default 30 minutes).
- In-app notifications and real-time alerts via socket.io.

**Fields (date, notes, next call, etc.)?**
- Client ID (optional, for linking to leads)
- Title
- Description (notes)
- Date
- Time
- Reminder Before (minutes)
- Priority (low, medium, high)

## Clients Section

**What info do you store for clients?**
- Name
- Email
- Phone
- Type of service
- Address
- Status
- Assigned staff
- Remarks
- Submission history
- Files/documents

**Any document upload or project tracking?**
- Yes, document upload is supported with multiple files per client.
- Project tracking via status updates, assigned staff, and reassignment history.

## Quotations / Billing Section

**Process to generate a quotation?**
- Create quotation with service details, base amount, GST percentage, and generate unique quotation number.

**Is there a downloadable PDF or send-by-email option?**
- Yes, downloadable PDF with professional formatting including company branding.

**What fields are included (service name, price, GST, etc.)?**
- Quotation Number (auto-generated)
- Service Key/Title
- Documents required
- Steps involved
- Timeframe
- Base Amount
- GST Percentage (default 18%)
- Total Amount
- Notes
- History of edits

## Tasks / Reminders Section

**What type of tasks can be created?**
- Follow-up tasks with scheduling and reminders.

**Are they linked to leads or standalone?**
- Can be linked to specific clients/leads or created as standalone tasks.

## Reports / Analytics Section

**What kind of reports are shown? (performance, conversion, date range filters, etc.)**
- Dashboard provides basic analytics with customer stats, task progress, and activity feeds.
- Date-based filtering available for follow-ups and customer data.

## Settings / User Management

**What can a user or admin do here? (profile update, password change, add team member, assign roles, etc.)**
- Profile update (name, email)
- Password change
- Avatar upload
- Add new users/team members
- Assign roles (admin, manager, executive, client, developer)
- Update user roles and permissions

## Any Other Features
(e.g. Notifications, Chat, File upload, Notes, WhatsApp integration, etc.)

- Notifications: In-app notifications for status updates, assignments, and reminders
- Chat: Real-time chat functionality for developers
- File Upload: Support for document uploads in customer forms and quotations
- Notes: Notepad feature for taking notes
- Activity Logging: Comprehensive logging of user actions
- Email Notifications: Automated emails for status updates and welcome messages
- Role-based Access Control: Different permissions based on user roles
- Real-time Updates: Socket.io integration for live notifications and activity feeds
- Security Features: Audit logs, activity monitoring, and security alerts

## Preferred Language for Script
Pure English
