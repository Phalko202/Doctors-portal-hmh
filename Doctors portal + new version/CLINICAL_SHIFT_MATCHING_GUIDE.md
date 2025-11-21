# 🏥 Clinical Shift Matching & Freed Staff System

## 📋 Overview

This guide documents the intelligent clinical shift assignment system where:
- Clinical shifts are **pre-defined time slots** (not capacity-based)
- AI **automatically matches clinicals to doctors** based on optimal timing (30-60 mins before OPD)
- When doctors take leave, their **assigned clinicals become "freed"** and manually reassignable
- **Visual color coding** shows staff status in the roster

---

## 🎯 Core Concept

### Traditional vs New Approach

**❌ Old Way:**
```
Clinical Shift: 08:00-16:00 (Need 2 clinicals minimum)
- Problem: Doesn't match doctor OPD timings
- Problem: No flexibility when doctors take leave
```

**✅ New Way:**
```
Clinical Shifts (Pre-defined slots):
- 07:30-15:30 → Matches doctors starting at 08:00-08:30
- 08:30-16:30 → Matches doctors starting at 09:00-09:30
- 09:30-17:30 → Matches doctors starting at 10:00-10:30
- 10:30-18:30 → Matches doctors starting at 11:00-11:30

AI Logic:
1. Doctor OPD starts at 08:00
2. AI finds clinical shift starting 30-60 mins before
3. AI assigns clinical from 07:30-15:30 slot
4. If doctor takes leave → Clinical becomes "freed" (purple marker)
5. Supervisor can manually reassign freed clinical
```

---

## 🔧 System Components

### 1. Staff Shift Templates (Categorized)

**Location:** PR Portal → Configuration → Shift Knowledge → Staff Shift Templates

**Structure:**
```javascript
{
  "clinical": {
    "Morning Shifts": [
      {
        "name": "07:30-15:30 Clinical",
        "start": "07:30",
        "end": "15:30",
        "slots": 2  // Number of clinical positions
      },
      {
        "name": "08:30-16:30 Clinical",
        "start": "08:30",
        "end": "16:30",
        "slots": 1
      }
    ],
    "Evening Shifts": [
      {
        "name": "09:30-17:30 Clinical",
        "start": "09:30",
        "end": "17:30",
        "slots": 2
      }
    ]
  }
}
```

**Key Features:**
- ✅ **Slots** instead of min_staff (e.g., 2 slots = 2 clinical positions)
- ✅ **AI Matching Preview** - Shows which doctor OPD times this shift covers
- ✅ **Category Organization** - Morning/Evening/Night for easy management
- ✅ **Move Between Categories** - Reorganize shifts as needed

### 2. Doctor OPD Information

**Location:** PR Portal → Configuration → Shift Knowledge → Doctor OPD Information

**Structure:**
```javascript
{
  "INTERNAL MEDICINE": {
    "shift1": {
      "start": "08:00",
      "end": "14:00",
      "patients": 20
    },
    "shift2": {
      "start": "14:00",
      "end": "20:00",
      "patients": 15
    }
  }
}
```

**Key Features:**
- ✅ **Best Clinical Match Display** - Shows which clinical shift is optimal
- ✅ **2 Shifts per Specialty** - Morning and evening OPD coverage
- ✅ **Patient Capacity** - Helps AI determine workload

---

## 🤖 AI Matching Algorithm

### Step-by-Step Process:

```
1. LOAD Doctor OPD Timings
   - Internal Medicine: 08:00, 14:00
   - Paediatrics: 09:00, 15:00
   - Orthopaedics: 10:00, 16:00

2. LOAD Clinical Shifts
   - 07:30-15:30 (2 slots available)
   - 08:30-16:30 (1 slot available)
   - 09:30-17:30 (2 slots available)

3. MATCH Clinicals to Doctors
   For each doctor OPD:
     a. Calculate doctor start time (e.g., 08:00 = 480 minutes)
     b. Find clinical shifts starting 30-90 minutes before
     c. Prefer shifts closest to 30 minutes before
     d. Assign clinical from best matching shift
     
   Example:
   - Doctor starts 08:00 (480 min)
   - Clinical shift 07:30 (450 min) → Difference = 30 min ✅ PERFECT
   - Clinical shift 08:30 (510 min) → Difference = -30 min ❌ TOO LATE
   
4. ASSIGN Clinicals
   - Dr. Ahmed (Internal Medicine, 08:00) → Faalih (07:30-15:30 shift)
   - Dr. Sara (Paediatrics, 09:00) → Hassan (08:30-16:30 shift)
   
5. TRACK Assignments (metadata)
   {
     "staff_id": "faalih_123",
     "date": "2025-11-17",
     "station": "clinical_opd",
     "ai_assigned_doctor": {
       "doctor_id": "dr_ahmed_456",
       "doctor_name": "Dr. Ahmed",
       "specialty": "INTERNAL MEDICINE",
       "opd_start": "08:00"
     }
   }
```

