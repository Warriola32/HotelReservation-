const SCRIPT_URL = "https://script.google.com/a/macros/dlsl.edu.ph/s/AKfycbw4UQ4seyvfqCP3b5i-bzOxDyBtU1jAxm5pBiGmd9h5frjS_d-nUvkYUi46bw7sp0qaCw/exec";
const form = document.getElementById("reservationForm");
const formMessage = document.getElementById("formMessage");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    formMessage.textContent = "Submitting reservation...";
    formMessage.className = "form-message";

    const payload = Object.fromEntries(new FormData(form).entries());

    if (new Date(payload.checkOut) <= new Date(payload.checkIn)) {
      formMessage.textContent = "Check-out date must be later than check-in date.";
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
      formMessage.textContent =
        `Reservation submitted successfully. ID: ${result.reservationId} | Status: ${result.status}`;
      formMessage.classList.add("success");

    } catch (error) {
      console.error("Submission error:", error);
      formMessage.textContent =
        error.message || "Unable to submit reservation at this time.";
      formMessage.classList.add("error");
    }
  });
}