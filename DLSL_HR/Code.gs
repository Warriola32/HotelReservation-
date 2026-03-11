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
    const reservationId = 'RES-' + new Date().getTime();

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
  MailApp.sendEmail("william_augustine_arriola@dlsl", "Test Email", "MailApp is working.");
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

  const subject = `DLSL Guest House Reservation Received - ${reservation.reservationId}`;

  const body =
`Dear ${reservation.fullName},

Thank you for your reservation request.

Here are your booking details:

Reservation ID: ${reservation.reservationId}
Room Type: ${reservation.roomType}
Check-In: ${reservation.checkIn} ${reservation.checkInTime}
Check-Out: ${reservation.checkOut} ${reservation.checkOutTime}
Total Expenses: ${reservation.totalExpenses}
Status: ${reservation.status}

Please note that your reservation is still subject to admin approval.

Thank you,
DLSL Guest House Reservation Portal`;

  MailApp.sendEmail(email, subject, body);
}