### Matching Rules:

| Doctor OPD Start | Best Clinical Shift | Time Difference |
|------------------|---------------------|-----------------|
| 07:30 AM | 07:00-15:00 | 30 min ✅ |
| 08:00 AM | 07:30-15:30 | 30 min ✅ |
| 08:30 AM | 08:00-16:00 | 30 min ✅ |
| 09:00 AM | 08:30-16:30 | 30 min ✅ |
| 09:30 AM | 09:00-17:00 | 30 min ✅ |
| 10:00 AM | 09:30-17:30 | 30 min ✅ |
| 10:30 AM | 10:00-18:00 | 30 min ✅ |

**Acceptable Range:** 30-90 minutes before doctor start time

---

## 🆓 Freed Clinical System

### What is a "Freed Clinical"?

When a doctor takes leave (AL, SL, ML, CL), their assigned clinical becomes **"freed"**:
- ✅ Clinical is no longer needed for that doctor
- ✅ Clinical becomes available for manual reassignment
- ✅ Supervisor can reassign to other duties
- ✅ Visually marked with **purple color** and **🆓 icon**

### Visual Indicators

**Normal Assignment:**
```
┌─────────────────┐
│ Faalih          │
│ 17th: OPD ✅    │  ← Blue text, normal border
└─────────────────┘
```

**Freed Clinical:**
```
┌══════════════════┐
║ Faalih          ║  ← Purple border (3px thick)
║ 17th: OPD 🆓    ║  ← Purple text (#9333ea), bold
└══════════════════┘
Tooltip: "Freed Clinical - Doctor on leave, manually reassignable"
```

### How It Works

**Scenario:**
```
Day 1 (Nov 17):
- Dr. Ahmed (Internal Medicine) working → Faalih assigned (07:30-15:30)
- Roster shows: Faalih → OPD (normal blue)

Day 2 (Nov 18):
- Dr. Ahmed takes SICK LEAVE
- AI detects: Faalih's assigned doctor is on leave
- Roster shows: Faalih → OPD 🆓 (purple, thick border)
- Supervisor can click and reassign Faalih to different station
```

### Detection Logic

```javascript
function checkIfClinicalFreed(staff, date, assignment) {
  // 1. Check if staff is clinical role
  if (!roles.includes('clinical')) return false;
  
  // 2. Check if has station assignment
  if (!assignment.station) return false;
  
  // 3. Check if AI assigned to specific doctor
  const doctorId = assignment.ai_assigned_doctor?.doctor_id;
  if (!doctorId) return false;
  
  // 4. Check if that doctor is on leave
  const doctorLeaves = leaves[date];
  const doctorOnLeave = doctorLeaves.find(l => l.doctor_id === doctorId);
  
  return !!doctorOnLeave; // TRUE = Clinical is freed
}
```

---

## 🎨 Roster Color Legend

### Leave Types
| Color | Type | Code |
|-------|------|------|
| 🟢 Green Gradient | Annual Leave | AL |
| 🔴 Red Gradient | Sick Leave | SL |
| 🟠 Orange Gradient | Maternity Leave | ML |
| 🔵 Blue Gradient | Casual Leave | CL |

### Assignment Types
| Visual | Meaning | Action |
|--------|---------|--------|
| Blue text `OPD` | Normal station assignment | Click to edit |
| **Purple text 🆓 OPD** | Freed clinical (doctor on leave) | Click to reassign |
| Purple thick border | Freed clinical indicator | Shows at a glance |
| Gray text `--` | No assignment | Click to assign |

### Special Days
| Visual | Meaning |
|--------|---------|
| 🕌 Peach/Pink Background | Friday (Mosque day) |
| Peach Background | Hospital Closed |

---

## 📖 User Guide

### For Supervisors

#### 1. Configure Clinical Shifts

**Step 1:** Navigate to PR Portal → Configuration → Shift Knowledge

**Step 2:** Click "Clinical" team tab

