const SHEET_NAME = 'Reservations';

function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === "listReservations") {
      const data = getReservations();
      return jsonOutput({
        success: true,
        reservations: data
      });
    }

    if (action === "checkAvailability") {
      const result = checkAvailability(
        e.parameter.roomType,
        e.parameter.checkIn,
        e.parameter.checkInTime,
        e.parameter.checkOut,
        e.parameter.checkOutTime
      );
      return jsonOutput(result);
    }

    return jsonOutput({
      success: true,
      message: "Hotel Reservation API is running.",
      receivedAction: action || "none"
    });

  } catch (error) {
    return jsonOutput({
      success: false,
      message: error.toString()
    });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');

    if (payload.action === 'updateReservationStatus') {
      const result = updateReservationStatus(
        payload.reservationId,
        payload.newStatus,
        payload.adminRemarks,
        payload.reviewedBy
      );
      return jsonOutput(result);
    }

    const availabilityResult = checkAvailability(
      payload.roomType,
      payload.checkIn,
      payload.checkInTime,
      payload.checkOut,
      payload.checkOutTime
    );

    if (!availabilityResult.available) {
      return jsonOutput({
        success: false,
        message: availabilityResult.message || 'Selected room is already booked for this schedule.'
      });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet "${SHEET_NAME}" not found.`);
    }

    const data = payload;
const now = new Date();
const year = now.getFullYear();
const month = ("0" + (now.getMonth() + 1)).slice(-2);

const reservationCount = sheet.getLastRow();
const reservationNumber = ("00" + reservationCount).slice(-3);

const reservationId = `DLSL-${year}${month}${reservationNumber}`;

    sheet.appendRow([
  reservationId,
  new Date(),
  data.fullName || '',
  data.email || '',
  data.phone || '',
  data.affiliation || '',
  data.checkIn || '',
  data.checkInTime || '',
  data.checkOut || '',
  data.checkOutTime || '',
  data.guests || '',
  data.roomType || '',
  data.roomRate || '',
  data.nights || '',
  data.lateCheckoutFee || '',
  data.mattressFee || '',
  data.totalExpenses || '',
  data.specialRequests || '',
  'Pending Approval',
  '',
  '',
  ''
]);

    sendReservationEmail(data.email, {
  reservationId: reservationId,
  fullName: data.fullName || '',
  roomType: data.roomType || '',
  checkIn: data.checkIn || '',
  checkInTime: data.checkInTime || '',
  checkOut: data.checkOut || '',
  checkOutTime: data.checkOutTime || '',
  totalExpenses: data.totalExpenses || '',
  status: 'Pending Approval'
});

return jsonOutput({
  success: true,
  message: 'Reservation submitted successfully.',
  reservationId: reservationId,
  status: 'Pending Approval'
});

  } catch (error) {
    return jsonOutput({
      success: false,
      message: error.toString()
    });
  }
}

function getReservations() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found.`);

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];

  const headers = values[0];
  const rows = values.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

