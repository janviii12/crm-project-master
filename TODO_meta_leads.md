# Meta Ads Leads Webhook Integration

## Steps:

✅ 1. **Lead.js** ✓

✅ 2. **leadsRoutes.js** ✓

✅ 3. **server.js updated** ✓

[ ] 4. **Add to backend/.env**: `META_VERIFY_TOKEN=my_secret_token`

[ ] 5. **Restart**: `cd backend && npm start`

[ ] 6. **Test**:
  - GET: `curl \"http://localhost:5000/api/leads?hub.mode=subscribe&hub.verify_token=my_secret_token&hub.challenge=abc123\"`
  - POST: `curl -X POST -H \"Content-Type: application/json\" -d @payload.json http://localhost:5000/api/leads`

**Ready for testing!**

