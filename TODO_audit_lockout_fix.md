# Audit Password Lockout Fix

## Issue
- Current system allows 3 failed attempts before 2-hour lockout (120 minutes)
- User mistakenly entered wrong password and is now locked out for 120 minutes
- Need to reduce severity: change to 1 attempt with 5-minute lockout

## Changes Needed
- [x] Update logController.js: change attempts threshold from 3 to 1
- [x] Update logController.js: change lockout time from 2 hours to 5 minutes
- [x] Update messages to reflect 1 attempt remaining
- [x] Reset user attempts using resetAuditAttempts.js script

## Files to Edit
- backend/controllers/logController.js

## Followup
- [x] Reset user attempts if needed (run script to set auditAttempts=0)
- [x] Verify lockout behavior
