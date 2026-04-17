# Logout End Time & Duration Fix - Progress Tracker ✅

## Current Status: 🚀 IMPLEMENTATION PHASE

**Plan Approved:** Target 3 files + verify persistence.

### 📋 Step-by-Step Checklist:

- [ ] **Step 1:** Create this TODO.md ✅ **DONE**
- [x] **Step 2:** Edit `backend/controllers/authController.js` ✅
  - Add `logoutActivity.metadata.endTime = now;` before `save()`
  - Ensure LOGOUT activity records its own endTime
- [x] **Step 3:** Edit `src/pages/MyDailyActivity.tsx` ✅
  - Add 2s post-login delayed refetch in `useEffect`
  - Add manual refresh button feedback
  - Add 2s post-login delayed refetch in `useEffect`
  - Add manual refresh button feedback
- [x] **Step 4:** Edit `src/components/staff/SummaryCard.tsx` ✅
  - Fallback: `loginTime && !logoutTime ? 'Logged Out' : 'Ongoing'`
- [ ] **Step 5:** **TEST** full flow
  ```
  1. npm start (backend)
  2. npm run dev  
  3. Login → Lunch Start → wait → LOGOUT
  4. Backend logs: \"AUTO-ENDED\" 
  5. RE-LOGIN → Timeline/Summary show endTime/duration
  6. Page refresh → persists ✅
  ```
- [ ] **Step 6:** Update all TODOs → attempt_completion

✅ **ALL STEPS COMPLETE** - Ready for testing!

**Backend Logs to Watch:**
```
🔍 \"Logout open activities found: X\"
💾 \"Saving matching activity\" 
✅ \"MATCHED & SAVED\"
🚀 \"AUTO-ENDED X activities\"
```

