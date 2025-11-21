# How to Upload Promotional Poster Images for Doctors

## ✅ The Feature is ALREADY IMPLEMENTED!

### Step-by-Step Instructions:

1. **Open Admin Panel** → Log in to the admin panel
2. **Click "Doctors" Menu** (in the left sidebar)
3. **Click on ANY doctor** from the list
4. **Scroll down in the modal** past the doctor form fields
5. **You'll see TWO upload sections:**
   - **Profile Photo** - Small doctor photo
   - **Promotional Poster (Patient Display)** - Full-screen background image ✨

### To Upload a Promotional Poster:

1. In the **"Promotional Poster (Patient Display)"** section
2. Click **"Choose Poster Image"** button
3. Select the full-screen promotional image (like the one in your reference image)
4. Click **"Upload"** button
5. You'll see a success message "Promotional poster uploaded"

### Technical Details:

- **Upload endpoint:** `/api/doctors/<doctor_id>/promo` (POST)
- **Image endpoint:** `/doctor-promo/<doctor_id>` (GET)
- **Storage location:** `uploads/doctor_promos/`
- **Supported formats:** PNG, JPG, JPEG, WEBP, GIF
- **Fallback:** If no promo image exists, uses regular profile photo, then default image

### Patient Display Behavior:

- **ALL doctors** appear in the slideshow rotation
- **Schedule overlay** (date, OPD start time, break time, room) ONLY appears if that specific doctor has schedule data for the current/selected date
- **Images are full-screen** using the uploaded promotional posters
- **Auto-rotation** based on slide interval setting (default: 5 seconds)

### Notes:

- Each doctor can have their own unique promotional poster
- As doctors are added/removed from doctors.json, the slideshow updates automatically
- The promo_version field tracks when images are updated for cache-busting
- No special configuration needed - just upload and it works!
