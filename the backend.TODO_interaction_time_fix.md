# TODO: Fix Interaction Time (05:30:00 Issue)

## Task
Make the interaction time dynamic instead of fixed at 05:30:00

## Root Cause
The frontend only sends the `date` field to the backend, not the `time` field. When JavaScript parses "2024-01-15" as UTC midnight, it appears as 05:30:00 in IST timezone.

## Plan

### Step 1: Update InteractionForm.tsx
- [x] Combine date + time fields before sending for new interactions (FormData)
- [ ] Combine date + time fields before sending for updates (JSON)

### Step 2: Test the fix
- [ ] Verify new interactions save with correct time
- [ ] Verify editing interactions preserves the time

## Changes Made
1. In `src/components/InteractionForm.tsx`:
   - For new interactions: Combine `formData.date` and `formData.time` into a single datetime string
   - For updates: Same combination logic
