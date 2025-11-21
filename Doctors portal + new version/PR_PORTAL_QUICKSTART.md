# PR Portal - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Access the Portal
1. Start your Flask application
2. Login to admin panel
3. Click **"🏥 Open PR Portal"** in the sidebar (green button)

### Step 2: Add Your First Staff Member
1. Click **"Staff Management"** in the left navigation
2. Click **"➕ Add Staff Member"**
3. Fill in:
   - **Name**: e.g., "SAINA"
   - **Role**: Check "Clinical Staff"
   - **Stations**: Select relevant specialties (Orthopaedics, etc.)
4. Click **"Save Staff"**

### Step 3: Review Stations
1. Click **"Station Knowledge Base"**
2. You'll see:
   - **Clinical Stations**: Auto-imported from doctor specialties
   - **Custom stations** you can add
3. Add custom station if needed:
   - Click **"➕ Add Custom Station"**
   - Enter name (e.g., "Emergency")
   - Select type: Clinical or Front Desk
   - Choose color
   - Save

### Step 4: Generate Your First Roster
1. Go back to **"Clinical Duty Roster"**
2. Select dates (e.g., today to next week)
3. Click **"🤖 Generate Duty (AI)"**
4. Confirm the date range
5. Click **"Generate Duty Roster"**
6. ✅ Done! Your roster is created automatically

### Step 5: Make Manual Adjustments
1. Click any cell in the roster calendar
2. Choose assignment type:
   - **On Duty**: Select a station
   - **On Leave**: Select leave type (AL, FRL, SL, etc.)
   - **Off Day**: Mark as off
3. Click **"Save Assignment"**

---

## 📋 Sample Workflow

### Scenario: Create a 2-Week Roster

**Week 1:**
```
1. Add all clinical staff (5 staff members)
2. Click "Generate Duty (AI)" for Nov 15-29
3. AI assigns staff based on doctor schedules
4. Result: Each staff gets ~5 duty days, 2 off days
```

**Week 2:**
```
1. Staff "SAINA" requests annual leave (Nov 20-22)
2. Click on Nov 20 cell for SAINA
3. Select "On Leave" → "AL"
4. Repeat for Nov 21, 22
5. Click "Generate Duty (AI)" again
6. AI respects leave and adjusts other assignments
```

---

## 🎨 Understanding the Calendar

### Color System

| Display | Meaning |
|---------|---------|
| 🟢 Green Box | ON DUTY at a specific station |
| ⚫ Gray Box | OFF day |
| 🟡 Yellow/Colored | ON LEAVE (color = leave type) |

### Example Row:
```
SAINA | 🟢 Ortho | 🟢 Medicine | ⚫ OFF | 🟡 AL | 🟡 AL | 🟢 ENT | ⚫ OFF
```

---

## 💡 Pro Tips

### 1. **AI is Smart**
- Automatically balances workload
- Prevents burnout (max 3 consecutive days)
- Ensures fair distribution
- Respects existing leaves

### 2. **Quick Edit**
- Click any cell to edit instantly
- Changes save immediately
- Color updates in real-time

### 3. **Stations Auto-Sync**
- When doctors portal adds new specialty
- It appears automatically in PR Portal
- No manual sync needed!

### 4. **Weekly Planning**
- Plan 1-2 weeks ahead
- Use AI for initial generation
- Fine-tune manually for special cases

### 5. **Leave Management**
- Mark leaves first
- Then generate duty
- AI works around leaves automatically

---

## 🔧 Troubleshooting

### "No assignments generated"
**Cause**: No doctors scheduled for selected dates  
**Fix**: Check doctor portal has schedules entered

### "Staff not appearing"
**Cause**: Staff role not set to "Clinical"  
**Fix**: Edit staff → Check "Clinical Staff" → Save

### "Can't save assignment"
**Cause**: Not logged in or session expired  
**Fix**: Re-login to admin panel

---

## 📱 Quick Reference

### Keyboard Shortcuts
- **Click cell**: Edit assignment
- **ESC**: Close modal
- **Click outside modal**: Close modal

### Leave Type Quick Reference
- **AL**: Annual Leave (Green)
- **FRL**: Family Leave (Pink)
- **SL**: Sick Leave (Gold)
- **ML**: Medical Leave (Salmon)
- **AB**: Absent (Hot Pink)
- **OFF**: Regular off day (Gray)

---

## ✅ Checklist for First Use

- [ ] Add all clinical staff members
- [ ] Assign roles (Clinical) to each staff
- [ ] Review Station Knowledge Base
- [ ] Add any custom stations needed
- [ ] Generate first roster using AI
- [ ] Review generated assignments
- [ ] Make manual adjustments if needed
- [ ] Test editing individual cells
- [ ] Add a leave request manually
- [ ] Re-generate to see AI adaptation

---

## 🎯 Next Steps

1. **Week 1**: Use AI generation exclusively
2. **Week 2**: Start manual fine-tuning
3. **Week 3**: Add leave requests proactively
4. **Week 4**: Fully comfortable with system

---

## 📞 Need Help?

**Common Questions:**
- "How many staff do I need?" → At least 4-5 for good rotation
- "Can I override AI?" → Yes! Click any cell to edit
- "Will AI mess up my leaves?" → No, it preserves all leaves
- "How far ahead can I plan?" → Any date range you want

**For full documentation**: See `PR_PORTAL_GUIDE.md`

---

**Happy Scheduling! 🎉**
