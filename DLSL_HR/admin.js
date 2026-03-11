const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-DIdEEtt29ga7aSjrx4E5Ay2S2xzbrMmf7hsBPi7sPO9XEk7BdM4nd4GnmBNa-UUmxw/exec";

const recordsBody = document.getElementById("recordsBody");
const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const approvedCount = document.getElementById("approvedCount");
const declinedCount = document.getElementById("declinedCount");
const revenueCount = document.getElementById("revenueCount");

const refreshBtn = document.getElementById("refreshBtn");
const adminMessage = document.getElementById("adminMessage");

const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const roomFilter = document.getElementById("roomFilter");
const clearFiltersBtn = document.getElementById("clearFiltersBtn");

if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (statusFilter) statusFilter.value = "";
    if (roomFilter) roomFilter.value = "";
    renderFilteredReservations();
  });
}

const reservationModal = document.getElementById("reservationModal");
const closeReservationModal = document.getElementById("closeReservationModal");
const closeReservationModalBtn = document.getElementById("closeReservationModalBtn");
const modalApproveBtn = document.getElementById("modalApproveBtn");
const modalDeclineBtn = document.getElementById("modalDeclineBtn");
const modalAdminRemarks = document.getElementById("modalAdminRemarks");
const modalStatusBadge = document.getElementById("modalStatusBadge");

let allReservations = [];
let selectedReservation = null;

async function loadReservations() {
  try {
    setAdminMessage("Loading reservations...", "");

    const response = await fetch(`${SCRIPT_URL}?action=listReservations&ts=${Date.now()}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Failed to load reservations.");
    }

    allReservations = Array.isArray(result.reservations) ? result.reservations : [];

    renderFilteredReservations();
    updateStats(allReservations);

    setAdminMessage(`Loaded ${allReservations.length} reservation(s).`, "success");
  } catch (error) {
    console.error("Admin load error:", error);

    if (recordsBody) {
      recordsBody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state">${escapeHtml(error.message)}</td>
        </tr>
      `;
    }

    setAdminMessage(error.message, "error");
  }
}

function setAdminMessage(message, type) {
  if (!adminMessage) return;
  adminMessage.textContent = message || "";
  adminMessage.className = "form-message";
  if (type) adminMessage.classList.add(type);
}

function updateStats(reservations) {
  const pending = reservations.filter(r => String(r["Status"] || "") === "Pending Approval").length;
  const approved = reservations.filter(r => String(r["Status"] || "") === "Approved").length;
  const declined = reservations.filter(r => {
    const status = String(r["Status"] || "");
    return status === "Rejected" || status === "Declined";
  }).length;

  const revenue = reservations
    .filter(r => String(r["Status"] || "") === "Approved")
    .reduce((sum, r) => sum + toNumber(r["Total Expenses"]), 0);

  if (totalCount) totalCount.textContent = reservations.length;
  if (pendingCount) pendingCount.textContent = pending;
  if (approvedCount) approvedCount.textContent = approved;
  if (declinedCount) declinedCount.textContent = declined;
  if (revenueCount) revenueCount.textContent = formatMoney(revenue);
}

function getFilteredReservations() {
  const searchValue = String(searchInput?.value || "").trim().toLowerCase();
  const statusValue = String(statusFilter?.value || "").trim();
  const roomValue = String(roomFilter?.value || "").trim();

  return allReservations.filter(r => {
    const haystack = [
      r["Reservation ID"],
      r["Full Name"],
      r["Email"],
      r["Phone"],
      r["Room Type"]
    ].join(" ").toLowerCase();

    const matchesSearch = !searchValue || haystack.includes(searchValue);
    const matchesStatus = !statusValue || String(r["Status"] || "") === statusValue;
    const matchesRoom = !roomValue || String(r["Room Type"] || "") === roomValue;

    return matchesSearch && matchesStatus && matchesRoom;
  });
}

function renderFilteredReservations() {
  const filtered = getFilteredReservations();
  renderReservations(filtered);
}

