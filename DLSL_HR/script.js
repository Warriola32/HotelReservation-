const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-DIdEEtt29ga7aSjrx4E5Ay2S2xzbrMmf7hsBPi7sPO9XEk7BdM4nd4GnmBNa-UUmxw/exec";

const form = document.getElementById("reservationForm");
const formMessage = document.getElementById("formMessage");

const roomTypeInput = document.getElementById("roomType");
const checkInInput = document.getElementById("checkIn");
const checkInTimeInput = document.getElementById("checkInTime");
const checkOutInput = document.getElementById("checkOut");
const checkOutTimeInput = document.getElementById("checkOutTime");
const extraMattressQtyInput = document.getElementById("extraMattressQty");
const guestsInput = document.querySelector('input[name="guests"]');

const roomRateDisplay = document.getElementById("roomRateDisplay");
const nightsDisplay = document.getElementById("nightsDisplay");
const lateFeeDisplay = document.getElementById("lateFeeDisplay");
const mattressFeeDisplay = document.getElementById("mattressFeeDisplay");
const totalExpensesDisplay = document.getElementById("totalExpensesDisplay");
const availabilityMessage = document.getElementById("availabilityMessage");
const guestRuleMessage = document.getElementById("guestRuleMessage");

const roomRateField = document.getElementById("roomRate");
const nightsField = document.getElementById("nights");
const lateCheckoutFeeField = document.getElementById("lateCheckoutFee");
const mattressFeeField = document.getElementById("mattressFee");
const totalExpensesField = document.getElementById("totalExpenses");


let latestAvailability = { available: true, message: "" };
let selectedRoomName = "";

const ROOM_RATES = {
  "Standard Room": 2500,
  "Executive Room": 4000,
  "Family Suite": 6000,
  "Event Place": 15000
};

const ROOM_RULES = {
  "Standard Room": {
    totalRooms: 8,
    includedGuests: 2,
    maxGuests: 4,
    extraGuestFee: 400
  },
  "Executive Room": {
    totalRooms: 8,
    includedGuests: 2,
    maxGuests: 4,
    extraGuestFee: 400
  },
  "Family Suite": {
    totalRooms: 8,
    includedGuests: 4,
    maxGuests: 8,
    extraGuestFee: 400
  },
  "Event Place": {
    totalRooms: 1,
    includedGuests: 80,
    maxGuests: 80,
    extraGuestFee: 0
  }
};

const ROOM_DETAILS = {
  "Standard Room": {
    image: "single.webp",
    price: "₱2,500 / night",
    description: "Comfortable, efficient, and ideal for short institutional stays.",
    features: [
      "1 Single bed",
      "Air-conditioned",
      "Wi-Fi and work desk",
      "Best for 1–2 guests"
    ]
  },
  "Executive Room": {
    image: "twin.webp",
    price: "₱4,000 / night",
    description: "Refined space for visiting speakers, partners, and administrators.",
    features: [
      "1 Twin bed",
      "Lounge area",
      "Premium amenities",
      "Best for 1–2 guests"
    ]
  },
  "Family Suite": {
    image: "multiple.webp",
    price: "₱6,000 / night",
    description: "Flexible space for group stays and special campus events.",
    features: [
      "Multiple beds",
      "Expanded floor area",
      "Best for extended stays",
      "Best for 3–6 guests"
    ]
  },
  "Event Place": {
    image: "event.png",
    price: "₱8,000 / day",
    description: "Spacious venue ideal for meetings, celebrations, seminars, and special gatherings.",
    features: [
      "Large open space",
      "Suitable for events and group functions",
      "Flexible seating arrangement",
      "Best for programs and special occasions"
    ]
  }
};

function toDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return null;
  return new Date(`${dateValue}T${timeValue}`);
}

function formatPeso(amount) {
  return "₱" + Number(amount || 0).toLocaleString();
}

function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diff = end - start;

  if (diff <= 0) return 0;

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function lateCheckoutFee(time) {
  if (!time) return 0;

  const [h, m] = time.split(":").map(Number);
  const minutes = (h * 60) + m;

  const standard = 12 * 60; // 12:00 NN
  const grace = standard + 15; // 12:15 PM

  if (minutes <= grace) return 0;

  const late = minutes - grace;
  const hours = Math.ceil(late / 60);

  return hours * 200;
}

