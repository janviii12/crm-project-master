# QuickAction Timeline Display Fix

**Goal:** **SINGLE ROW** - Start → Add row | End → Update SAME row (endTime under startTime)

**Current issue:** End creates new row instead of updating

**Plan:**
1. **backend/controllers/activityController.js** → Update-only for `_end`
2. QuickActionButtons → Pass `activityId` on end 
3. Timeline → `startTime` | `endTime` (sub-line) | Duration

**Model:** UserActivity (existing)

**Steps:**
- [x] 1. Controller: `_end` → UPDATE open activity ✅ (auto-matches by user + type + no endTime)
- [x] 2. QuickActionButtons: No change needed (controller finds automatically)
- [ ] 3. Timeline: Layout "Start ↓ End | Duration" 
- [ ] 4. Backend restart + test

Proceed?

