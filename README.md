# Hotel Reservation System

## Overview

The Hotel Reservation System is a web-based application designed to manage room bookings, availability checking, and reservation approvals. It provides an efficient and user-friendly interface for both guests and administrators.

The system integrates Google Apps Script as the backend and Google Sheets as the database, making it lightweight, scalable, and easy to maintain.

---

## Objectives

* To automate the hotel reservation process
* To prevent double bookings through availability checking
* To provide an admin-controlled approval system
* To compute total expenses including late checkout fees

---

## Key Features

### Reservation Management

* Submit reservation requests
* Capture guest details and booking schedule
* Store data in Google Sheets

### Availability Checking

* Real-time validation of room availability
* Prevents overlapping bookings
* Supports date and time-based reservations

### Admin Approval System

* Approve or decline reservation requests
* Professional admin dashboard interface
* Status tracking (Pending, Approved, Declined)

### Billing & Expense Calculation

* Automatic computation of:

  * Room rate
  * Number of nights
  * Late checkout fee (₱200/hour after 15-minute grace period)
* Displays total expenses clearly

### Room Information Display

* Shows room types, rates, and images
* User-friendly selection interface

---

## System Architecture

Frontend:

* HTML
* CSS (DLSL-inspired UI design)
* JavaScript

Backend:

* Google Apps Script (Web App API)

Database:

* Google Sheets

Deployment:

* GitHub Pages (Frontend)
* Google Apps Script (Backend API)

---

## How It Works

1. User submits a reservation request
2. System checks room availability via Apps Script
3. Reservation is stored in Google Sheets
4. Admin reviews request
5. Admin approves or declines the reservation
6. System calculates total expenses

---

## API Endpoints (Google Apps Script)

Base URL:

```id="w9rq3g"
https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### Actions:

* `listReservations` → Fetch all reservations
* `checkAvailability` → Validate booking schedule
* `updateReservationStatus` → Approve/Decline booking

---

## Installation & Setup

### 1. Clone Repository

```bash id="f3hzxq"
git clone https://github.com/Warriola32/HotelReservation-.git
cd HotelReservation-
```

### 2. Setup Google Apps Script

* Open Google Apps Script
* Create a new project
* Paste backend code
* Deploy as Web App
* Set access to **Anyone with link**

### 3. Connect Frontend to API

Update your JavaScript:

```js id="h0y5pb"
const API_URL = "YOUR_SCRIPT_WEB_APP_URL";
```

### 4. Run Frontend

* Open `index.html`
  OR
* Deploy using GitHub Pages

---

## Project Structure

```bash id="apcq9a"
HotelReservation-/
│── index.html
│── style.css
│── script.js
│── README.md
```

---

## Security Notes

* Do not expose sensitive script URLs publicly without restrictions
* Use validation on both frontend and backend
* Monitor access to Google Sheets

---

## Future Improvements

* User authentication system
* Payment integration
* Email notification for booking status
* Dashboard analytics for reservations

---

## Author

William Augustine Arriola
BS Computer Science – IoT
De La Salle Lipa

---

## License

This project is for academic and institutional use.