function updateBookingSummary() {
  const room = roomTypeInput?.value || "";
  const checkIn = checkInInput?.value || "";
  const checkOut = checkOutInput?.value || "";
  const checkOutTime = checkOutTimeInput?.value || "12:00";
  const mattressQty = Number(extraMattressQtyInput?.value || 0);
  const guests = Number(guestsInput?.value || 0);

  const roomRule = ROOM_RULES[room] || {
  includedGuests: 0,
  maxGuests: 0,
  extraGuestFee: 0
};

if (guestsInput && roomRule.maxGuests) {
  guestsInput.max = roomRule.maxGuests;
}
  const rate = ROOM_RATES[room] || 0;
  const nights = calculateNights(checkIn, checkOut);
  const lateFee = lateCheckoutFee(checkOutTime);
  const mattressFee = mattressQty * 200;

  let extraGuestCount = 0;
  if (guests > roomRule.includedGuests) {
    extraGuestCount = guests - roomRule.includedGuests;
  }

  const extraGuestFee = extraGuestCount * roomRule.extraGuestFee;
  const total = (rate * nights) + lateFee + mattressFee + extraGuestFee;

  if (roomRateDisplay) roomRateDisplay.textContent = formatPeso(rate);
  if (nightsDisplay) nightsDisplay.textContent = nights;
  if (lateFeeDisplay) lateFeeDisplay.textContent = formatPeso(lateFee);
  if (mattressFeeDisplay) mattressFeeDisplay.textContent = formatPeso(mattressFee);
  if (totalExpensesDisplay) totalExpensesDisplay.textContent = formatPeso(total);

  if (guestRuleMessage) {
    if (!room) {
      guestRuleMessage.textContent = "";
      guestRuleMessage.className = "form-message";
    } else if (guests > roomRule.maxGuests) {
      guestRuleMessage.textContent = `Maximum guests for ${room} is ${roomRule.maxGuests}.`;
      guestRuleMessage.className = "form-message error";
    } else if (extraGuestFee > 0) {
      guestRuleMessage.textContent = `Extra guest fee applied: ${formatPeso(extraGuestFee)}. Included guests: ${roomRule.includedGuests}, max guests: ${roomRule.maxGuests}.`;
      guestRuleMessage.className = "form-message success";
    } else {
      guestRuleMessage.textContent = `Included guests: ${roomRule.includedGuests}. Maximum guests: ${roomRule.maxGuests}.`;
      guestRuleMessage.className = "form-message";
    }
  }

  if (roomRateField) roomRateField.value = rate;
  if (nightsField) nightsField.value = nights;
  if (lateCheckoutFeeField) lateCheckoutFeeField.value = lateFee;
  if (mattressFeeField) mattressFeeField.value = mattressFee;
  if (totalExpensesField) totalExpensesField.value = total;
}

async function checkAvailability() {
  const roomType = roomTypeInput?.value || "";
  const checkIn = checkInInput?.value || "";
  const checkInTime = checkInTimeInput?.value || "";
  const checkOut = checkOutInput?.value || "";
  const checkOutTime = checkOutTimeInput?.value || "";

  latestAvailability = { available: true, message: "" };

  if (!roomType || !checkIn || !checkInTime || !checkOut || !checkOutTime) {
    if (availabilityMessage) {
      availabilityMessage.textContent = "";
      availabilityMessage.className = "form-message";
    }
    return;
  }

  try {
    if (availabilityMessage) {
      availabilityMessage.textContent = "Checking room availability...";
      availabilityMessage.className = "form-message";
    }

    const response = await fetch(
      `${SCRIPT_URL}?action=checkAvailability&roomType=${encodeURIComponent(roomType)}&checkIn=${encodeURIComponent(checkIn)}&checkInTime=${encodeURIComponent(checkInTime)}&checkOut=${encodeURIComponent(checkOut)}&checkOutTime=${encodeURIComponent(checkOutTime)}&ts=${Date.now()}`
    );

    const result = await response.json();

    latestAvailability = {
  available: !!result.available,
  message: result.message || "",
  availableRooms: result.availableRooms || 0
};

    if (availabilityMessage) {
      availabilityMessage.textContent = result.message || "";
      availabilityMessage.className = result.available ? "form-message success" : "form-message error";
    }
  } catch (error) {
    latestAvailability = {
      available: false,
      message: "Availability check failed."
    };

    if (availabilityMessage) {
      availabilityMessage.textContent = "Availability check failed.";
      availabilityMessage.className = "form-message error";
    }
  }
}

if (roomTypeInput) {
  roomTypeInput.addEventListener("change", () => {
    updateBookingSummary();
    checkAvailability();
  });
}

if (checkInInput) {
  checkInInput.addEventListener("change", () => {
    updateBookingSummary();
    checkAvailability();
  });
}

if (checkInTimeInput) {
  checkInTimeInput.addEventListener("change", checkAvailability);
}

if (checkOutInput) {
  checkOutInput.addEventListener("change", () => {
    updateBookingSummary();
    checkAvailability();
  });
}

if (checkOutTimeInput) {
  checkOutTimeInput.addEventListener("change", () => {
    updateBookingSummary();
    checkAvailability();
  });
}
if (extraMattressQtyInput) {
  extraMattressQtyInput.addEventListener("input", updateBookingSummary);
}

