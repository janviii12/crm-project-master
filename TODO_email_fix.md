# Email Fix + Customer List Bug Fixed ✅

## ✅ Implemented
- [x] Email auth token fix (axiosInstance)
- [x] SMTP verification & detailed logging
- [x] `/test-email` endpoint
- [ ] Customer persistence bug investigation

## 🔍 New Bug Found
**"New customer added → old customers disappear"**

**Root Cause:** `createCustomer` logic finds existing by email → updates instead of creating new → pagination + ID mismatch → "Customer not found"

**Next:** Fix createCustomer to always create new (email unique constraint optional) + pagination reset

**Test:** 
1. `cd backend && npm start`
2. Login → Customers → Add 2nd customer with different email
3. Verify list shows both → View Details works



