# PR Portal - Clinical Duty Roster System

## Overview
The PR Portal is a comprehensive clinical duty roster management system designed exclusively for Patient Relations (PR) staff. It integrates with the doctor scheduling system to intelligently assign PR clinical staff to various duty stations based on doctor availability.

## Features

### 🏥 Clinical Duty Roster
The main feature that allows you to manage clinical staff duty assignments.

**Key Capabilities:**
- **Visual Calendar View**: Modern calendar-style roster showing all staff assignments
- **Color-Coded System**: Each leave type has a distinct color for easy identification
- **Interactive Editing**: Click any cell to edit duty assignments
- **Date Range Selection**: View and manage rosters for any date range

**Duty Types:**
- **ON DUTY**: Staff assigned to a specific clinical station
- **OFF**: Scheduled off day
- **LEAVE**: Various leave types (AL, FRL, SL, etc.)

### 🤖 AI Duty Generation
Intelligent algorithm that automatically generates fair and balanced duty rosters.

**AI Algorithm Features:**
1. **Doctor-Based Assignment**: Assigns staff based on doctors on duty each day
2. **Workload Balancing**: Ensures fair distribution across all staff
3. **Weekly Limits**: Maximum 5 duty days per week per staff
4. **Consecutive Day Management**: Prevents staff burnout (max 3 consecutive days)
5. **Off Day Guarantee**: Ensures at least 2 off days per week
6. **Smart Specialty Distribution**: Avoids assigning same specialty consecutively
7. **Leave Respect**: Preserves existing leave requests when generating

**How to Use:**
1. Click "Generate Duty (AI)" button
2. Select date range
3. System will automatically assign duties based on doctor schedules
4. Review and manually adjust if needed

### 👥 Staff Management
Complete staff administration system.

**Features:**
- Add new staff members
- Assign roles: Clinical, Front Desk, or Both
- Assign specific stations to staff
- Edit or delete existing staff
- Track staff status (active/inactive)

**Staff Roles:**
- **Clinical Staff**: Assigned to clinical duty rosters
- **Front Desk Staff**: For front desk operations (coming soon)

### 🧠 Station Knowledge Base
Centralized management of all duty stations.

**Station Types:**

1. **Clinical Stations**
   - Automatically synced from doctor specialties
   - Custom clinical stations can be added
   - Examples: Orthopaedics, Internal Medicine, Gynaecology, etc.

2. **Front Desk Stations** (Custom Only)
   - OPD Counter
   - Triage Counter
   - Registration
   - etc.

**Station Features:**
- Color coding for visual identification
- Auto-import from doctor portal
- Custom station creation
- Easy deletion of custom stations

### 🎨 Leave Type Color Coding
Visual system for quick leave identification.

| Code | Leave Type | Color |
|------|-----------|-------|
| PML | Paternity/Maternity Leave | Pink |
| AL | Annual Leave | Light Green |
| FRL | Family Leave | Light Pink |
| EXC | Exam Leave | Tomato |
| MI | Medical Issue | Red |
| OR | Official Request | Orange |
| SWP | Swap | Sky Blue |
| SWPL | Swap Leave | Steel Blue |
| NP | No Pay | Violet |
| CL | Casual Leave | Pale Green |
| AB | Absent | Hot Pink |
| SL | Sick Leave | Gold |
| ML | Medical Leave | Light Salmon |
| OC | On Call | Orchid |
| AC | Additional Coverage | Turquoise |

## Usage Guide

### Getting Started

1. **Access the Portal**
   - Login to the admin panel
   - Click "Open PR Portal" in the sidebar
   - Or navigate to `/pr-portal`

2. **Add Staff Members**
   - Go to "Staff Management"
   - Click "Add Staff Member"
   - Enter name, select roles, assign stations
   - Save

3. **Configure Stations**
   - Go to "Station Knowledge Base"
   - Clinical stations are auto-imported from doctors
   - Add custom stations as needed
   - Assign color codes for visual clarity