function checkAvailability(roomType, checkIn, checkInTime, checkOut, checkOutTime) {
  const ROOM_INVENTORY = {
    "Standard Room": 8,
    "Executive Room": 8,
    "Family Suite": 8,
    "Event Place": 1
  };

  if (!roomType || !checkIn || !checkInTime || !checkOut || !checkOutTime) {
    return {
      success: true,
      available: false,
      message: 'Please complete room type, check-in, and check-out schedule.'
    };
  }

  const requestedStart = parseDateTime(checkIn, checkInTime);
  const requestedEnd = parseDateTime(checkOut, checkOutTime);

  if (!requestedStart || !requestedEnd || requestedEnd <= requestedStart) {
    return {
      success: true,
      available: false,
      message: 'Invalid check-in or check-out date/time.'
    };
  }

  const totalRooms = ROOM_INVENTORY[roomType] || 0;

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found.`);

  const values = sheet.getDataRange().getValues();
  if (values.length < 2) {
    return {
      success: true,
      available: true,
      availableRooms: totalRooms,
      message: `${totalRooms} room(s) available.`
    };
  }

  const headers = values[0];
  const rows = values.slice(1);

  const roomCol = headers.indexOf('Room Type');
  const checkInCol = headers.indexOf('Check-In');
  const checkInTimeCol = headers.indexOf('Check-In Time');
  const checkOutCol = headers.indexOf('Check-Out');
  const checkOutTimeCol = headers.indexOf('Check-Out Time');
  const statusCol = headers.indexOf('Status');

  if ([roomCol, checkInCol, checkInTimeCol, checkOutCol, checkOutTimeCol, statusCol].includes(-1)) {
    throw new Error('Required sheet columns for availability checking are missing.');
  }

  let overlappingCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    const existingRoomType = row[roomCol];
    const existingStatus = String(row[statusCol] || '').trim();

    if (existingRoomType !== roomType) continue;
    if (existingStatus === 'Rejected' || existingStatus === 'Declined') continue;

    const existingStart = parseSheetDateTime(row[checkInCol], row[checkInTimeCol]);
    const existingEnd = parseSheetDateTime(row[checkOutCol], row[checkOutTimeCol]);

    if (!existingStart || !existingEnd) continue;

    const isOverlapping = requestedStart < existingEnd && requestedEnd > existingStart;

    if (isOverlapping) {
      overlappingCount++;
    }
  }

  const availableRooms = totalRooms - overlappingCount;

  if (availableRooms <= 0) {
    return {
      success: true,
      available: false,
      availableRooms: 0,
      message: `${roomType} is fully booked for the selected date and time.`
    };
  }

  return {
    success: true,
    available: true,
    availableRooms: availableRooms,
    message: `${availableRooms} room(s) available for ${roomType}.`
  };
}

function updateReservationStatus(reservationId, newStatus, adminRemarks, reviewedBy) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found.`);

  const values = sheet.getDataRange().getValues();
  const headers = values[0];

  const idCol = headers.indexOf('Reservation ID') + 1;
  const statusCol = headers.indexOf('Status') + 1;
  const remarksCol = headers.indexOf('Admin Remarks') + 1;
  const reviewedByCol = headers.indexOf('Reviewed By') + 1;
  const reviewedAtCol = headers.indexOf('Reviewed At') + 1;

  if (!idCol || !statusCol || !remarksCol || !reviewedByCol || !reviewedAtCol) {
    throw new Error('One or more required columns are missing in the Reservations sheet.');
  }

  for (let row = 2; row <= values.length; row++) {
    if (sheet.getRange(row, idCol).getValue() === reservationId) {
      sheet.getRange(row, statusCol).setValue(newStatus || 'Pending Approval');
      sheet.getRange(row, remarksCol).setValue(adminRemarks || '');
      sheet.getRange(row, reviewedByCol).setValue(reviewedBy || 'Admin');
      sheet.getRange(row, reviewedAtCol).setValue(new Date());

      const guestEmail = sheet.getRange(row, headers.indexOf('Email') + 1).getValue();
      const guestName = sheet.getRange(row, headers.indexOf('Full Name') + 1).getValue();
      const roomType = sheet.getRange(row, headers.indexOf('Room Type') + 1).getValue();
      const checkIn = sheet.getRange(row, headers.indexOf('Check-In') + 1).getValue();
      const checkInTime = sheet.getRange(row, headers.indexOf('Check-In Time') + 1).getValue();
      const checkOut = sheet.getRange(row, headers.indexOf('Check-Out') + 1).getValue();
      const checkOutTime = sheet.getRange(row, headers.indexOf('Check-Out Time') + 1).getValue();
      const totalExpenses = sheet.getRange(row, headers.indexOf('Total Expenses') + 1).getValue();

      if (newStatus === 'Approved') {
        sendApprovalEmail(guestEmail, {
          reservationId: reservationId,
          fullName: guestName,
          roomType: roomType,
          checkIn: checkIn,
          checkInTime: checkInTime,
          checkOut: checkOut,
          checkOutTime: checkOutTime,
          totalExpenses: totalExpenses,
          adminRemarks: adminRemarks || ''
        });
      }

      if (newStatus === 'Rejected' || newStatus === 'Declined') {
        sendRejectionEmail(guestEmail, {
          reservationId: reservationId,
          fullName: guestName,
          roomType: roomType,
          checkIn: checkIn,
          checkInTime: checkInTime,
          checkOut: checkOut,
          checkOutTime: checkOutTime,
          adminRemarks: adminRemarks || 'The requested reservation could not be accommodated at this time.'
        });
      }

      return {
        success: true,
        message: 'Reservation updated successfully.'
      };
    }
  }

  return {
    success: false,
    message: 'Reservation ID not found.'
  };
}

