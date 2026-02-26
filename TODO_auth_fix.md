# Authentication and Token Refresh Fixes

## Issues Identified:
1. **Chat.tsx not using axiosInstance**: Chat component uses plain `axios` instead of `axiosInstance`, bypassing token attachment and refresh logic.
2. **Incorrect refresh endpoint URL**: axiosInstance calls `/api/refresh-token` but backend route is `/refresh-token`.
3. **Inconsistent token management**: AuthContext sets axios defaults but axiosInstance is separate.
4. **Refresh failure handling**: Redirects to login without clearing AuthContext state.

## Fixes Needed:
- [ ] Update Chat.tsx to use axiosInstance for all API calls
- [ ] Fix refresh endpoint URL in axiosInstance
- [ ] Improve refresh failure handling to use AuthContext logout
- [ ] Ensure consistent token management across the app
- [ ] Test token refresh flow for /api/chat/groups and /api/notifications endpoints

## Files to Modify:
- src/pages/Chat.tsx
- src/lib/axiosInstance.ts
- src/contexts/AuthContext.tsx (minor updates)
