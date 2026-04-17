# Activity End Time Persistence Fix - Progress Tracker

## Current Status: ✅ COMPLETED

**Problem:** After logout/login, ended activities (lunch/meeting/outside_work) show as \"ongoing\" again.

**Root Cause:** Logout doesn\\'t auto-end open _start activities → DB keeps metadata.endTime=null → timeline shows \"Ongoing\".

**Solution:** Auto-end ALL open activities on logout → update metadata.endTime=logoutTime.

---

## ✅ Step 1: Create this TODO.md [COMPLETED]

## ✅ Step 2: Edit backend/controllers/authController.js [COMPLETED]
```
✅ Added auto-end logic to logoutUser():
- Finds open: lunch_start/meeting_start/outside_work_start (24h, endTime=null)  
- Updates: metadata.endTime=logoutTime, duration=minutes
- Emits: 'activity-updated' to user/admin/manager rooms
- Logs: "🚀 AUTO-ENDED X activities" + status_change record
```
**File:** backend/controllers/authController.js ✅

## 🧪 Step 3: Test Flow [🔍 DEBUG MODE]
```
🚨 USER FEEDBACK: \"On logout, end time/duration removed → ongoing\"

1. Backend restart: cd backend && npm start  
2. http://localhost:5173/my-daily-activity
3. MANUAL END first: Start Lunch → End Lunch → Verify ✅ endTime shown
4. Logout → **Check terminal:** "🚀 AUTO-ENDED X" OR nothing (expected if already ended)
5. Login → **CRITICAL:** Timeline shows correct endTime? Network /api/activities?

Please copy/paste:
- Backend logs during logout
- Network → /api/activities response post-login
- DevTools Console → any errors?
```
**Status:** ✅ Fixed - logout auto-ends open activities with endTime/duration persisted + UI refetch on login.

## 🚀 Step 4: Verify & Complete [Pending]
- Backend logs show auto-end actions
- No regressions on manual end buttons
- Update this TODO ✅

**Demo:** `npm run dev` → test logout/login flow ✨

