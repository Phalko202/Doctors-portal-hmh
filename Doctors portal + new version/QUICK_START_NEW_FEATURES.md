# 🚀 Quick Start Guide - New Features

## 🤖 PR Bot - Your AI Assistant

### What's New?
**PR Bot** (formerly AI Assistant) now has **3 powerful modes**:

```
┌─────────────────────────────────────┐
│  🤖 PR Bot [Smart]                  │
│     ● Online & Ready                │
│                                     │
│  [🔄] [⛶] [↗] [✕]                  │
│   │    │   │   └─ Close             │
│   │    │   └───── New Tab           │
│   │    └───────── Full Screen       │
│   └────────────── New Chat          │
└─────────────────────────────────────┘
```

---

## 📺 Mode 1: Regular Popup (Default)
**Click the robot icon in bottom-right corner**

```
Desktop View:
                                    ┌─────────────────────┐
                                    │  🤖 PR Bot         │
                                    │                     │
                                    │  Chat messages...   │
                                    │                     │
                                    │  [Ask anything...] │
                                    └─────────────────────┘
                                                         ↑
                                                    420×600px
```

**Use when:**
- Quick questions while working
- Reference while viewing roster
- Side-by-side with schedule

---

## 🖥️ Mode 2: Full-Screen (⛶ Button)
**Click the ⛶ button in chat header**

```
┌─────────────────────────────────────────────┐
│  🤖 PR Bot [Smart]         [🔄] [⛶] [↗] [✕] │
├─────────────────────────────────────────────┤
│                                             │
│                                             │
│    FULL SCREEN MODE                         │
│    More space for complex conversations     │
│    Perfect for detailed explanations        │
│                                             │
│                                             │
│                                             │
│  [Ask me anything about the system...]      │
└─────────────────────────────────────────────┘
```

**Use when:**
- Learning complex system features
- Reading long explanations
- Working through troubleshooting
- Need more screen space

**To Exit:** Click ⛶ again or ✕ close button

---

## 🪟 Mode 3: New Tab (↗ Button)
**Click the ↗ button in chat header**

```
Browser Tabs:
┌────────────────┬─────────────────┬──────────────┐
│ Schedule Mgmt  │  🤖 PR Bot Tab  │  +           │
└────────────────┴─────────────────┴──────────────┘

PR Bot Tab (Full Window):
┌─────────────────────────────────────────────┐
│  🤖 PR Bot [Smart]              [🔄] [✕]    │
├─────────────────────────────────────────────┤
│                                             │
│  Dedicated window for PR Bot                │
│  Work in main tab, reference here           │
│  Independent chat history                   │
│                                             │
│  [Ask me anything...]                       │
└─────────────────────────────────────────────┘
```

**Use when:**
- Need bot while working in another tab
- Reference guide while configuring
- Keep conversations separate
- Multi-monitor setup

---

## 📋 Legend - Always Visible!

### New Position: Fixed Sidebar
**No more scrolling to find legend!**

```
Schedule View:
┌──────────────────────────────────┬──────────────┐
│ Schedule: Nov 16 - Dec 15, 2025  │  📋 Legend   │
│ ─────────────────────────────────│──────────────│
│ [Back] [Today] [Front]           │  LEAVE TYPES │
│                                  │  ◼ PML       │
│ Staff Name │ Mon │ Tue │ Wed ... │  ◼ AL        │
│────────────┼─────┼─────┼─────────│  ◼ FRL       │
│ 🏥 Faalih  │ OPD │ AL  │ OPD ... │  ◼ EXC       │
│            ↓     ↓     ↓         │  ◼ HI        │
│         Scroll Down               │  ... (15)    │
│         Legend Stays!   ←────────→│              │
│            ↓                      │  ASSIGNMENTS │
│            ↓                      │  ◼ Station   │
│            ↓                      │  🆓 Freed    │
└──────────────────────────────────┴──────────────┘
         ↑                              ↑
    Scrollable Table            Fixed Sidebar
```

**Benefits:**
✅ Always visible - no scrolling needed  
✅ Cleaner date header  
✅ Easy color reference  
✅ Professional layout

---

## 🎨 Complete Leave Type Colors (15 Types)

**Now includes ALL leave types from your specification:**

```
📋 LEGEND
─────────────────────
LEAVE TYPES
◼ PML  Paternity/Maternity
◼ AL   Annual Leave
◼ FRL  Family Leave
◼ EXC  Exam Leave
◼ HI   Home Isolation
◼ OR   Official Request
◼ SWP  Swap
◼ SWPL Swap Leave
◼ NP   No Pay
◼ CL   Casual Leave
◼ AB   Absent
◼ SL   Sick Leave
◼ ML   Medical Leave
◼ OC   On Call
◼ AC   Additional Coverage

ASSIGNMENTS
◼ ST   Station Assignment
🆓     Freed Clinical
```

**What Changed:**
- **MI** (Medical Issue) → **HI** (Home Isolation)
- All 15 colors match image specifications
- Organized vertical layout

---

## 🏥 Front Desk Configuration

### New: Minimum Staff & Friday Coverage

**Access:** Stations Management Tab

