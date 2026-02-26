# Refresh Token Debug TODO

## Issue
User gets logged out when entering audit password in logs.tsx, likely due to refresh token expiration during API calls.

## Steps to Complete
- [x] Add 2-second delay in refreshToken function for better log visibility
- [x] Verify axiosInstance configuration (withCredentials: true ✓, baseURL: API_BASE_URL ✓, interceptor logs: detailed ✓)
- [x] Check backend CORS setup (credentials: true ✓, origins include localhost:8081 ✓)
- [x] Validate refresh token cookie setup (httpOnly: true ✓, sameSite: 'lax' for localhost ✓, secure: false ✓, path: '/' ✓)
- [x] Fixed cookie configuration issue - restored NODE_ENV conditional logic for production deployment
- [ ] Test logs page access and check console logs
- [ ] Verify refreshToken cookie exists in browser dev tools
- [ ] If refresh fails, investigate CORS/cookie configuration
