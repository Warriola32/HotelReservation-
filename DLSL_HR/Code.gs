const SHEET_NAME = 'Reservations';

function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'getReservations') {
      return jsonResponse({ success: true, data: getReservations() });
    }

    return jsonResponse({ success: false, message: 'Invalid GET action.' });
  } catch (error) {
    return jsonResponse({ success: false, message: error.message });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const action = payload.action;
    const data = payload.data || {};

    if (action === 'createReservation') {
      const reservationId = createReservation(data);
      return jsonResponse({ success: true, message: 'Reservation saved.', reservationId: reservationId });
    }

    if (action === 'updateReservationStatus') {
      updateReservationStatus(data);
      return jsonResponse({ success: true, message: 'Reservation updated.' });
    }

    return jsonResponse({ success: false, message: 'Invalid POST action.' });
  } catch (error) {
    return jsonResponse({ success: false, message: error.message });
  }
}

function createReservation(data) {
  validateReservation(data);
  const sheet = getOrCreateSheet();
  const reservationId = 'DLSL-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss');
  const now = new Date();

  sheet.appendRow([
    reservationId,
    now,
    data.fullName,
    data.email,
    data.phone,
    data.affiliation,
    data.checkIn,
    data.checkOut,
    data.roomType,
    data.guests,
    data.specialRequests || '',
    'Pending',
    '',
    ''
  ]);

  return reservationId;
}

function getReservations() {
  const sheet = getOrCreateSheet();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  const headers = values[0];
  return values.slice(1).map(function(row, index) {
    const obj = {};
    headers.forEach(function(header, i) {
      obj[header] = row[i];
    });

    return {
      rowNumber: index + 2,
      reservationId: obj.reservationId,
      submittedAt: obj.submittedAt,
      fullName: obj.fullName,
      email: obj.email,
      phone: obj.phone,
      affiliation: obj.affiliation,
      checkIn: obj.checkIn,
      checkOut: obj.checkOut,
      roomType: obj.roomType,
      guests: obj.guests,
      specialRequests: obj.specialRequests,
      status: obj.status,
      remarks: obj.remarks,
      reviewedBy: obj.reviewedBy
    };
  }).sort(function(a, b) {
    return String(a.status).localeCompare(String(b.status));
  });
}

function updateReservationStatus(data) {
  if (!data.rowNumber) throw new Error('Row number is required.');
  const sheet = getOrCreateSheet();
  sheet.getRange(data.rowNumber, 12).setValue(data.status || 'Pending');
  sheet.getRange(data.rowNumber, 13).setValue(data.remarks || '');
  sheet.getRange(data.rowNumber, 14).setValue(data.reviewedBy || 'Admin');
}

function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, 14).setValues([[
      'reservationId',
      'submittedAt',
      'fullName',
      'email',
      'phone',
      'affiliation',
      'checkIn',
      'checkOut',
      'roomType',
      'guests',
      'specialRequests',
      'status',
      'remarks',
      'reviewedBy'
    ]]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function validateReservation(data) {
  const requiredFields = ['fullName', 'email', 'phone', 'affiliation', 'checkIn', 'checkOut', 'roomType', 'guests'];
  requiredFields.forEach(function(field) {
    if (!data[field]) {
      throw new Error('Missing required field: ' + field);
    }
  });

  if (new Date(data.checkOut) <= new Date(data.checkIn)) {
    throw new Error('Check-out date must be later than check-in date.');
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
