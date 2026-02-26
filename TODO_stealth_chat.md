# DevLead-Only Hidden Chat Feature Implementation

## Backend Implementation
- [ ] Add `stealthAccess` boolean field to User model
- [ ] Create `backend/controllers/stealthController.js` with unlock logic and token generation
- [ ] Create `backend/routes/stealthRoutes.js` with POST `/api/stealth/unlock` endpoint
- [ ] Add in-memory stores for ephemeral tokens and messages in server.js
- [ ] Create Socket.IO namespace `/stealth-chat` with token validation middleware
- [ ] Update user management routes to prevent admin from seeing/assigning stealthAccess
- [ ] Ensure only DevLead role can assign stealthAccess to developers

## Frontend Implementation
- [ ] Modify `src/pages/Calendar.tsx` to detect clicks on 14 Feb 2025 date cell and reveal hidden pin input
- [ ] Create `src/pages/StealthChat.tsx` component (similar to Chat.tsx but for stealth namespace)
- [ ] Update `src/components/layout/Sidebar.tsx` to conditionally show "Stealth Chat" link when unlocked
- [ ] Modify `src/pages/RoleManagement.tsx` to hide stealthAccess controls from admin users

## Security & Ephemeral Features
- [ ] Server validates JWT and checks stealthAccess or DevLead role
- [ ] Generate cryptographically secure tokens with 5-minute expiry
- [ ] Implement token cleanup mechanism
- [ ] Stealth messages stored in-memory only (no DB persistence)
- [ ] Skip all createLog() calls for stealth operations

## Testing & Validation
- [ ] Test DevLead unlock flow and chat functionality
- [ ] Verify admin cannot access stealth features
- [ ] Test token expiry and cleanup
- [ ] Validate multi-user stealth chat operations
