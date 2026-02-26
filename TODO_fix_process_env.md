# Fix process.env ReferenceError in Vite React App

## Problem
- Error: "Uncaught ReferenceError: process is not defined" in AuthContext.tsx and other files
- Cause: Using `process.env` which is not available in Vite (browser environment)
- Vite uses `import.meta.env` instead of `process.env`
- Environment variables must be prefixed with `VITE_` to be exposed to client-side code

## Steps to Fix
- [ ] Update .env file: Change `REACT_APP_API_BASE_URL` to `VITE_API_BASE_URL`
- [ ] Remove unnecessary `dotenv` import from AuthContext.tsx
- [ ] Replace `process.env.REACT_APP_API_BASE_URL` with `import.meta.env.VITE_API_BASE_URL` in all files:
  - [ ] src/contexts/AuthContext.tsx
  - [ ] src/pages/CustomerForm.tsx
  - [ ] src/pages/Customers.tsx
  - [ ] src/pages/MyTasks.tsx
  - [ ] src/pages/Dashboard.tsx
  - [ ] src/pages/CustomerDetails.tsx
  - [ ] src/pages/Chat.tsx
- [ ] Test the application to ensure no more process.env errors
