# Role Rename and Permission Update Plan

## Information Gathered
- Current roles in User model: ['admin', 'staff', 'staff2', 'staff3', 'client', 'DeveloperChatAccess', 'DevLead', 'ChatModerator']
- System uses role-based access control throughout backend middleware, routes, and frontend components
- Frontend displays role statistics and permissions in RoleManagement.tsx
- Sidebar navigation filters based on roles
- Dashboard shows different stats based on roles
- Chat system has specific role requirements

## Plan
### Backend Changes
1. **User Model Update**
   - Update validation to new roles: ['admin', 'manager', 'executive', 'client', 'developer']
   - Add boolean flags: isDevLead, isChatModerator for developer role variations
   - Update schema to include these new fields

2. **Middleware Updates**
   - Update chatAccess.js to use new developer roles
   - Update staffRoutes.js to use 'manager' and 'executive'
   - Update adminRoutes.js (no change needed)
   - Update auth.js (no change needed)

3. **Controller Updates**
   - Update userController.js getStaffUsers to return 'manager' and 'executive'
   - Update chatController.js to use new developer roles

4. **Route Updates**
   - Update any hardcoded role checks in routes

### Frontend Changes
5. **Role Management Page**
   - Update availableRoles array to new roles
   - Update role statistics display
   - Update permission descriptions
   - Update role colors and icons

6. **Sidebar Navigation**
   - Update menuItems roles to use new role names
   - Update role display in header

7. **Dashboard**
   - Update role checks to use new roles
   - Update stats logic for managers and executives

8. **Other Components**
   - Update any role-based logic in other components

### Database Migration
9. **User Role Migration**
   - Create migration script to update existing users:
     - 'staff' → 'manager'
     - 'staff2' → 'executive'
     - 'staff3' → 'executive'
     - 'DeveloperChatAccess' → 'developer'
     - 'DevLead' → 'developer' + isDevLead: true
     - 'ChatModerator' → 'developer' + isChatModerator: true

## Dependent Files to be Edited
- backend/models/User.js
- backend/middleware/chatAccess.js
- backend/routes/staffRoutes.js
- backend/controllers/userController.js
- backend/controllers/chatController.js
- src/pages/RoleManagement.tsx
- src/components/layout/Sidebar.tsx
- src/pages/Dashboard.tsx
- Migration script for database

## Followup Steps
- Run database migration to update existing users
- Test all role-based access after changes
- Update any documentation or SOP files
- Verify chat functionality with new developer roles