if (guestsInput) {
  guestsInput.addEventListener("input", updateBookingSummary);
}
const roomCards = document.querySelectorAll(".interactive-room");
const roomModal = document.getElementById("roomModal");
const closeRoomModal = document.getElementById("closeRoomModal");
const closeRoomModalBtn = document.getElementById("closeRoomModalBtn");
const bookSelectedRoom = document.getElementById("bookSelectedRoom");

const modalRoomImage = document.getElementById("modalRoomImage");
const modalRoomTitle = document.getElementById("modalRoomTitle");
const modalRoomPrice = document.getElementById("modalRoomPrice");
const modalRoomDescription = document.getElementById("modalRoomDescription");
const modalRoomFeatures = document.getElementById("modalRoomFeatures");

function openRoomModal(roomName) {
  const room = ROOM_DETAILS[roomName];
  if (!room || !roomModal) return;

  selectedRoomName = roomName;
  modalRoomImage.src = room.image;
  modalRoomImage.alt = roomName;
  modalRoomTitle.textContent = roomName;
  modalRoomPrice.textContent = room.price;
  modalRoomDescription.textContent = room.description;
  modalRoomFeatures.innerHTML = room.features.map(feature => `<li>${feature}</li>`).join("");

  roomModal.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!roomModal) return;
  roomModal.classList.remove("show");
  document.body.style.overflow = "";
}

roomCards.forEach(card => {
  const roomName = card.dataset.room;

  card.addEventListener("click", (event) => {
    const clickedButton = event.target.closest(".room-details-btn");
    if (clickedButton || !event.target.closest("button")) {
      openRoomModal(roomName);
    }
  });
});

if (closeRoomModal) {
  closeRoomModal.addEventListener("click", closeModal);
}

if (closeRoomModalBtn) {
  closeRoomModalBtn.addEventListener("click", closeModal);
}

if (roomModal) {
  roomModal.addEventListener("click", (event) => {
    if (event.target === roomModal) {
      closeModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

if (bookSelectedRoom) {
  bookSelectedRoom.addEventListener("click", () => {
    if (roomTypeInput && selectedRoomName) {
      roomTypeInput.value = selectedRoomName;
      roomTypeInput.dispatchEvent(new Event("change"));
    }

    closeModal();

    const reserveSection = document.getElementById("reserve");
    if (reserveSection) {
      reserveSection.scrollIntoView({ behavior: "smooth" });
    }
  });
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    formMessage.textContent = "Submitting reservation...";
    formMessage.className = "form-message";

    updateBookingSummary();

    const payload = Object.fromEntries(new FormData(form).entries());
    const selectedRoomRule = ROOM_RULES[payload.roomType] || null;
    const guestCount = Number(payload.guests || 0);

    if (selectedRoomRule && guestCount > selectedRoomRule.maxGuests) {
    formMessage.textContent = `Maximum guests for ${payload.roomType} is ${selectedRoomRule.maxGuests}.`;
    formMessage.classList.add("error");
    return;
}

    await checkAvailability();

    if (!latestAvailability.available) {
      formMessage.textContent = latestAvailability.message || "This room is already booked for the selected date and time.";
      formMessage.classList.add("error");
      return;
    }

    const checkInDateTime = toDateTime(payload.checkIn, payload.checkInTime);
    const checkOutDateTime = toDateTime(payload.checkOut, payload.checkOutTime);

    if (!checkInDateTime || !checkOutDateTime) {
      formMessage.textContent = "Please complete both check-in and check-out date and time.";
      formMessage.classList.add("error");
      return;
    }

    if (payload.checkInTime < "14:00") {
      formMessage.textContent = "Standard check-in starts at 2:00 PM.";
      formMessage.classList.add("error");
      return;
    }

    if (checkOutDateTime <= checkInDateTime) {
      formMessage.textContent = "Check-out date and time must be later than check-in date and time.";
      formMessage.classList.add("error");
      return;
    }

    try {
      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Submission failed.");
      }

      form.reset();

      if (checkInTimeInput) checkInTimeInput.value = "14:00";
      if (checkOutTimeInput) checkOutTimeInput.value = "12:00";

      updateBookingSummary();

      if (availabilityMessage) {
        availabilityMessage.textContent = "";
        availabilityMessage.className = "form-message";
      }

      formMessage.textContent = `Reservation submitted successfully. ID: ${result.reservationId} | Status: ${result.status}`;
      formMessage.classList.add("success");

    } catch (error) {
      console.error("Submission error:", error);
      formMessage.textContent = error.message || "Unable to submit reservation at this time.";
      formMessage.classList.add("error");
    }
  });
}

updateBookingSummary();
