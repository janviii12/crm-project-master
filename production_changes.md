# Production Deployment Changes

This file lists the locations where you need to make changes to switch from localhost to production URLs. Comment out the old values and add the new ones as specified.

## Frontend Changes (src/)

### 1. **File: src/contexts/AuthContext.tsx**
   - Line: `axios.defaults.baseURL = 'http://localhost:5000';`
   - Change to:
     ```
     // axios.defaults.baseURL = 'http://localhost:5000'; // OLD
     axios.defaults.baseURL = 'https://growup-india.cloud/api';
     ```

### 2. **File: src/pages/CustomerDetails.tsx**
   - Multiple instances of `http://localhost:5000` in API calls
   - Change all to: `https://growup-india.cloud/api`

### 3. **File: src/pages/Customers.tsx**
   - Multiple instances of `http://localhost:5000` in API calls
   - Change all to: `https://growup-india.cloud/api`
   ## done

### 4. **File: src/pages/Logs.tsx**
   - Multiple instances of `http://localhost:5000` in API calls
   - Change all to: `https://growup-india.cloud/api`



### 5. **File: src/pages/MyTasks.tsx**
   - Multiple instances of `http://localhost:5000` in API calls
   - Change all to: `https://growup-india.cloud/api`




### 6. **File: src/pages/NextSteps.tsx**
   - Instance of `http://localhost:5000` in API call
   - Change to: `https://growup-india.cloud/api`

### 7. **File: src/pages/RoleManagement.tsx**
   - Multiple instances of `http://localhost:5000` in API calls
   - Change all to: `https://growup-india.cloud/api`

### 8. **File: src/pages/Settings.tsx**
   - Multiple instances of `http://localhost:5000` in API calls and image URLs
   - Change all to: `https://growup-india.cloud/api`



### 9. **File: src/pages/TaskManagement.tsx**
   - Multiple instances of `http://localhost:5000` in API calls
   - Change all to: `https://growup-india.cloud/api`

### 10. **File: src/pages/Dashboard.tsx**
   - Instance of `http://localhost:5000` in API call
   - Change to: `https://growup-india.cloud/api`


### 11. **File: src/pages/CustomerForm.tsx**
   - Instance of `http://localhost:5000` in API call
   - Change to: `https://growup-india.cloud/api`



### 12. **File: src/pages/Chat.tsx**
   - Multiple instances of `http://localhost:5000` in API calls and socket connection
   - Change all to: `https://growup-india.cloud/api`
   - Socket connection: `io('http://localhost:5000', ...)` → `io('https://growup-india.cloud', ...)`



### 13. **File: src/pages/BeginRegistration.tsx**
   - Instance of `http://localhost:5000` in API call
   - Change to: `https://growup-india.cloud/api`



### 14. **File: src/pages/ApplicationStatus.tsx**
   - Instance of `http://localhost:5000` in API call
   - Change to: `https://growup-india.cloud/api`



### 15. **File: src/contexts/NotificationContext.tsx**
   - Multiple instances of `http://localhost:5000` in API calls
   - Change all to: `https://growup-india.cloud/api`

   

### 16. **File: src/components/layout/Sidebar.tsx**
   - Instance of `http://localhost:5000` in API call
   - Change to: `https://growup-india.cloud/api`

## Backend Changes (backend/)

### 1. **File: backend/server.js**
   - For Socket.IO configuration:
     - Old: `origin: "http://localhost:8080"`
     - New: `origin: "https://growup-india.cloud"`
     - Comment out the old origin and add the new one.

Note: The CORS middleware in server.js currently has no options (just `app.use(cors());`), so it may not need changes unless you want to restrict origins.
