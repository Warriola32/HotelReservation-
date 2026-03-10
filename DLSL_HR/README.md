I made reservation website concept for **De La Salle Lipa**, using:

- **HTML, CSS, JavaScript** for the frontend
- **Google Apps Script** for the backend API
- **Google Sheets** as the reservation database
- **Pending approval admin workflow**

## Included Files

- `index.html` - public booking page
- `admin.html` - admin dashboard for approval workflow
- `styles.css` - DLSL-inspired styling
- `script.js` - booking form submission logic
- `admin.js` - admin dashboard logic
- `Code.gs` - Apps Script backend for Google Sheets

## Google Sheets Setup

1. Create a new Google Sheet.
2. Open **Extensions > Apps Script**.
3. Replace the default script with the contents of `Code.gs`.
4. Save the project.
5. Deploy as **Web App**:
   - Execute as: **Me**
   - Who has access: **Anyone** or **Anyone with the link**
6. Copy the deployed web app URL.

## Frontend Setup

1. Open `script.js` and `admin.js`.
2. Replace:
   - `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE`
3. Host the HTML files on:
   - GitHub Pages
   - Netlify
   - Vercel
   - or any local/institutional web server

## Approval Workflow

- Every new reservation is saved with status **Pending**.
- Admin opens `admin.html`.
- Admin reviews each request and changes status to:
  - `Approved`
  - `Declined`
  - or keep `Pending`
- Remarks and reviewer name are stored in the sheet.

## Recommended Enhancements

- Add email notifications using `MailApp.sendEmail()`
- Add room availability logic
- Add login protection for the admin page
- Separate approved reservations into another sheet or dashboard
- Add printable confirmation slips

## DLSL Visual Direction

The design uses a Lasallian green-led palette, formal institutional spacing, and a clean academic-professional tone inspired by De La Salle Lipa's public website and mission presentation. Exact institutional brand assets should be replaced with official DLSL files if available.