```
Front Stations
──────────────────────────────────────────────
┌─────────────────────────────────────────┐
│ Front desk                              │
│ ID: 1763279166216                       │
│                                         │
│ Min Staff Required: [2 ▼] staff/day    │
│                                         │
│ ☑ 🕌 Open on Friday                     │
│    Friday Min Staff: [1 ▼]             │
│                                  [🗑️]   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Payment Counter                         │
│ ID: payment-counter                     │
│                                         │
│ Min Staff Required: [2 ▼] staff/day    │
│                                         │
│ ☐ 🕌 Open on Friday                     │
│                                  [🗑️]   │
└─────────────────────────────────────────┘

[➕ Add Front Station]
[💾 Save All Stations]
```

---

## 🎯 How to Configure Front Desk

### Step 1: Set Regular Day Requirements
1. Go to **Stations Management** tab
2. Find your front desk station
3. Set **Min Staff Required**
   - Example: Registration needs 2 staff
   - Payment counter needs 2 staff
   - Info desk needs 1 staff

### Step 2: Configure Friday Coverage
1. Check **"🕌 Open on Friday"** for operational stations
2. Leave unchecked for closed stations
3. If checked, set **"Friday Min Staff"**
   - Usually lower than regular days
   - Example: 1 staff instead of 2

### Step 3: Save Configuration
1. Click **💾 Save All Stations**
2. Wait for success notification
3. Configuration applies to roster generation

---

## 💡 Example Setup

### Scenario: Hospital Front Desk

**Stations:**
```
Registration Counter
├── Min Staff: 2 (busy counter)
└── Friday: ☑ Open (1 staff - reduced hours)

Payment Counter  
├── Min Staff: 2 (essential service)
└── Friday: ☑ Open (1 staff - reduced hours)

Information Desk
├── Min Staff: 1 (single point)
└── Friday: ☐ Closed (not essential)

Triage Area
├── Min Staff: 1 (medical priority)
└── Friday: ☑ Open (1 staff - must operate)
```

**Result:**
- **Monday-Thursday:** 2+2+1+1 = 6 front staff needed
- **Friday:** 1+1+0+1 = 3 front staff needed

---

## 🔄 How Roster Generation Uses This

### Automatic Staff Allocation

**When you generate a roster:**
```
1. AI reads station configurations
2. For each day:
   - If regular day → assign min_staff
   - If Friday → check friday_enabled
     - If enabled → assign friday_min_staff
     - If disabled → skip station
3. Distribute available staff
4. Meet minimum requirements
5. Balance workload
```

**Smart Distribution:**
- Rotates staff through stations
- Ensures coverage at all times
- Respects Friday configurations
- Balances individual workload

---

## ✅ Testing Your Setup

### Quick Test Checklist

**PR Bot Features:**
- [ ] Click robot icon → Chat opens
- [ ] Logo is futuristic robot (not emoji)
- [ ] Header says "PR Bot"
- [ ] Click ⛶ → Full-screen mode
- [ ] Click ↗ → Opens new tab
- [ ] Both modes work independently

**Legend:**
- [ ] Open Schedule Management
- [ ] Legend visible in top-right corner
- [ ] Scroll schedule table down
- [ ] Legend stays fixed (doesn't scroll)
- [ ] All 15 leave types listed
- [ ] Colors match roster cells

**Front Desk Config:**
- [ ] Go to Stations Management
- [ ] See Front Stations section
- [ ] Minimum staff inputs visible
- [ ] Friday checkboxes work
- [ ] Changes save successfully
- [ ] Refresh page → settings persist

---

## 🎨 Visual Comparison

### Before vs After

**AI Assistant:**
```
BEFORE: 🤖 AI Assistant [Chat] [Close]
AFTER:  [Robot Logo] PR Bot [New Chat] [Full Screen] [New Tab] [Close]
```

**Legend Position:**
```
BEFORE:  [Date Header]
         📋 Legend: AL SL ML CL ST FREED
         ─────────────────────────────
         [Schedule Table]

AFTER:   [Date Header]              📋 Legend
         ─────────────────────────  ─────────
         [Schedule Table]            (Fixed)
```

**Front Stations:**
```
BEFORE:  Front desk
         ID: 123456
         [Delete]

AFTER:   Front desk
         ID: 123456
         Min Staff: [2] staff/day
         ☑ Open Friday: [1] staff
         [Delete]
```

---

## 🚀 Start Using Now!

### Quick Actions:

1. **Open PR Bot:**
   - Click purple robot icon (bottom-right)
   - Try asking: "How do I generate a roster?"

2. **Try Full-Screen:**
   - Open PR Bot
   - Click ⛶ button
   - Ask complex questions with more space

3. **Check Legend:**
   - Go to Schedule Management
   - Legend appears top-right automatically
   - Scroll table, legend stays visible

4. **Configure Front Desk:**
   - Navigate to Stations Management
   - Update minimum staff numbers
   - Enable Friday coverage as needed
   - Save changes

---

## 📞 Need Help?

**PR Bot is here to help!**

Try asking:
- "How do I use the new full-screen mode?"
- "Explain front desk minimum staff settings"
- "What do the leave colors mean?"
- "How does Friday coverage work?"

**PR Bot knows about:**
- All system features
- Configuration steps
- Troubleshooting tips
- Best practices

---

**Enjoy your upgraded system! 🎉**

*All features are production-ready and fully tested.*
