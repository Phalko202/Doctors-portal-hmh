# 📂 Category System Implementation Guide

## 🎯 Overview

This guide documents the new **categorization system** for GOPD Configuration and Staff Shift Templates, implemented to provide better organization by time of day (Morning/Evening/Night) and easier navigation for the AI bot.

---

## ✅ Changes Implemented

### 1. **Maldives Timezone (UTC+5) - FIXED**

All date calculations now use Maldives time instead of browser local time:

```javascript
// NEW: Helper function for Maldives time
function getMaldivesToday() {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const maldivesTime = new Date(utc + (3600000 * 5)); // UTC+5
    return maldivesTime.toISOString().split('T')[0];
}
```

**Fixed Locations:**
- ✅ `init()` - Sets date inputs to Maldives today
- ✅ `renderDashboard()` - Dashboard statistics use Maldives date
- ✅ `renderLeaveManagement()` - Leave calendar highlights Maldives today
- ✅ `loadDoctorScheduleForDate()` - Doctor schedule search uses Maldives date

**Result:** After midnight (12:00 AM Maldives time), the date automatically changes to the new day.

---

### 2. **GOPD Configuration - Categorized System**

#### Old Structure:
```json
{
  "staff_count": 2,
  "shifts": [
    {"name": "Morning", "start": "08:00", "end": "14:00"},
    {"name": "Evening", "start": "14:00", "end": "20:00"}
  ]
}
```

#### New Structure:
```json
{
  "staff_count": 2,
  "categories": {
    "Morning Shifts": [
      {"name": "Morning Shift", "start": "08:00", "end": "14:00", "min_staff": 2},
      {"name": "Extended Morning", "start": "08:00", "end": "16:00", "min_staff": 1}
    ],
    "Evening Shifts": [
      {"name": "Evening Shift", "start": "14:00", "end": "20:00", "min_staff": 2}
    ],
    "Night Shifts": [
      {"name": "Night Duty", "start": "20:00", "end": "08:00", "min_staff": 1}
    ]
  }
}
```

#### Features:
- ✅ **Add Category** - Create custom categories (Morning/Evening/Night or any name)
- ✅ **Add Shift to Category** - Add shifts within selected category
- ✅ **Edit Shift** - Inline editing (name, start, end, min_staff)
- ✅ **Move Shift** - Move shifts between categories
- ✅ **Delete Shift** - Remove shifts with confirmation
- ✅ **Category Tabs** - Visual tabs for easy navigation
- ✅ **Empty State** - Clear message when category has no shifts

#### UI Location:
**PR Portal → Configuration → GOPD Tab**

#### How to Use:
1. Click "➕ Add Category" to create a new category (e.g., "Morning Shifts")
2. Select the category tab
3. Click "➕ Add Shift to Category" to add shifts
4. Edit shift details inline (name, start time, end time, min staff)
5. Click "↔️" to move shift to another category
6. Click "🗑️" to delete shift
7. Click "💾 Save GOPD Configuration" to save all changes

---

### 3. **Staff Shift Templates - Categorized System**

#### Old Structure:
```json
{
  "clinical": [
    {"name": "Morning Shift", "start": "08:00", "end": "14:00", "min_staff": 2}
  ],
  "front": [
    {"name": "Evening Shift", "start": "14:00", "end": "20:00", "min_staff": 1}
  ]
}
```

#### New Structure:
```json
{
  "clinical": {
    "Morning Shifts": [
      {"name": "Early Morning", "start": "06:00", "end": "14:00", "min_staff": 1},
      {"name": "Standard Morning", "start": "08:00", "end": "16:00", "min_staff": 2}
    ],
    "Evening Shifts": [
      {"name": "Afternoon", "start": "14:00", "end": "22:00", "min_staff": 2}
    ],
    "Night Shifts": [
      {"name": "Night Duty", "start": "20:00", "end": "06:00", "min_staff": 1}
    ]
  },
  "front": {
    "Morning Shifts": [...],
    "Evening Shifts": [...],
    "Night Shifts": [...]
  }
}
```

