document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");

  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      // Prevent the form from actually submitting and reloading the page
      event.preventDefault();

      // Get the values from the form fields
      const usernameInput = document.getElementById(
        "username"
      ) as HTMLInputElement;
      const passwordInput = document.getElementById(
        "password"
      ) as HTMLInputElement;

      const username = usernameInput
        ? usernameInput.value.trim()
        : "noUsername";
      const password = passwordInput
        ? passwordInput.value.trim()
        : "noPassword";

      // --- Dummy Authentication ---
      // In a real application, you would send this to a server.
      // For now, we'll just check that the fields are not empty.
      if (username && password) {
        console.log(`Login successful for user: ${username}`);

        // Save the username to session storage.
        // sessionStorage is cleared when the browser tab is closed.
        sessionStorage.setItem("username", username);

        // Redirect the user to the game page
        window.location.href = "game.html";
      } else if (errorMessage) {
        // Show an error message if fields are empty
        errorMessage.textContent = "Please enter both username and password.";
      }
    });
  }
});

const loginMusic = document.getElementById("loginMusic") as HTMLAudioElement;
window.onmouseover = () => {
  if (loginMusic.paused) {
    loginMusic.play();
  }
};
