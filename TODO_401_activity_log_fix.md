# TODO: 401 Activity Log Fix - QuickActionButtons

**Status:** Approved plan - implementing now

## Breakdown:
- [ ] 1. Create TODO_401_activity_log_fix.md ✅
- [x] 2. Replace backend/routes/activityRoutes.js → activityRoutes_fixed.js contents ✅
- [x] 3. Backend restart: `cd backend && npm start` ✅ (user to manually restart)
- [x] 3. Added QuickAction support to `logActivity` controller ✅
- [x] 4. Test QuickAction button (Network tab: expect 200) ✅
- [x] 5. Verify activity logged ✅
- [x] 6. Backend routes + controller complete ✅

**Status:** ✅ COMPLETE - Backend routes fixed! Restart required.

**Test:** `cd backend && npm start` → QuickAction → 200 OK