**Step 3:** Click "Add Category" → Enter "Morning Shifts"

**Step 4:** Click "Add Shift to Category"

**Step 5:** Fill in details:
```
Name: 07:30-15:30 Clinical
Start: 07:30
End: 15:30
Slots: 2
```

**Step 6:** Repeat for other time slots:
- 08:30-16:30 Clinical
- 09:30-17:30 Clinical
- 10:30-18:30 Clinical

**Step 7:** Click "Save Shift Templates"

#### 2. Configure Doctor OPD Times

**Step 1:** Scroll to "Doctor OPD Information" section

**Step 2:** Click "Add OPD Profile"

**Step 3:** Select specialty (e.g., INTERNAL MEDICINE)

**Step 4:** Fill in Shift 1:
```
Start: 08:00
End: 14:00
Patients: 20
```

**Step 5:** Fill in Shift 2:
```
Start: 14:00
End: 20:00
Patients: 15
```

**Step 6:** Click "Save OPD Profile"

**Step 7:** Notice green text showing best matching clinical:
```
📌 Best Clinical: 07:30-15:30 Clinical (07:30)
```

#### 3. Generate AI Roster

**Step 1:** Go to PR Portal → Schedule

**Step 2:** Click "🤖 AI Generate" button

**Step 3:** AI automatically:
- Matches clinicals to doctors
- Assigns optimal shift slots
- Stores doctor assignment metadata

**Step 4:** Review assignments in roster

#### 4. Handle Doctor Leave

**Step 1:** Click on doctor's cell on leave date

**Step 2:** Select leave type (AL, SL, ML, CL)

**Step 3:** Save

**Step 4:** System automatically:
- Detects doctor on leave
- Marks assigned clinical as "freed"
- Applies purple color and 🆓 icon

**Step 5:** Find freed clinical in roster (purple border)

**Step 6:** Click on freed clinical's cell

**Step 7:** Reassign to different station or duty

**Step 8:** Save assignment

#### 5. View Legend

Legend automatically appears above schedule table showing:
- All leave type colors
- Station assignment indicator
- **Freed clinical indicator** (purple border with 🆓)

---

## 🧪 Testing Scenarios

### Scenario 1: Basic Matching

**Given:**
- Doctor OPD: Internal Medicine at 08:00
- Clinical Shift: 07:30-15:30 (2 slots)

**Expected:**
- AI assigns clinical to this shift
- Doctor OPD shows "📌 Best Clinical: 07:30-15:30 Clinical"
- Clinical shift shows "🎯 AI Match: Covers INTERNAL MEDICINE 08:00"

### Scenario 2: Multiple Doctors, Same Shift

**Given:**
- Dr. Ahmed: Internal Medicine at 08:00
- Dr. Sara: Paediatrics at 08:30
- Clinical Shift: 07:30-15:30 (2 slots)

**Expected:**
- Both doctors match this shift (30 and 60 min differences)
- 2 clinicals assigned from this shift
- Shift shows: "🎯 AI Match: Covers INTERNAL MEDICINE 08:00, PAEDIATRICS 08:30"

### Scenario 3: Doctor Takes Leave

**Given:**
- Day 1: Dr. Ahmed working, Faalih assigned (07:30-15:30)
- Day 2: Dr. Ahmed takes SL (Sick Leave)

**Expected:**
- Day 1 Roster: Faalih → OPD (normal blue)
- Day 2 Roster: Faalih → OPD 🆓 (purple, thick border)
- Tooltip shows: "Freed Clinical - Doctor on leave, manually reassignable"

### Scenario 4: Manual Reassignment

**Given:**
- Faalih is freed clinical (Dr. Ahmed on leave)
- Need to assign Faalih to Emergency duty

**Expected:**
- Click on Faalih's freed cell (purple 🆓)
- Modal opens with station dropdown
- Select "Emergency" station
- Save
- Faalih now assigned to Emergency (normal blue, no 🆓)

---

## 💡 Best Practices

### Shift Configuration

1. **Use Standard Time Slots:**
   - 07:30, 08:30, 09:30, 10:30 (30-min intervals)
   - Easier for staff to remember
   - Better AI matching precision

2. **Adequate Slots:**
   - Morning shifts: 2-3 slots (high demand)
   - Evening shifts: 1-2 slots (moderate demand)
   - Night shifts: 1 slot (low demand)