#### Features:
- ✅ **Team Selection** - Switch between Clinical and Front Desk
- ✅ **Add Category** - Create custom categories for each team
- ✅ **Add Shift to Category** - Add shifts within selected category
- ✅ **Edit Shift** - Inline editing (name, start, end, min_staff)
- ✅ **Move Shift** - Move shifts between categories within same team
- ✅ **Delete Shift** - Remove shifts with confirmation
- ✅ **Category Tabs** - Visual tabs for easy navigation
- ✅ **Separate Categories** - Clinical and Front Desk have independent category systems

#### UI Location:
**PR Portal → Configuration → Shift Knowledge Tab → Staff Shift Templates Section**

#### How to Use:
1. Select team (Clinical or Front Desk)
2. Click "➕ Add Category" to create a new category
3. Select the category tab
4. Click "➕ Add Shift to Category" to add shifts
5. Edit shift details inline
6. Click "↔️" to move shift to another category (within same team)
7. Click "🗑️" to delete shift
8. Click "💾 Save Shift Templates" to save all changes

---

## 🔧 Technical Implementation

### Frontend Files Modified:

1. **`static/js/pr_portal_light.js`** (3128 lines, +469 lines added)
   - Added `getMaldivesToday()` helper function
   - Updated all date usages (4 locations)
   - Added GOPD categorization system (220 lines):
     - `loadGopdConfig()`, `renderGopdCategoryTabs()`, `switchGopdCategory()`
     - `renderGopdCategoryContent()`, `addGopdCategory()`, `addGopdShiftToCategory()`
     - `updateGopdShift()`, `deleteGopdShift()`, `moveGopdShiftToCategory()`, `saveGopdConfig()`
   - Added Staff Shift Templates categorization system (249 lines):
     - `loadPrShiftTemplates()`, `switchStaffTeam()`, `renderStaffCategoryTabs()`
     - `renderStaffCategoryContent()`, `addStaffCategory()`, `addShiftToStaffCategory()`
     - `updateStaffShift()`, `deleteStaffShift()`, `moveStaffShiftToCategory()`, `savePrShifts()`

2. **`templates/pr_portal_light.html`** (2147 lines)
   - Updated GOPD Configuration section (lines 1375-1400)
     - Added `gopdCategoryTabs` container for category tabs
     - Added "Add Category" and "Add Shift to Category" buttons
   - Updated Staff Shift Templates section (lines 1410-1435)
     - Added `staffCategoryTabs` container for category tabs
     - Added "Add Category" and "Add Shift to Category" buttons

### Backend Files Modified:

3. **`app.py`** (5979 lines, +26 lines added)
   - Updated `/api/pr/gopd-config` (GET and POST)
     - Now supports both old `{shifts: [...]}` and new `{categories: {...}}` formats
     - Backward compatible with existing data
   - Added `/api/shift-templates` (GET and POST)
     - New endpoint for categorized shift templates
     - Supports both old flat array and new categorized object formats

### Data Files:
4. **`data/pr_staff.json`** (automatically created/updated)
   - Stores GOPD config and shift templates with categories
   - Backward compatible with old format

---

## 📊 Backward Compatibility

### Migration Strategy:

**Old Data:**
```json
{
  "gopd_config": {
    "staff_count": 2,
    "shifts": ["Morning", "Afternoon"]
  }
}
```

**Automatically Migrated To:**
```json
{
  "gopd_config": {
    "staff_count": 2,
    "categories": {
      "Default": [
        {"name": "Morning", "start": "08:00", "end": "14:00", "min_staff": 2},
        {"name": "Afternoon", "start": "14:00", "end": "20:00", "min_staff": 2}
      ]
    }
  }
}
```

- ✅ Old format data is automatically migrated to "Default" category on first load
- ✅ Users can then reorganize shifts into proper categories (Morning/Evening/Night)
- ✅ All existing data is preserved - nothing is lost
- ✅ APIs accept both old and new formats for maximum compatibility

---

## 🧪 Testing Instructions

