# Testing the PR Portal - Step by Step

## 🧪 Complete Testing Guide

Follow these steps to verify your PR Portal is working perfectly.

---

## Prerequisites

✅ Flask application is running  
✅ You're logged into the admin panel  
✅ Doctor schedules are present in the system  

---

## Test 1: Access the Portal

### Steps:
1. Open admin panel in browser
2. Look at left sidebar
3. Find green button: **"🏥 Open PR Portal"**
4. Click it

### Expected Result:
✅ New page opens showing PR Portal  
✅ Sidebar shows 4 menu items:
   - Clinical Duty Roster (active)
   - Front Duty Roster (disabled/coming soon)
   - Staff Management
   - Station Knowledge Base  
✅ Main content shows "Clinical Duty Roster" view  

### If Failed:
- Check browser console for errors
- Verify `/pr-portal` route exists in app.py
- Check if CSS file is loading (inspect network tab)

---

## Test 2: Add Your First Staff Member

### Steps:
1. Click **"Staff Management"** in sidebar
2. Click **"➕ Add Staff Member"** button
3. Fill in form:
   - Name: "TEST STAFF"
   - Check: "Clinical Staff"
   - Select 2-3 stations
4. Click **"Save Staff"**

### Expected Result:
✅ Success notification appears (top-right)  
✅ Modal closes automatically  
✅ Staff card appears with:
   - Name: TEST STAFF
   - Blue badge: "clinical"
   - Stations listed
   - Edit and Delete buttons visible  

### If Failed:
- Check browser console for errors
- Verify `/api/pr/staff` POST route works
- Check `data/pr_staff.json` file permissions

---

## Test 3: View Station Knowledge Base

### Steps:
1. Click **"Station Knowledge Base"** in sidebar
2. Scroll through the page

### Expected Result:
✅ "Clinical Stations" section shows:
   - Doctor specialties (from your doctor portal)
   - Green dots next to each
   - "From Doctors" badge on each
✅ "Front Desk Stations" section (may be empty)  
✅ "➕ Add Custom Station" button visible  

### If Failed:
- Check if doctors have specialties in `data/doctors.json`
- Verify `/api/pr/stations` GET route works
- Check browser console

---

## Test 4: Add a Custom Station

