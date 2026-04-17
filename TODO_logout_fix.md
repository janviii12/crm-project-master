# Logout End Time & Duration Fix Tracker

## Status: 🟡 In Progress (0/4 complete)

### Steps:
- [x] 1. Edit src/contexts/AuthContext.tsx - Fix logout URL to '/api/auth/logout'
- [x] 2. Backend server restart command
- [ ] 3. Test activity end → logout (verify no "ongoing")
- [ ] 4. Test login → logout (verify endTime/duration appears)
- [ ] 5. Complete task & cleanup TODO

**Current Issue**: Frontend calls `/api/logout` (404) instead of `/api/auth/logout`."
</xai:function_call > 

Now implementing step 1: Fix AuthContext.tsx logout URL. 

Reading current file first for exact edit...

**Note**: File path `src/contexts/AuthContext.tsx` from error trace. Proceeding with edit using exact diff match. 

<xai:function_call name="read_file">
<parameter name="path">src/contexts/AuthContext.tsx
