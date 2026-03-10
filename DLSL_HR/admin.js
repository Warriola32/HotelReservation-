const SCRIPT_URL = "https://script.google.com/a/macros/dlsl.edu.ph/s/AKfycbw4UQ4seyvfqCP3b5i-bzOxDyBtU1jAxm5pBiGmd9h5frjS_d-nUvkYUi46bw7sp0qaCw/exec";
const recordsBody = document.getElementById("recordsBody");
const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const approvedCount = document.getElementById("approvedCount");
const declinedCount = document.getElementById("declinedCount");
const refreshBtn = document.getElementById("refreshBtn");
const adminMessage = document.getElementById("adminMessage");

async function loadReservations() {
  try {
    if (adminMessage) {
      adminMessage.textContent = "Loading reservations...";
      adminMessage.className = "form-message";
    }

    const response = await fetch(`${SCRIPT_URL}?action=listReservations&ts=${Date.now()}`);
    const result = await response.json();

    console.log("Admin API result full:", JSON.stringify(result, null, 2));
    console.log("success =", result.success);
    console.log("reservations =", result.reservations);;

    if (!result.success) {
      throw new Error(result.message || "Failed to load reservations.");
    }

    const reservations = Array.isArray(result.reservations) ? result.reservations : [];

    renderReservations(reservations);
    updateStats(reservations);

    if (adminMessage) {
      adminMessage.textContent = `Loaded ${reservations.length} reservation(s).`;
      adminMessage.className = "form-message success";
    }
  } catch (error) {
    console.error("Admin load error:", error);

    if (recordsBody) {
      recordsBody.innerHTML = `
        <tr>
          <td colspan="7" class="empty-state">${error.message}</td>
        </tr>
      `;
    }

    if (adminMessage) {
      adminMessage.textContent = error.message;
      adminMessage.className = "form-message error";
    }
  }
}

function updateStats(reservations) {
  const pending = reservations.filter(r => r["Status"] === "Pending Approval").length;
  const approved = reservations.filter(r => r["Status"] === "Approved").length;
  const declined = reservations.filter(r => r["Status"] === "Rejected" || r["Status"] === "Declined").length;

  if (totalCount) totalCount.textContent = reservations.length;
  if (pendingCount) pendingCount.textContent = pending;
  if (approvedCount) approvedCount.textContent = approved;
  if (declinedCount) declinedCount.textContent = declined;
}

function renderReservations(reservations) {
  if (!recordsBody) return;

  if (!Array.isArray(reservations) || reservations.length === 0) {
    recordsBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">No reservations found.</td>
      </tr>
    `;
    return;
  }

  recordsBody.innerHTML = reservations.map(r => {
    const reservationId = r["Reservation ID"] || "";
    const guest = r["Full Name"] || "";
    const stay = `${formatDate(r["Check-In"])} to ${formatDate(r["Check-Out"])}`;
    const room = r["Room Type"] || "";
    const status = r["Status"] || "";
    const statusClass = getStatusClass(status);
    const remarks = r["Admin Remarks"] || ""; 

    return `
      <tr>
        <td>${escapeHtml(reservationId)}</td>
        <td>${escapeHtml(guest)}</td>
        <td>${escapeHtml(stay)}</td>
        <td>${escapeHtml(room)}</td>
        <td><span class="status-badge ${statusClass}">${escapeHtml(status)}</span></td>        <td>
          <input type="text" id="remarks-${reservationId}" value="${escapeHtml(remarks)}" placeholder="Add remarks">
        </td>
        <td>
          <button type="button" onclick="updateStatus('${reservationId}','Approved')">Approve</button>
          <button type="button" onclick="updateStatus('${reservationId}','Rejected')">Decline</button>
        </td>
      </tr>
    `;
  }).join("");
}

async function updateStatus(reservationId, newStatus) {
  const remarksInput = document.getElementById(`remarks-${reservationId}`);
  const adminRemarks = remarksInput ? remarksInput.value : "";

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: "updateReservationStatus",
        reservationId,
        newStatus,
        adminRemarks,
        reviewedBy: "Admin"
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to update reservation.");
    }

    if (adminMessage) {
      adminMessage.textContent = result.message || "Reservation updated.";
      adminMessage.className = "form-message success";
    }

    loadReservations();
  } catch (error) {
    console.error("Status update error:", error);

    if (adminMessage) {
      adminMessage.textContent = error.message;
      adminMessage.className = "form-message error";
    }
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date)) return value;

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
}
function getStatusClass(status) {
  const value = String(status).toLowerCase();

  if (value === "approved") return "status-approved";
  if (value === "pending approval" || value === "pending") return "status-pending";
  if (value === "rejected" || value === "declined") return "status-declined";

  return "status-neutral";
}
if (refreshBtn) {
  refreshBtn.addEventListener("click", loadReservations);
}

loadReservations();