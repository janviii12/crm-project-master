# Switchable Real-Time Graph Dashboard for Developer Portal

## Information Gathered
- Current ServerStatusPanel shows status cards for API health, DB, Socket.IO, uptime, memory, CPU, build version
- Backend has /api/admin/server-status endpoint returning current metrics
- Recharts library is already installed in package.json
- Auto-refresh happens every 30 seconds via setInterval
- Dashboard.tsx renders ServerStatusPanel for users with developer role or isDevLead flag
- Socket.IO integration exists for real-time updates

## Plan
### Backend Changes
- Add new endpoint `/api/server-stats` in adminRoutes.js
- Return data structure: {timestamp, cpu, ram, apiLatency, uptime}
- Ensure developer access control

### Frontend Changes
- Modify ServerStatusPanel.tsx to add view toggle
- Add viewMode state: "status" | "graph"
- Status View: Keep existing cards layout
- Graph View: Implement Recharts LineChart/AreaChart
- Add metric switching via tabs/dropdown (API Latency, CPU, RAM, Uptime)
- Store historical data in local state array
- Update data every 30 seconds, maintain last 50 data points
- Add "Last updated: X seconds ago" label
- Smooth fade transition between views
- Color indicators for thresholds (green/yellow/red)

## Dependent Files to Edit
- backend/routes/adminRoutes.js: Add /api/server-stats endpoint
- src/components/dashboard/ServerStatusPanel.tsx: Major refactor for toggle and graphs

## Followup Steps
- Test new backend endpoint returns correct data
- Test graph rendering with sample data
- Test auto-refresh functionality
- Test metric switching tabs/dropdown
- Test responsive design on different screen sizes
- Test smooth transitions between views
- Verify Socket.IO integration still works
- Check performance with data accumulation