### Steps:
1. In Station Knowledge Base view
2. Click **"➕ Add Custom Station"**
3. Fill in form:
   - Name: "Emergency Room"
   - Type: Clinical
   - Color: Red (#FF0000)
4. Click **"Save Station"**

### Expected Result:
✅ Success notification appears  
✅ Modal closes  
✅ New station appears in Clinical Stations list  
✅ Red dot next to "Emergency Room"  
✅ "Custom" badge on it  
✅ Delete button (🗑️) visible  

### If Failed:
- Check `/api/pr/stations` POST route
- Verify `data/pr_staff.json` is writable
- Check browser console

---

## Test 5: View Leave Legend

### Steps:
1. Click **"Clinical Duty Roster"** in sidebar
2. Look for "Leave Types Legend" section (below date controls)

### Expected Result:
✅ Legend shows all 15 leave types:
   - PML, AL, FRL, EXC, MI, OR, SWP, SWPL
   - NP, CL, AB, SL, ML, OC, AC
✅ Each has colored box  
✅ Shows both code and full name  
✅ Colors match the defined system  

### If Failed:
- Check `data/pr_staff.json` has `leave_types` section
- Verify JavaScript is loading legend data
- Check browser console

---

## Test 6: Load Empty Roster

### Steps:
1. In Clinical Duty Roster view
2. Select dates:
   - Start: Today
   - End: 7 days from today
3. Click **"Load Roster"**

### Expected Result:
✅ Placeholder disappears  
✅ Calendar table appears with:
   - Staff names on left (TEST STAFF visible)
   - Dates across top (7 columns)
   - Empty cells or dashes in grid  

### If Failed:
- Ensure at least 1 staff member exists
- Check `/api/pr/roster/clinical` GET route
- Verify date inputs are valid
- Check browser console

---

## Test 7: AI Generate Duty Roster

### Steps:
1. Make sure you have:
   - At least 3-4 staff members added
   - Doctor schedules for selected dates
2. Click **"🤖 Generate Duty (AI)"** button
3. Modal opens - verify dates
4. Click **"Generate Duty Roster"**
5. Wait for processing

### Expected Result:
✅ Button shows "⏳ Generating..." while processing  
✅ Success notification appears with stats:
   - "Successfully generated X assignments for Y days"
✅ Modal closes  
✅ Calendar refreshes automatically  
✅ Cells now show:
   - Green "ON DUTY" boxes with stations
   - Gray "OFF" boxes
   - Fair distribution visible  

### What to Check:
- No staff has more than 5 duties in a week
- Each staff has at least 2 OFF days
- No 4+ consecutive duty days
- Duties match doctor schedule days

### If Failed:
- Check if doctors are scheduled for selected dates
- Verify at least 3 staff with "clinical" role exist
- Check `/api/pr/roster/clinical/generate` POST route
- Look at browser console and server logs

---

## Test 8: Manually Edit a Cell

### Steps:
1. After roster is loaded
2. Click on any cell (e.g., TEST STAFF, Monday)
3. Modal opens: "Edit Duty Assignment"
4. Select:
   - Assignment Type: "On Duty"
   - Assigned Station: "Orthopaedics"
5. Click **"Save Assignment"**

### Expected Result:
✅ Success notification  
✅ Modal closes  
✅ Cell updates to show:
   - Green background
   - "ON DUTY"
   - "Orthopaedics" below  
✅ Change is immediate (no page refresh)  

### If Failed:
- Check `/api/pr/roster/clinical` POST route
- Verify JavaScript click handler is working
- Check browser console

---

## Test 9: Assign Leave

### Steps:
1. Click on a different cell
2. Modal opens
3. Select:
   - Assignment Type: "On Leave"
   - Leave Type: "AL - Annual Leave"
4. Click **"Save Assignment"**

### Expected Result:
✅ Cell updates to show:
   - Light green background (AL color)
   - "AL" text
   - Proper color from legend  
✅ Change persists after refresh  

### If Failed:
- Check if leave types are loaded
- Verify color mapping is correct
- Check browser console

---

## Test 10: Assign Off Day

### Steps:
1. Click on another cell
2. Select:
   - Assignment Type: "Off Day"
3. Click **"Save Assignment"**

### Expected Result:
✅ Cell shows:
   - Gray background
   - "OFF" text  
✅ Distinct from duty and leave cells  

---

## Test 11: Delete Staff

### Steps:
1. Go to Staff Management
2. Find TEST STAFF card
3. Click delete button (🗑️)
4. Confirm deletion

### Expected Result:
✅ Confirmation dialog appears  
✅ After confirming, staff card disappears  
✅ Success notification shows  

### If Failed:
- Check `/api/pr/staff/<id>` DELETE route
- Verify permissions
- Check browser console

---

## Test 12: Delete Custom Station

### Steps:
1. Go to Station Knowledge Base
2. Find "Emergency Room" (custom station)
3. Click delete button (🗑️)
4. Confirm

### Expected Result:
✅ Station disappears from list  
✅ Success notification  
✅ Doctor specialties remain (can't be deleted)  

---

## Test 13: Refresh Data

### Steps:
1. In Clinical Duty Roster view
2. Click **"🔄 Refresh"** button

### Expected Result:
✅ Roster reloads from server  
✅ All changes are reflected  
✅ No data loss  

---

## Test 14: Date Range Testing

### Steps:
1. Try different date ranges:
   - 1 day
   - 7 days
   - 14 days
   - 30 days
2. Load roster for each

### Expected Result:
✅ All ranges load correctly  
✅ Calendar scrolls horizontally if needed  
✅ No performance issues  
✅ Data persists across range changes  

---

## Test 15: Browser Compatibility

### Test In:
- Chrome/Edge
- Firefox
- Safari (if on Mac)
- Mobile browser

### Expected Result:
✅ Works in all browsers  
✅ Mobile shows responsive layout  
✅ Touch interactions work on mobile  
✅ No visual glitches  

---

## Test 16: Concurrent Users

### Steps:
1. Open PR Portal in 2 different browsers
2. Make a change in browser 1
3. Refresh in browser 2

### Expected Result:
✅ Changes appear in browser 2  
✅ No conflicts  
✅ Data stays consistent  

---

## Test 17: Data Persistence

### Steps:
1. Add staff, generate roster, make edits
2. Close browser completely
3. Restart Flask app
4. Open PR Portal again

### Expected Result:
✅ All staff still there  
✅ All roster assignments preserved  
✅ Custom stations remain  
✅ No data loss  

---

## Test 18: Error Handling

### Test These Error Cases:

#### A. Invalid Date Range:
- Start date after end date
- Expected: Warning notification

#### B. No Staff:
- Delete all staff
- Try to generate duty
- Expected: Error message

#### C. Empty Form:
- Try to save staff without name
- Expected: Validation error

#### D. Network Error:
- Stop Flask app
- Try to save
- Expected: Error notification

---

## Test 19: AI Intelligence Check

### Steps:
1. Add 5 staff members
2. Generate roster for 14 days
3. Analyze the results

### Verify:
✅ Each staff has 8-10 duties (not 14)  
✅ Everyone gets ~4 off days per week  
✅ No staff works 7 days straight  
✅ Specialties are distributed fairly  
✅ Workload is balanced across all staff  

### Manual Check:
- Count duties per staff per week
- Check for consecutive days > 3
- Verify 2+ off days per week per staff

---

## Test 20: Full Workflow

### Complete End-to-End Test:

1. ✅ Add 5 clinical staff
2. ✅ Add 2 custom stations
3. ✅ Generate 2-week roster
4. ✅ Mark 3 leave requests
5. ✅ Re-generate (should preserve leaves)
6. ✅ Edit 5 cells manually
7. ✅ Refresh and verify all changes
8. ✅ Export/print (visual check)
9. ✅ Delete 1 staff
10. ✅ Re-generate (should work with 4 staff)

---

## 🎯 Success Criteria

Your PR Portal is fully functional if:

✅ All 20 tests pass  
✅ No JavaScript errors in console  
✅ No Python errors in server logs  
✅ Data persists across sessions  
✅ UI is responsive and smooth  
✅ AI generates fair rosters  
✅ Manual edits work perfectly  
✅ All CRUD operations function  

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot read property of undefined"
**Solution**: Refresh page, clear browser cache

### Issue: Roster not loading
**Solution**: Check doctor schedules exist, verify staff have clinical role

### Issue: AI generates empty roster
**Solution**: Ensure doctors scheduled for dates, add more staff

### Issue: Styles not applying
**Solution**: Hard refresh (Ctrl+F5), check CSS file loaded

### Issue: Changes not saving
**Solution**: Check session is valid, verify file permissions

---

## 📊 Performance Benchmarks

### Expected Performance:

- **Page Load**: < 2 seconds
- **Roster Load**: < 1 second
- **AI Generation**: < 3 seconds (for 14 days)
- **Cell Edit**: < 500ms
- **Staff CRUD**: < 500ms

If slower, check:
- Large JSON files
- Slow disk I/O
- Network issues
- Too many staff/dates

---

## ✅ Final Checklist

Before considering testing complete:

- [ ] All 20 tests passed
- [ ] No console errors
- [ ] Data persists correctly
- [ ] AI generates fairly
- [ ] UI is responsive
- [ ] Cross-browser tested
- [ ] Mobile tested
- [ ] Documentation read
- [ ] Backup data files created
- [ ] Ready for production use

---

## 🎉 Congratulations!

If all tests pass, your PR Portal is **production-ready**!

**Next Steps:**
1. Train your PR staff
2. Import real staff data
3. Start using for actual scheduling
4. Collect feedback for improvements

**Enjoy your new system!** 🚀