4. **Create Roster**
   
   **Option A: Manual Entry**
   - Select date range
   - Click "Load Roster"
   - Click on any cell to edit
   - Select duty type (Duty/Leave/Off)
   - Assign station or leave type
   - Save

   **Option B: AI Generation**
   - Click "Generate Duty (AI)"
   - Select date range
   - Confirm generation
   - System creates balanced roster automatically
   - Review and adjust manually if needed

### Best Practices

1. **Setup Phase**
   - Add all staff members first
   - Configure custom stations before generating rosters
   - Set up leave types if custom ones needed

2. **Roster Management**
   - Use AI generation for initial roster creation
   - Manually adjust for special circumstances
   - Review generated rosters before finalizing
   - Handle leave requests by editing specific dates

3. **Regular Maintenance**
   - Update staff status when members join/leave
   - Add new custom stations as departments expand
   - Review AI-generated rosters periodically

## Technical Details

### Data Storage
- **Staff Data**: `/data/pr_staff.json`
- **Roster Data**: `/data/pr_clinical_roster.json`
- **Leave Types**: Configured in `pr_staff.json`

### API Endpoints
- `GET /api/pr/staff` - List all staff
- `POST /api/pr/staff` - Create staff
- `PUT /api/pr/staff/<id>` - Update staff
- `DELETE /api/pr/staff/<id>` - Delete staff
- `GET /api/pr/stations` - List stations
- `POST /api/pr/stations` - Create station
- `DELETE /api/pr/stations/<id>` - Delete station
- `GET /api/pr/roster/clinical` - Get roster
- `POST /api/pr/roster/clinical` - Save assignment
- `POST /api/pr/roster/clinical/generate` - AI generate roster

### Doctor Schedule Integration
The system automatically reads doctor schedules from the main doctor portal:
- Pulls specialty information
- Checks daily doctor availability
- Uses this data for intelligent staff assignment

## AI Algorithm Details

### Assignment Logic

```
For each date in range:
  1. Get doctors on duty for that date
  2. Extract unique specialties from doctors
  3. Get available staff (not on leave, under weekly limit)
  4. Calculate needed assignments (match doctor count)
  5. Sort staff by workload (least worked first)
  6. Assign staff to specialties:
     - Prefer different specialty than last time
     - Balance across all specialties
     - Track consecutive days
  7. Mark unassigned staff as OFF
  8. Reset weekly counters on Monday
```

### Balancing Rules

- **Maximum 5 duty days per week** per staff
- **Minimum 2 off days per week** per staff
- **Maximum 3 consecutive duty days** before forced break
- **Fair distribution** across all available specialties
- **Workload tracking** for long-term fairness

### Smart Features

1. **Consecutive Day Prevention**: After 3 days, staff gets off day
2. **Specialty Rotation**: Avoids same specialty repeatedly
3. **Load Balancing**: Tracks total duties and assigns least-worked staff first
4. **Leave Preservation**: Existing leave requests are never overwritten
5. **Weekly Reset**: Counters reset every Monday for fresh week

## Troubleshooting

### Common Issues

**Problem**: No staff showing in roster
- **Solution**: Add staff members in Staff Management first
- Ensure staff have "Clinical" role assigned

**Problem**: AI generation creates no assignments
- **Solution**: Check if doctors are scheduled for selected dates
- Verify staff members exist with clinical role
- Ensure date range is correct

**Problem**: Station not appearing in dropdown
- **Solution**: Check Station Knowledge Base
- Custom stations must be created manually
- Doctor specialties auto-sync from doctor portal

**Problem**: Can't edit roster cell
- **Solution**: Ensure date range is loaded first
- Check if staff member is active
- Verify proper permissions (PR staff only)

## Future Enhancements

- ✅ Clinical Duty Roster (Completed)
- ⏳ Front Desk Duty Roster (Coming Soon)
- ⏳ Mobile-responsive view
- ⏳ Export to Excel functionality
- ⏳ SMS notifications for duty assignments
- ⏳ Staff availability preferences
- ⏳ Advanced AI with machine learning
- ⏳ Performance analytics and reports

## Support

For technical support or feature requests, contact your system administrator.

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Developed For**: Patient Relations Department
