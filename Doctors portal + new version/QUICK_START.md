# 🎯 PR PORTAL - QUICK START GUIDE

## 🚀 How to See Your New Features NOW

### Step 1: Hard Refresh Your Browser
```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```
This forces the browser to reload the NEW JavaScript code.

### Step 2: What You Should See

#### **Staff Directory** 👥
- **Compact grid** of small cards (not one big card!)
- **Filter bar** at the top with dropdowns:
  - Role (All/Clinical/Front/Trainer)
  - Status (All/Active/Inactive)  
  - Station (All stations dropdown)
- **Search box** in header (not inside the grid)
- **"X of Y staff shown"** counter below filters
- **Black "➕ Add Staff"** button in header

#### **Add Staff Wizard** 🧙‍♂️
When you click **➕ Add Staff**, you should see:
- **Step 1/4**: "Who are we adding?" with name input
- **Step 2/4**: "Select their role(s)" with 3 clickable cards
- **Step 3/4**: "Configure assignments" with station checkboxes
- **Step 4/4**: "Review and confirm" with summary
- **Previous/Next buttons** at bottom (Previous hidden on step 1)
- **✓ Add Staff button** only on step 4

#### **AI Roster Generation** 🤖
- **Readiness Overview** card with 4 mini stats:
  - 👥 Active Staff
  - 🏥 Clinical Coverage  
  - 🎯 Front Desk
  - 🤖 AI Readiness %
- **Smart alerts** (green success or yellow warnings)
- **Doctors On Duty** panel on right side
- **Specialty Coverage Map** at bottom
- **🤖 Generate Roster button** (not purple, normal style)

#### **AI Configuration → Shift Knowledge** 🧠
- **3 cards** in the tab:
  1. **Staff Shift Templates** (Clinical/Front tabs, black "➕ Add Custom Shift")
  2. **Friday Duty Coverage** (Clinical/Front tabs, black "➕ Add Friday Shift")
  3. **Doctor OPD Information** (list of specialties, black "➕ Add OPD Profile")
- **💾 Save Shift Knowledge** button at bottom

#### **Dashboard** 📊
- **Specialists On Duty** card with:
  - Total number
  - Morning count / Evening count split
  - "Specialties: ..." footnote

---

## ❌ If You DON'T See These

### Problem: Still seeing old single-card staff layout

**Solution:**
1. Check URL - make sure you're at `/pr-portal` (not `/pr-portal-old`)
2. Open browser DevTools (F12)
3. Go to **Application** tab → **Clear storage** → **Clear site data**
4. Close browser completely
5. Reopen and login again

### Problem: Wizard shows but buttons don't work

**Solution:**
1. Open browser Console (F12 → Console tab)
2. Look for errors (red text)
3. Check if you see: "PR Portal initialized successfully!"
4. If not, refresh and check errors

### Problem: AI generator shows blank/old layout

**Solution:**
1. Hard refresh (Ctrl+Shift+R)
2. Check Console for JavaScript errors
3. Verify server is running (should see Flask messages in terminal)

---

## ✅ Test Checklist

Run through this to verify everything works:

### Staff Directory
- [ ] Click **Staff Directory** in sidebar
- [ ] See grid of small cards (not one big card)
- [ ] See filter bar with 4 dropdowns/search
- [ ] Change **Role** filter → cards update instantly
- [ ] Type in **Search box** → cards filter live
- [ ] See **"X of Y staff shown"** counter update
- [ ] Click **➕ Add Staff** → wizard modal opens

### Add Staff Wizard
- [ ] Click **➕ Add Staff**
- [ ] See "Step 1: Basic Info" title
- [ ] Type name → see **Next ►** button enabled
- [ ] Click **Next ►** → Step 2 appears
- [ ] Click a role card (e.g., Clinical) → card highlights
- [ ] Click **Next ►** → Step 3 shows station checkboxes
- [ ] Select some stations → click **Next ►**
- [ ] Step 4 shows summary with name, roles, stations
- [ ] Click **✓ Add Staff** → modal closes, success notification

