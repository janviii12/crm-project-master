# Typing Indicator Fix - Persistent Indicator Issue

## Issue Summary
The typing indicator ("mayank is typing...") appears when a user starts typing but does not disappear when they stop. It remains visible until the page is refreshed.

## Root Cause
The frontend's 'user-stop-typing' event listener has flawed logic for removing users from the typingUsers array, relying on unavailable data and incorrect comparisons.

## 🔧 Tasks

### 1. Update typingUsers State Structure
- [x] Change typingUsers from `string[]` to `{ userId: string, username: string }[]` for proper tracking

### 2. Fix 'user-typing' Event Listener
- [x] Store both userId and username when someone starts typing
- [x] Prevent duplicates in typingUsers array

### 3. Fix 'user-stop-typing' Event Listener
- [x] Remove user from typingUsers based on userId match
- [x] Remove the broken logic using availableUsers

### 4. Update UI Display
- [x] Modify the typing indicator display to use usernames from the new structure

### 5. Add Group Switch Cleanup
- [x] Clear typingUsers when selectedGroup changes to prevent stale indicators

## ✅ Follow-Up Testing
- [ ] Test typing indicators between multiple users
- [ ] Verify indicators disappear after 3 seconds of inactivity
- [ ] Confirm no persistent indicators after group switches
