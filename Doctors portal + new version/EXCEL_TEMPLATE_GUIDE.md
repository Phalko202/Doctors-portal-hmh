# Doctor Schedule Excel Template Guide

## Proper Excel Template Format

### ✅ Correct Column Structure

Your Excel file should have these columns in order:

| Date | Doctor | Start Time | Room | Total Patients | Before Break OPD Timing | Before Break OPD Patients | Breaks | After Break OPD Timing | After Break OPD Patients | Status |
|------|--------|------------|------|----------------|------------------------|---------------------------|--------|------------------------|-------------------------|--------|

### 📋 Column Definitions

1. **Date**: Format as `DD/MM/YYYY` or `YYYY-MM-DD` (e.g., `06/11/2025` or `2025-11-06`)
2. **Doctor**: Full doctor name (e.g., `Dr. Aminath Munaza`)
3. **Start Time**: 24-hour format (e.g., `08:00` or `8:00`)
4. **Room**: Room number or name (e.g., `Room 1`, `R1`)
5. **Total Patients**: Total number of patients for the day (e.g., `20`)
6. **Before Break OPD Timing**: Time range (e.g., `8:00-11:00`)
7. **Before Break OPD Patients**: Patient count (e.g., `10`)
8. **Breaks**: Break time range (e.g., `11:00-14:00`)
9. **After Break OPD Timing**: Time range (e.g., `14:00-17:00`)
10. **After Break OPD Patients**: Patient count (e.g., `10`)
11. **Status**: `ON DUTY`, `OFF`, `ON CALL`, `POST ON CALL`, etc.

### 🎨 Formatting Tips

#### 1. Fix the Sliding Header Issue
- Freeze the blue title row, the green date banner, and the Date column:
	1) View → Freeze Panes → Unfreeze Panes (if already frozen)
	2) Click on cell B3 (the cell to the right of the Date column and below the green date banner)
	3) View → Freeze Panes → Freeze Panes
- This keeps the first two rows and the Date column fixed while scrolling

#### 2. Center the Specialty Section Headers
- Select the merged cell for "Internal Medicine", "Paediatrics", etc.
- Use Center Align (Ctrl+E or click center align button)
- Set vertical alignment to Middle

#### 3. Fix the Blue Title Row
- Select the title row ("Doctor Schedule Template...")
- Use Format Cells → Alignment → Center Across Selection
- Or merge and center the cells

#### 4. Date Progression
The system will automatically handle dates. You can structure your Excel in two ways:

**Method 1: Date Column for Each Row**
```
Date       | Doctor              | Start Time | ...
06/11/2025 | Dr. Aminath Munaza  | 08:00      | ...
06/11/2025 | Dr. Cho Thway Mon   | 09:00      | ...
07/11/2025 | Dr. Aminath Munaza  | 08:00      | ...
07/11/2025 | Dr. Cho Thway Mon   | 09:00      | ...
```

**Method 2: Date Declaration Rows (Grouped Template)**
```
06/11/2025
Doctor              | Start Time | Room | ...
Dr. Aminath Munaza  | 08:00      | R1   | ...
Dr. Cho Thway Mon   | 09:00      | R2   | ...

07/11/2025
Doctor              | Start Time | Room | ...
Dr. Aminath Munaza  | 08:00      | R1   | ...
Dr. Cho Thway Mon   | 09:00      | R2   | ...
```

### ⚠️ Common Issues to Avoid

1. **Don't use merged cells in data rows** - Only merge for section headers
2. **Don't combine time and patient count** - Use separate columns
3. **Use consistent date format** - Stick to one format throughout
4. **Don't leave empty rows** - Remove blank rows between data
5. **Keep headers simple** - Avoid special characters in column names

### 📝 Example Template Structure

```
[Merged across all columns, centered]
Doctor Schedule Template (2025-11-06 to 2025-11-07)

[Section header, green background, centered]
Internal Medicine

[Data headers]
Date | Doctor | Start Time | Room | Total Patients | Before Break OPD Timing | Before Break OPD Patients | Breaks | After Break OPD Timing | After Break OPD Patients | Status

[Data rows for Internal Medicine]
06/11/2025 | Dr. Aminath Munaza | 8:00 | R1 | 20 | 8:00-11:00 | 10 | 11:00-14:00 | 14:00-17:00 | 10 | ON DUTY
06/11/2025 | Dr. Cho Thway Mon  | 9:00 | R2 | 15 | 9:00-12:00 | 8  | 12:00-14:00 | 14:00-16:00 | 7  | ON DUTY

[Section header, green background, centered]
Paediatrics

[Data headers - repeat for each section]
Date | Doctor | Start Time | Room | Total Patients | Before Break OPD Timing | Before Break OPD Patients | Breaks | After Break OPD Timing | After Break OPD Patients | Status

[Data rows for Paediatrics]
06/11/2025 | Dr. Alaa Adel Ahmed | 8:00 | P1 | 25 | 8:00-11:00 | 12 | 11:00-14:00 | 14:00-17:00 | 13 | ON DUTY
```

### 🔧 Quick Fixes in Excel

#### To Fix Frozen Columns Issue:
1. View → Freeze Panes → Unfreeze Panes
2. Click on cell B3 (freezes rows 1–2 and column A)
3. View → Freeze Panes → Freeze Panes

#### To Center Section Headers:
1. Select the merged cell
2. Home → Alignment → Center (horizontal)
3. Home → Alignment → Middle (vertical)

#### To Fix Title Row:
1. Select row 1
2. Merge & Center across all columns
3. Apply blue background color
4. Set font to white, bold, size 14-16

### 🎯 Best Practices

1. **Use the new separate column format** for timing and patients
2. **Keep consistent formatting** across all sections
3. **Test with a small sample** before uploading full schedule
4. **Check preview statistics** after upload to verify parsing
5. **Use the File Manager** to organize multiple schedule files

---

**Need Help?** Check the upload preview statistics to see if all rows are being parsed correctly.