function renderReservations(reservations) {
  if (!recordsBody) return;

  if (!Array.isArray(reservations) || reservations.length === 0) {
    recordsBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">No reservations found.</td>
      </tr>
    `;
    return;
  }

  recordsBody.innerHTML = reservations.map(r => {
    const reservationId = String(r["Reservation ID"] || "");
    const guest = String(r["Full Name"] || "");
    const stay = `${formatDate(r["Check-In"])} ${formatTime(r["Check-In Time"])} → ${formatDate(r["Check-Out"])} ${formatTime(r["Check-Out Time"])}`;
    const room = String(r["Room Type"] || "");
    const guests = String(r["Guests"] || "");
    const total = formatMoney(r["Total Expenses"]);
    const status = String(r["Status"] || "");
    const statusClass = getStatusClass(status);

    return `
      <tr>
        <td>${escapeHtml(reservationId)}</td>
        <td>
          <div class="table-primary">${escapeHtml(guest)}</div>
          <div class="table-secondary">${escapeHtml(String(r["Email"] || ""))}</div>
        </td>
        <td>${escapeHtml(stay)}</td>
        <td>${escapeHtml(room)}</td>
        <td>${escapeHtml(guests)}</td>
        <td class="table-money">${escapeHtml(total)}</td>
        <td><span class="status-badge ${statusClass}">${escapeHtml(status)}</span></td>
        <td>
          <button class="btn btn-secondary btn-view" type="button" onclick="openReservationModal('${escapeJs(reservationId)}')">View</button>
        </td>
      </tr>
    `;
  }).join("");
}

function openReservationModal(reservationId) {
  const reservation = allReservations.find(r => String(r["Reservation ID"] || "") === reservationId);
  if (!reservation || !reservationModal) return;

  selectedReservation = reservation;

  document.getElementById("modalReservationTitle").textContent = reservation["Reservation ID"] || "Reservation";
  fillText("detailReservationId", reservation["Reservation ID"]);
  fillText("detailTimestamp", formatDateTime(reservation["Timestamp"]));
  fillText("detailFullName", reservation["Full Name"]);
  fillText("detailEmail", reservation["Email"]);
  fillText("detailPhone", reservation["Phone"]);
  fillText("detailAffiliation", reservation["Affiliation"]);
  fillText("detailCheckIn", formatDate(reservation["Check-In"]));
  fillText("detailCheckInTime", formatTime(reservation["Check-In Time"]));
  fillText("detailCheckOut", formatDate(reservation["Check-Out"]));
  fillText("detailCheckOutTime", formatTime(reservation["Check-Out Time"]));
  fillText("detailRoomType", reservation["Room Type"]);
  fillText("detailGuests", reservation["Guests"]);
  fillText("detailRoomRate", formatMoney(reservation["Room Rate"]));
  fillText("detailNights", reservation["Nights"]);
  fillText("detailLateFee", formatMoney(reservation["Late Checkout Fee"]));
  fillText("detailTotalExpenses", formatMoney(reservation["Total Expenses"]));
  fillText("detailReviewedBy", reservation["Reviewed By"] || "—");
  fillText("detailReviewedAt", formatDateTime(reservation["Reviewed At"]) || "—");

  const specialRequests = document.getElementById("detailSpecialRequests");
  if (specialRequests) {
    specialRequests.textContent = reservation["Special Requests"] || "No special requests.";
  }

  if (modalAdminRemarks) {
    modalAdminRemarks.value = reservation["Admin Remarks"] || "";
  }

  const status = String(reservation["Status"] || "Pending Approval");
  if (modalStatusBadge) {
    modalStatusBadge.textContent = status;
    modalStatusBadge.className = `status-badge ${getStatusClass(status)}`;
  }

  reservationModal.classList.add("show");
  document.body.style.overflow = "hidden";
}

function fillText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "—";
}

function closeModal() {
  if (!reservationModal) return;
  reservationModal.classList.remove("show");
  document.body.style.overflow = "";
  selectedReservation = null;
}

async function updateStatusFromModal(newStatus) {
  if (!selectedReservation) return;

  const reservationId = String(selectedReservation["Reservation ID"] || "");
  const adminRemarks = modalAdminRemarks ? modalAdminRemarks.value : "";

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

    setAdminMessage(result.message || "Reservation updated.", "success");
    closeModal();
    await loadReservations();
  } catch (error) {
    console.error("Status update error:", error);
    setAdminMessage(error.message, "error");
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJs(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date)) return String(value);

  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit"
  });
}

function formatTime(value) {
  if (!value) return "";

  const timeString = String(value).trim();

  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(timeString)) {
    const parts = timeString.split(":");
    const date = new Date();
    date.setHours(Number(parts[0]), Number(parts[1]), Number(parts[2] || 0), 0);

    return date.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  }

  const parsed = new Date(value);
  if (!isNaN(parsed)) {
    return parsed.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  }

  return String(value);
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date)) return String(value);

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return 0;
  const num = Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isNaN(num) ? 0 : num;
}

function formatMoney(value) {
  const num = toNumber(value);
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP"
  }).format(num);
}

function getStatusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "approved") return "status-approved";
  if (value === "pending approval" || value === "pending") return "status-pending";
  if (value === "rejected" || value === "declined") return "status-declined";

  return "status-neutral";
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", loadReservations);
}

if (searchInput) {
  searchInput.addEventListener("input", renderFilteredReservations);
}

if (statusFilter) {
  statusFilter.addEventListener("change", renderFilteredReservations);
}

if (roomFilter) {
  roomFilter.addEventListener("change", renderFilteredReservations);
}

if (closeReservationModal) {
  closeReservationModal.addEventListener("click", closeModal);
}

if (closeReservationModalBtn) {
  closeReservationModalBtn.addEventListener("click", closeModal);
}

if (reservationModal) {
  reservationModal.addEventListener("click", (event) => {
    if (event.target === reservationModal) {
      closeModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

if (modalApproveBtn) {
  modalApproveBtn.addEventListener("click", () => updateStatusFromModal("Approved"));
}

if (modalDeclineBtn) {
  modalDeclineBtn.addEventListener("click", () => updateStatusFromModal("Rejected"));
}

loadReservations();
