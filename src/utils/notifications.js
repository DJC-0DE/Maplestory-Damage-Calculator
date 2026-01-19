export function showToast(message, success = true, duration = 5000) {
  const toast = document.createElement("div");
  toast.textContent = message;

  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.zIndex = "1000";

  toast.style.backgroundColor = success ? "#4caf50" : "#f44336";
  toast.style.color = "#fff";
  toast.style.padding = "10px 20px";
  toast.style.borderRadius = "5px";
  toast.style.boxShadow = "0 2px 5px rgba(0, 0, 0, 0.2)";
  toast.style.fontSize = "14px";
  toast.style.fontWeight = "bold";

  // Add fade-in animation
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease-in";
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "1";
  }, 10);

  setTimeout(() => {
    // Add fade-out animation
    toast.style.opacity = "0";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}