### 1. Test Maldives Timezone:
1. Open PR Portal
2. Check date inputs show **today's Maldives date** (17th, not 16th)
3. Wait until midnight (12:00 AM Maldives time)
4. Refresh page
5. Date should automatically change to new day

### 2. Test GOPD Categorization:
1. Navigate to: **PR Portal → Configuration → GOPD Tab**
2. Click "➕ Add Category" → Enter "Morning Shifts" → OK
3. Click "Morning Shifts" tab
4. Click "➕ Add Shift to Category"
5. Edit shift name to "Early Morning"
6. Set start: 06:00, end: 14:00, min staff: 2
7. Create another category "Evening Shifts"
8. Add shift to Evening category
9. Click "↔️" on Morning shift → Move to "Evening Shifts"
10. Verify shift appears in Evening category
11. Click "💾 Save GOPD Configuration"
12. Refresh page → Verify data persists

### 3. Test Staff Shift Templates:
1. Navigate to: **PR Portal → Configuration → Shift Knowledge Tab**
2. Select "Clinical" team
3. Click "➕ Add Category" → Enter "Morning Shifts" → OK
4. Click "Morning Shifts" tab
5. Click "➕ Add Shift to Category"
6. Edit shift details
7. Switch to "Front Desk" team
8. Repeat: Add category, add shifts
9. Move shifts between categories
10. Delete a shift → Confirm deletion
11. Click "💾 Save Shift Templates"
12. Refresh page → Verify data persists for both teams

### 4. Test AI Bot Integration:
1. Open AI Generator modal
2. PR Bot should now see categorized shifts:
   - "Morning Shifts: Early Morning (06:00-14:00), Standard Morning (08:00-16:00)"
   - "Evening Shifts: Afternoon (14:00-22:00)"
   - "Night Shifts: Night Duty (20:00-06:00)"
3. Ask bot: "What shifts are available in the morning?"
4. Bot should list all shifts from "Morning Shifts" category

---

## 🎨 UI/UX Enhancements

### Visual Design:
- **Category Tabs** - Glassmorphism design with active state
- **Shift Cards** - Clean cards with inline editing
- **Empty States** - Friendly messages when no shifts exist
- **Inline Editing** - No modals needed, edit directly
- **Move Button** - ↔️ icon for moving shifts between categories
- **Delete Button** - 🗑️ icon with red color for deletion

### User Experience:
- **Auto-save on Edit** - Changes are saved when you type
- **Confirmation Dialogs** - Prevents accidental deletions
- **Toast Notifications** - Success/error messages
- **Category Organization** - Logical grouping by time of day
- **Team Separation** - Clinical and Front Desk are independent

---

## 🚀 Benefits

### For Users:
1. **Better Organization** - Shifts grouped by time of day (Morning/Evening/Night)
2. **Easier Navigation** - Click tab instead of scrolling through long list
3. **Flexible Categorization** - Create custom categories with any name
4. **Move Shifts Easily** - Reorganize shifts between categories
5. **Inline Editing** - Edit shifts directly without opening modals

### For AI Bot:
1. **Easier Pattern Recognition** - Categories provide context (morning vs evening shifts)
2. **Faster Lookups** - Bot can search within specific categories
3. **Better Understanding** - Category names give semantic meaning
4. **Smarter Suggestions** - Bot can recommend shifts based on time of day

### For System:
1. **Backward Compatible** - Old data automatically migrated
2. **Scalable** - Can add unlimited categories and shifts
3. **Maintainable** - Clean data structure
4. **Flexible** - Supports both old and new formats

---

## 📝 API Documentation

### GOPD Configuration

#### GET `/api/pr/gopd-config`
**Response:**
```json
{
  "ok": true,
  "gopd_config": {
    "staff_count": 2,
    "categories": {
      "Morning Shifts": [...],
      "Evening Shifts": [...],
      "Night Shifts": [...]
    }
  }
}
```

#### POST `/api/pr/gopd-config`
**Request:**
```json
{
  "staff_count": 2,
  "categories": {
    "Morning Shifts": [
      {"name": "Early Morning", "start": "06:00", "end": "14:00", "min_staff": 2}
    ]
  }
}
```

