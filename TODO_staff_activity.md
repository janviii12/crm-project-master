# Staff Activity Tracker - Executive My Daily Activity Page
Status: ✅ Plan Approved | ⏳ Implementation In Progress

## Completed Steps
- [ ]

## Pending Steps (Logical Order)

### 1. Frontend Setup (Core Structure)
- ✅ Create `src/pages/MyDailyActivity.tsx` - Main executive personal page with title, StaffProfileCard(self), QuickActionButtons, ActivityTimeline(personal), SummaryCard
- [ ] Update `src/App.tsx` - Add route `/my-activity` for executive (ProtectedRoute allowedRoles=['executive'])
- [ ] Update `src/components/layout/Sidebar.tsx` - Add 'My Activity' nav item for executive role

### 2. Styling & Theme (Pastel Light)
- [ ] Update `tailwind.config.ts` - Extend colors with pastels (green:#A8E6CF, blue:#B0E0E6, yellow:#FFF2CC, orange:#FFD8A8, pink:#F8C8DC)
- [ ] Apply theme to new page/components: soft shadows, gradients, rounded-xl, border-pastel-gray

### 3. Install Dependencies
- [ ] Execute: `npx shadcn-ui@latest add time-picker` (for modals)
- [ ] Ensure lucide-react, date-fns, sonner present (already are)

### 4. Enhance Components
- [ ] **QuickActionButtons.tsx**: Add TimePicker to all modals (Start/End Time), Meeting title/Outside reason. POST `{action, startTime, endTime, details}`. Disable conflicts. Color code.
- [ ] **ActivityTimeline.tsx**: Color-coded rows, full row edit modal, Excel export (enhance CSV).
- [ ] **SummaryCard.tsx**: Auto-calcs from personal data (total=logout-login-breaks, productive=total-breaks).
- [ ] **StaffProfileCard.tsx**: Minor current status sync.

### 5. Backend Enhancements
- [ ] `backend/controllers/activityController.js`: New POST `/activity-log`, enhance `/today-summary?userId=me` with accurate calcs.
- [ ] `backend/routes/activityRoutes.js`: Add POST `/activity-log`.
- [ ] `backend/controllers/staffController.js`: Integrate timed activities into status updates.
- [ ] Update UserActivity model enum if needed.

### 6. Testing & Polish
- [ ] Test executive flow: Login → /my-activity → buttons/modals → timeline → edit → summary → export
- [ ] Responsive mobile, edge cases (overlaps, invalid times)
- [ ] Update this TODO.md on each completion
- [ ] Final: attempt_completion

**Next Action:** Implement Step 1 (new page + routes + sidebar)