function testEmailPermission() {
  MailApp.sendEmail("william_augustine_arriola@dlsl.edu.ph", "Test Email", "MailApp is working.");
}


function parseDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  return new Date(dateValue + 'T' + timeValue);
}

function parseSheetDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;

  const datePart = Utilities.formatDate(new Date(dateValue), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const timePart = normalizeTimeValue(timeValue);

  if (!timePart) return null;

  return new Date(datePart + 'T' + timePart);
}

function normalizeTimeValue(value) {
  if (!value) return '';

  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm:ss');
  }

  const text = String(value).trim();

  if (/^\d{1,2}:\d{2}$/.test(text)) return text + ':00';
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(text)) return text;

  return '';
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function sendReservationEmail(email, reservation) {
  if (!email) return;

  const subject = `Reservation Received | DLSL Guest House`;

  const body =
`Dear ${reservation.fullName},

Greetings from De La Salle Lipa Guest House.

This is to confirm that we have successfully received your reservation request.

Reservation Details:
Reservation ID: ${reservation.reservationId}
Room Type: ${reservation.roomType}
Check-In: ${reservation.checkIn} ${reservation.checkInTime}
Check-Out: ${reservation.checkOut} ${reservation.checkOutTime}
Estimated Total: ${reservation.totalExpenses}

Current Status:
PENDING APPROVAL

Your reservation is now under review by the Guest House administration. You will receive another email once your request has been approved or declined.

Thank you for choosing De La Salle Lipa Guest House.

Sincerely,
DLSL Guest House Reservation Team`;

  MailApp.sendEmail(email, subject, body);
}

function sendApprovalEmail(email, reservation) {
  if (!email) return;

  const subject = `Reservation Approved | DLSL Guest House`;

  const body =
`Dear ${reservation.fullName},

Greetings from De La Salle Lipa Guest House.

We are pleased to inform you that your reservation has been APPROVED.

Reservation Details:
Reservation ID: ${reservation.reservationId}
Room Type: ${reservation.roomType}
Check-In: ${reservation.checkIn} ${reservation.checkInTime}
Check-Out: ${reservation.checkOut} ${reservation.checkOutTime}
Total Amount Due: ${reservation.totalExpenses}

PAYMENT PROCEDURE
Please proceed with payment using the official payment channel below.


Payment QR Code / Payment Link:
https://drive.google.com/your-qr-link

Payment Online Banking: 
Bank Name: BDO
Account Name: DLSL Guest House
Account Number: 1234567890
GCash Number: 09XXXXXXXXX

Additional Notes:
${reservation.adminRemarks || 'Please complete your payment and send proof of payment for verification.'}

Thank you, and we look forward to welcoming you to De La Salle Lipa Guest House.

Sincerely,
DLSL Guest House Administration`;

  MailApp.sendEmail(email, subject, body);
}

function sendRejectionEmail(email, reservation) {
  if (!email) return;

  const subject = `Reservation Update | DLSL Guest House`;

  const body =
`Dear ${reservation.fullName},

Greetings from De La Salle Lipa Guest House.

We regret to inform you that your reservation request has not been approved.

Reservation Details:
Reservation ID: ${reservation.reservationId}
Room Type: ${reservation.roomType}
Check-In: ${reservation.checkIn} ${reservation.checkInTime}
Check-Out: ${reservation.checkOut} ${reservation.checkOutTime}

Reason / Admin Remarks:
${reservation.adminRemarks || 'The requested reservation could not be accommodated at this time.'}

You may submit a new reservation request for another schedule if desired.

Thank you for your understanding.

Sincerely,
DLSL Guest House Administration`;

  MailApp.sendEmail(email, subject, body);
}
