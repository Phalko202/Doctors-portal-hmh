# Implementation Plan - Comprehensive Fixes

## Status: IN PROGRESS ✅

### COMPLETED (Just Now)
1. ✅ **Legend only in Schedule view** - Shows/hides automatically
2. ✅ **Legend with full names** - Displays first 5 + "View All" button  
3. ✅ **Legend popup modal** - Shows all 15 leave types with full names and descriptions
4. ✅ **Hide legend on view switch** - Automatically hides when leaving schedule

### IN PROGRESS (Next Steps)

#### 4. Front Desk Shift Knowledge (Like Clinical)
**Current:** Front desk stations have min_staff but no shift templates
**Need:** Complete shift knowledge system like clinical:
- Categories (Morning, Evening, Night)
- Shifts with time slots
- Configurable slots per shift
- Friday coverage with shift selection

**Implementation:**
- Modify `prShiftTemplates` to include proper front desk shifts
- Add category/shift UI for front desk in Shift Knowledge tab
- Allow adding categories and shifts for front desk team
- Friday coverage: Select which shifts operate + staff per shift

#### 5. Friday Coverage - Counter Selection
**Current:** Global friday_enabled toggle per station
**Need:** Per-shift Friday configuration:
- Select which front desk shifts operate on Friday
- Set staff numbers for each selected shift
- Granular control over Friday operations

**Implementation:**
- Add Friday shift selector UI
- Multi-select checkboxes for shifts
- Staff count input per selected shift
- Save to `prShiftTemplates[front].friday`

#### 6. AI Rules Configuration (Not Hardcoded)
**Current:** No AI rules defined
**Need:** Configurable weekly rules:
- Minimum 2 offs per week per staff
- ED (Emergency Duty) allocation rules
- No repeated ED in same week
- Off/On-call/ED combinations

**Implementation:**
- Add "AI Rules" tab UI with form fields
- Store rules in `data/ai_rules.json` or in pr_staff.json
- Fields:
  - Min weekly offs: number input (default: 2)
  - Allow ED duty: checkbox
  - Max ED per week: number (default: 1)
  - ED blackout days: multi-select
  - Off day preferences
- Load/save to backend

#### 7. Fix PR Bot Full-Screen/New Tab
**Current:** Functions defined but may have issues
**Need:** Fully functional modes

**Check:**
- Test full-screen toggle
- Test new tab opening
- Verify chat state persistence
- Ensure UI works in both modes

#### 8. New PR Bot Logo
**Current:** Futuristic robot SVG
**User Request:** Different logo

**Options:**
- Medical cross with AI circuit pattern
- Stethoscope with tech elements  
- Hospital building with AI glow
- Healthcare shield with bot face
- **Ask user for preference**

## Next Immediate Actions

1. **Implement Front Desk Shift Templates UI**
   - Copy clinical shift knowledge structure
   - Add front desk categories/shifts management
   - Wire up save/load functions

2. **Friday Coverage Counter Selection**
   - Create shift selection modal for Friday
   - Allow checking which shifts operate
   - Add staff count per shift inputs
   - Save to dedicated Friday config

3. **AI Rules Tab** 
   - Create form interface
   - Add rule configuration fields
   - Implement save to JSON
   - Load rules on AI generator

4. **PR Bot Fixes**
   - Test and debug full-screen mode
   - Test new tab functionality  
   - Fix any state/UI issues

5. **Logo Update**
   - Get user input on preferred style
   - Generate new SVG logo
   - Update widget and chat header

## Files to Modify

### JavaScript
- `static/js/pr_portal_light.js` - Main changes
- `static/js/ai-assistant.js` - Bot fixes

### CSS  
- `static/css/ai-assistant.css` - Logo styles

### Data
- `data/pr_staff.json` - Add AI rules section
- New: `data/ai_rules.json` (optional)

### Templates
- `templates/pr_portal_light.html` - May need modal additions

## Testing Plan

### Legend
- [x] Shows only in Schedule view
- [x] Hides in other views
- [x] View All button opens modal
- [x] Modal shows all 15 types with full names
- [x] Modal closes properly

### Front Desk Shifts (To Test)
- [ ] Can add categories for front desk
- [ ] Can add shifts to categories
- [ ] Shifts have slots configuration
- [ ] Saves and loads correctly
- [ ] Friday coverage works with shifts

### Friday Coverage (To Test)
- [ ] Can select specific counters/shifts for Friday
- [ ] Can set staff count per counter
- [ ] Saves configuration
- [ ] AI respects Friday settings

### AI Rules (To Test)
- [ ] Form loads with default values
- [ ] Can modify all rule parameters
- [ ] Saves to storage
- [ ] AI generator uses rules
- [ ] Validation works correctly

### PR Bot (To Test)
- [ ] Full-screen button toggles correctly
- [ ] New tab opens and works
- [ ] Chat history independent in new tab
- [ ] Can minimize from full-screen
- [ ] No console errors

### Logo (To Test)
- [ ] New logo displays in widget
- [ ] Logo displays in chat header
- [ ] Animations work smoothly
- [ ] Looks good on all backgrounds

## Timeline Estimate

- Front Desk Shifts: 20 minutes
- Friday Counter Selection: 15 minutes  
- AI Rules Configuration: 25 minutes
- PR Bot Fixes: 10 minutes
- Logo Update: 5 minutes (after user input)

**Total:** ~75 minutes

## Current Focus
**Working on:** Front Desk Shift Knowledge implementation

Will proceed systematically through each feature...