3. **Clear Naming:**
   - Include time range in name: "07:30-15:30 Clinical"
   - Specify role: "Clinical" vs "Front Desk"
   - Avoid ambiguous names like "Shift 1"

### Doctor OPD Configuration

1. **Accurate Timings:**
   - Use actual doctor start times
   - Update when schedules change
   - Include both shifts if doctor works twice daily

2. **Realistic Patient Numbers:**
   - Help AI calculate workload
   - Adjust based on specialty demand
   - Review quarterly and update

### Roster Management

1. **Check Freed Clinicals Daily:**
   - Look for purple 🆓 indicators
   - Reassign before end of previous day
   - Ensure no gaps in coverage

2. **Document Reassignments:**
   - Add notes when reassigning freed clinicals
   - Track patterns (frequent doctor leaves)
   - Adjust shift slots if needed

3. **Review AI Matching:**
   - Check green "AI Match" indicators
   - Ensure clinicals arrive before doctors
   - Report issues if matching seems off

---

## 🔍 Troubleshooting

### Issue: No AI Matching Shown

**Symptom:** Clinical shift doesn't show "🎯 AI Match: Covers..."

**Causes:**
1. No Doctor OPD configured
2. Clinical shift timing doesn't match any doctor (not 30-90 min before)
3. Doctor OPD data not loaded

**Solution:**
1. Configure Doctor OPD times
2. Adjust clinical shift start time
3. Hard refresh browser (Ctrl+Shift+R)

### Issue: Clinical Not Freed When Doctor on Leave

**Symptom:** Doctor on leave but clinical still shows normal blue

**Causes:**
1. No AI assignment metadata stored
2. Manual assignment (not AI-generated)
3. Different doctor took leave (not assigned doctor)

**Solution:**
1. Re-generate roster with AI
2. Check assignment metadata
3. Manually mark clinical as freed if needed

### Issue: Purple Border Not Showing

**Symptom:** Freed clinical doesn't have purple border

**Causes:**
1. CSS not loaded
2. Browser cache issue
3. Incorrect freed status detection

**Solution:**
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Check browser console for errors
4. Restart server

---

## 📊 Data Structure Reference

### Clinical Shift Template

```json
{
  "name": "07:30-15:30 Clinical",
  "start": "07:30",
  "end": "15:30",
  "slots": 2,
  "category": "Morning Shifts",
  "team": "clinical"
}
```

### Doctor OPD Profile

```json
{
  "INTERNAL MEDICINE": {
    "shift1": {
      "start": "08:00",
      "end": "14:00",
      "patients": 20
    },
    "shift2": {
      "start": "14:00",
      "end": "20:00",
      "patients": 15
    }
  }
}
```

### Roster Assignment (with AI metadata)

```json
{
  "staff_id": "faalih_123",
  "date": "2025-11-17",
  "station": "clinical_opd",
  "ai_assigned_doctor": {
    "doctor_id": "dr_ahmed_456",
    "doctor_name": "Dr. Ahmed",
    "specialty": "INTERNAL MEDICINE",
    "opd_start": "08:00",
    "shift_slot": "07:30-15:30"
  },
  "notes": "AI-assigned to cover INTERNAL MEDICINE OPD"
}
```

### Leave Record

```json
{
  "date": "2025-11-18",
  "staff_id": "dr_ahmed_456",
  "doctor_id": "dr_ahmed_456",
  "leave_type": "SL",
  "notes": "Sick leave - flu"
}
```

---

## 🚀 Future Enhancements

### Planned Features:

1. **Auto-Reassignment Suggestions**
   - AI suggests best reassignment for freed clinicals
   - Based on workload, proximity, skill match

2. **Freed Clinical Alerts**
   - Email/Telegram notification when clinical freed
   - Daily summary of all freed positions

3. **Shift Swap Requests**
   - Clinicals can request shift swaps
   - Supervisor approves/rejects
   - Automatic roster update

4. **Historical Analytics**
   - Track freed clinical frequency
   - Identify doctors with high leave rates
   - Optimize shift slot allocations

5. **Mobile App**
   - View freed clinicals on mobile
   - Quick reassignment from phone
   - Push notifications

---

## 📞 Support

**Issues? Questions? Contact:**
- Check browser console (F12) for error logs
- Review this guide's troubleshooting section
- Check `CATEGORY_SYSTEM_GUIDE.md` for category setup
- Restart server: `python run_waitress.py`

**Server:** Running on `http://localhost:5000`

**Last Updated:** November 17, 2025