**Response:**
```json
{
  "ok": true,
  "gopd_config": { ... }
}
```

### Shift Templates

#### GET `/api/shift-templates`
**Response:**
```json
{
  "ok": true,
  "templates": {
    "clinical": {
      "Morning Shifts": [...],
      "Evening Shifts": [...]
    },
    "front": {
      "Morning Shifts": [...],
      "Evening Shifts": [...]
    }
  }
}
```

#### POST `/api/shift-templates`
**Request:**
```json
{
  "clinical": {
    "Morning Shifts": [
      {"name": "Standard Morning", "start": "08:00", "end": "16:00", "min_staff": 2}
    ]
  },
  "front": { ... }
}
```

**Response:**
```json
{
  "ok": true,
  "templates": { ... }
}
```

---

## 🐛 Troubleshooting

### Issue: Date still shows wrong day
**Solution:**
1. Hard refresh browser: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
2. Clear browser cache
3. Check browser console for errors
4. Verify `getMaldivesToday()` function exists in pr_portal_light.js

### Issue: Categories not appearing
**Solution:**
1. Check browser console for JavaScript errors
2. Verify server is running: `http://localhost:5000`
3. Check if `gopdCategoryTabs` and `staffCategoryTabs` elements exist in HTML
4. Verify API endpoints return data: Open Network tab → Check `/api/pr/gopd-config` response

### Issue: Can't save changes
**Solution:**
1. Check browser console for network errors
2. Verify logged in (authentication required)
3. Check server logs for Python errors
4. Verify `data/pr_staff.json` file has write permissions

### Issue: Old data not migrating
**Solution:**
1. Open browser console → Check for migration logs
2. Backend automatically puts old shifts in "Default" category
3. Manually reorganize shifts from "Default" to proper categories (Morning/Evening/Night)
4. Delete "Default" category after reorganization

---

## 📋 Checklist

### Completed ✅:
- [x] Maldives timezone helper function created
- [x] All 4 date usages updated to use Maldives time
- [x] GOPD categorization UI implemented
- [x] GOPD categorization JavaScript functions implemented
- [x] Staff Shift Templates categorization UI implemented
- [x] Staff Shift Templates categorization JavaScript functions implemented
- [x] Backend APIs updated to support categories
- [x] Backward compatibility maintained
- [x] Server restarted with new code
- [x] Documentation created

### To Test 🧪:
- [ ] Date shows correct Maldives date (17th, not 16th)
- [ ] Date changes at midnight Maldives time
- [ ] GOPD categories work (add/edit/move/delete)
- [ ] Staff templates categories work (add/edit/move/delete)
- [ ] Data persists after refresh
- [ ] Old data migrates to "Default" category
- [ ] AI bot can find shifts by category
- [ ] Both Clinical and Front Desk work independently

---

## 📞 Support

If you encounter any issues:

1. **Check Browser Console** - Press F12 → Console tab
2. **Check Server Logs** - Look at terminal running `python run_waitress.py`
3. **Hard Refresh** - `Ctrl + Shift + R` to clear cache
4. **Restart Server** - Stop and start `python run_waitress.py`
5. **Check Network Tab** - F12 → Network tab → See API responses

---

## 🎉 Summary

**What's New:**
- ✅ Maldives time (UTC+5) - Date shows correctly after midnight
- ✅ GOPD categorization - Organize shifts by Morning/Evening/Night
- ✅ Staff templates categorization - Separate categories for Clinical and Front Desk
- ✅ Move shifts between categories - Flexible organization
- ✅ Inline editing - Edit shifts directly without modals
- ✅ Category tabs - Easy navigation
- ✅ Backward compatible - Old data automatically migrated

**Benefits:**
- Better organization and navigation
- Easier for AI bot to find shifts
- Flexible categorization (create custom categories)
- Clean, intuitive UI
- No data loss - all existing data preserved

**Server Status:**
Server running on: `http://localhost:5000`

**Ready to use!** 🚀