### AI Generator
- [ ] Click **AI ROSTER GENERATION** in sidebar
- [ ] See **Readiness Overview** with 4 stat cards
- [ ] See **Doctors On Duty** panel on right
- [ ] Change date in doctor panel → list updates
- [ ] See **Specialty Coverage Map** at bottom
- [ ] Click **🤖 Generate Roster** → confirmation dialog
- [ ] Cancel dialog (don't generate yet if you have real data)

### Shift Knowledge
- [ ] Click **AI Configuration** in sidebar
- [ ] Click **Shift Knowledge** tab
- [ ] See **Staff Shift Templates** card
- [ ] Click **Front Desk** mini-tab → shifts change
- [ ] See **Friday Duty Coverage** card
- [ ] See **Doctor OPD Information** card
- [ ] Click **➕ Add OPD Profile** → modal opens
- [ ] Close modal
- [ ] See **💾 Save Shift Knowledge** button

### Dashboard
- [ ] Click **Dashboard** in sidebar
- [ ] See **Specialists On Duty** card
- [ ] Should show total, morning/evening split
- [ ] See specialty list at bottom of card

---

## 🎨 Visual Reference

### Old Staff Directory (BEFORE)
```
┌─────────────────────────────────────┐
│  Faalih                              │
│  Clinical                            │
│  Active                              │
│  DermatoENTEndocrin +5 more         │
│  8 Stations View Profile →          │
└─────────────────────────────────────┘
(One big card, no filters)
```

### New Staff Directory (AFTER)
```
Filter Bar:
[Role ▼] [Status ▼] [Station ▼]  [🔍 Search...]  "8 of 8 shown"

┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│🏥 Ali│ │🎯 Sara│ │🎓 Omar│ │🏥🎯  │
│Clinic│ │Front │ │Trainer│ │Faalih│
│Active│ │Active│ │Active │ │Active│
└──────┘ └──────┘ └──────┘ └──────┘
(Grid of small cards with filters)
```

### Old Add Staff (BEFORE)
```
┌────────────────────────┐
│ Add Staff Member       │
├────────────────────────┤
│ Name: [____________]   │
│ Role: [ ] Clinical     │
│       [ ] Front        │
│ Stations: [List...]    │
│                        │
│ [Cancel] [Save]        │
└────────────────────────┘
(Simple form, one page)
```

### New Add Staff Wizard (AFTER)
```
┌────────────────────────────────┐
│ Add Staff · Step 2: Select Roles │
├────────────────────────────────┤
│ 👤 Who are we adding?           │
│                                 │
│ ┌──────────────────┐            │
│ │ [ ] 🏥 Clinical  │ ← Clickable│
│ │ Works in OPD...  │            │
│ └──────────────────┘            │
│ ┌──────────────────┐            │
│ │ [✓] 🎯 Front Desk│            │
│ │ Handles reception│            │
│ └──────────────────┘            │
│                                 │
│ [◄ Previous] [Next ►]           │
└────────────────────────────────┘
(4-step wizard with navigation)
```

---

## 🆘 Still Having Issues?

### Browser Cache Won't Clear
Try **Incognito/Private Window**:
- `Ctrl+Shift+N` (Chrome/Edge)
- `Ctrl+Shift+P` (Firefox)
- Login and check if new features appear

### JavaScript Not Loading
1. Open DevTools (F12) → **Network** tab
2. Refresh page
3. Look for `pr_portal_light.js?v=XXXXXX`
4. Click it → should show the NEW code with wizard functions
5. If old code, server might not have restarted

### Server Issues
```powershell
# Stop any running Python
Get-Process python | Stop-Process -Force

# Start fresh
cd "d:\mauroof sir project\NEW ONE PROJECT FOR DOCTOR SCHEDULE UPDATING"
python app.py
```

---

## 📞 Quick Verification Command

Run this in terminal to check everything is configured:
```powershell
python verify_features.py
```

Should show all ✅ green checkmarks for:
- PR Portal template
- PR Portal JavaScript  
- Data structures
- Route configuration

---

## 🎉 Success Indicators

You'll know it's working when you see:

1. **Staff cards are SMALL** (like business cards in a grid)
2. **Filter bar EXISTS** at top of staff directory
3. **Wizard has 4 STEPS** not just one form
4. **AI Generator shows STATS CARDS** with percentages
5. **Shift Knowledge has 3 CARDS** with tabs
6. **All ➕ buttons are BLACK** not purple

---

**If you see ALL of these → SUCCESS! 🎉**
**If not → Follow troubleshooting steps above**

Read full guide: **PR_PORTAL_FEATURES.md**
