import Fireworks from "fireworks-js";
const CREDIT_NAMES = ["ClawDancer", "Lunariz", "Tom", "Starlight @ Luna 1", "Freakeh", "yesopj", "Claude Code"];
const FIREWORK_COLORS = ["#ff6b6b", "#4ecdc4", "#45b7d1", "#f9d56e", "#ff8b94", "#a8e6cf"];
const ANIMATION_CONFIG = {
  SPEED: 2,
  NAME_RADIUS: 60,
  INITIAL_FIREWORKS: 3
};
let animationFrameId = null;
let canvas = null;
let fireworksInstance = null;
let textCanvas = null;
let textCtx = null;
let floatingNames = [];
let modalElement = null;
let isModalOpen = false;
let focusTrigger = null;
function createFloatingName(name, index, canvasWidth, canvasHeight) {
  const color = FIREWORK_COLORS[index % FIREWORK_COLORS.length];
  const angle = Math.random() * Math.PI * 2;
  const speed = ANIMATION_CONFIG.SPEED * (0.8 + Math.random() * 0.4);
  return {
    name,
    x: Math.random() * (canvasWidth - 200) + 100,
    y: Math.random() * (canvasHeight - 100) + 50,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: ANIMATION_CONFIG.NAME_RADIUS,
    color
  };
}
function checkCollision(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < a.radius + b.radius;
}
function resolveCollision(a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance === 0) return;
  const nx = dx / distance;
  const ny = dy / distance;
  const dvx = a.vx - b.vx;
  const dvy = a.vy - b.vy;
  const dvn = dvx * nx + dvy * ny;
  if (dvn > 0) return;
  a.vx -= dvn * nx;
  a.vy -= dvn * ny;
  b.vx += dvn * nx;
  b.vy += dvn * ny;
  const overlap = (a.radius + b.radius - distance) / 2;
  a.x -= overlap * nx;
  a.y -= overlap * ny;
  b.x += overlap * nx;
  b.y += overlap * ny;
}
function updateFloatingNames(canvasWidth, canvasHeight) {
  floatingNames.forEach((name) => {
    name.x += name.vx;
    name.y += name.vy;
    if (name.x - name.radius < 0) {
      name.x = name.radius;
      name.vx *= -1;
    }
    if (name.x + name.radius > canvasWidth) {
      name.x = canvasWidth - name.radius;
      name.vx *= -1;
    }
    if (name.y - name.radius < 0) {
      name.y = name.radius;
      name.vy *= -1;
    }
    if (name.y + name.radius > canvasHeight) {
      name.y = canvasHeight - name.radius;
      name.vy *= -1;
    }
  });
  for (let i = 0; i < floatingNames.length; i++) {
    for (let j = i + 1; j < floatingNames.length; j++) {
      if (checkCollision(floatingNames[i], floatingNames[j])) {
        resolveCollision(floatingNames[i], floatingNames[j]);
      }
    }
  }
}
function drawNames() {
  if (!textCanvas || !textCtx) return;
  textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
  floatingNames.forEach((nameObj) => {
    textCtx.save();
    const isFreakeh = nameObj.name.toLowerCase() === "freakeh";
    const fontSize = isFreakeh ? 42 : 20;
    const glowColor = isFreakeh ? "#FFD700" : nameObj.color;
    textCtx.shadowColor = glowColor;
    textCtx.font = `bold ${fontSize}px Arial, sans-serif`;
    textCtx.fillStyle = isFreakeh ? "#FFD700" : "#ffffff";
    textCtx.textAlign = "center";
    textCtx.textBaseline = "middle";
    textCtx.fillText(nameObj.name, nameObj.x, nameObj.y);
    textCtx.strokeStyle = glowColor;
    textCtx.lineWidth = 2;
    textCtx.strokeText(nameObj.name, nameObj.x, nameObj.y);
    textCtx.restore();
  });
}
function animate() {
  const canvasWidth = textCanvas?.width || 800;
  const canvasHeight = textCanvas?.height || 600;
  updateFloatingNames(canvasWidth, canvasHeight);
  drawNames();
  animationFrameId = requestAnimationFrame(animate);
}
function openCreditsModal() {
  closeCreditsModal();
  isModalOpen = true;
  focusTrigger = document.activeElement;
  modalElement = document.createElement("div");
  modalElement.id = "credits-modal";
  modalElement.className = "credits-modal-overlay";
  modalElement.setAttribute("role", "dialog");
  modalElement.setAttribute("aria-modal", "true");
  modalElement.setAttribute("aria-labelledby", "credits-modal-title");
  const modalContent = document.createElement("div");
  modalContent.className = "credits-modal-content";
  const header = document.createElement("div");
  header.className = "credits-modal-header";
  const title = document.createElement("h2");
  title.id = "credits-modal-title";
  title.className = "credits-modal-title";
  title.textContent = "\u2728 Special Thanks \u2728";
  header.appendChild(title);
  const canvasContainer = document.createElement("div");
  canvasContainer.className = "credits-modal-canvas-container";
  const closeButton = document.createElement("button");
  closeButton.className = "credits-modal-close";
  closeButton.innerHTML = "\u2715";
  closeButton.setAttribute("aria-label", "Close credits modal");
  closeButton.onclick = closeCreditsModal;
  canvas = document.createElement("canvas");
  canvas.className = "credits-modal-canvas";
  textCanvas = document.createElement("canvas");
  textCanvas.className = "credits-modal-text-canvas";
  textCtx = textCanvas.getContext("2d");
  if (!textCtx) {
    console.error("Failed to get 2D context for text canvas");
    return;
  }
  canvasContainer.appendChild(canvas);
  canvasContainer.appendChild(textCanvas);
  modalContent.appendChild(header);
  modalContent.appendChild(canvasContainer);
  modalContent.appendChild(closeButton);
  modalElement.appendChild(modalContent);
  document.body.appendChild(modalElement);
  const containerWidth = canvasContainer.clientWidth || 800;
  const containerHeight = canvasContainer.clientHeight || 600;
  fireworksInstance = new Fireworks(canvas, {
    hue: { min: 0, max: 360 },
    delay: { min: 20, max: 50 },
    rocketsPoint: { min: 50, max: 50 },
    acceleration: 1.2,
    friction: 0.95,
    gravity: 1,
    particles: 40,
    explosion: 5,
    brightness: { min: 50, max: 80 },
    boundaries: {
      x: 0,
      y: 0,
      width: containerWidth,
      height: containerHeight
    },
    sound: {
      enabled: false
    }
  });
  const resizeCanvas = () => {
    if (canvas && textCanvas && canvasContainer) {
      const width = canvasContainer.clientWidth;
      const height = canvasContainer.clientHeight;
      canvas.width = width;
      canvas.height = height;
      textCanvas.width = width;
      textCanvas.height = height;
      if (fireworksInstance) {
        fireworksInstance.stop();
        fireworksInstance = new Fireworks(canvas, {
          hue: { min: 0, max: 360 },
          delay: { min: 20, max: 50 },
          rocketsPoint: { min: 50, max: 50 },
          acceleration: 1.2,
          friction: 0.95,
          gravity: 1,
          particles: 40,
          explosion: 5,
          brightness: { min: 50, max: 80 },
          boundaries: {
            x: 0,
            y: 0,
            width,
            height
          },
          sound: {
            enabled: false
          }
        });
        fireworksInstance.start();
      }
    }
  };
  requestAnimationFrame(() => {
    if (modalElement) {
      modalElement.classList.add("active");
    }
  });
  resizeCanvas();
  floatingNames = CREDIT_NAMES.map(
    (name, i) => createFloatingName(name, i, textCanvas.width, textCanvas.height)
  );
  animate();
  if (fireworksInstance) {
    fireworksInstance.start();
  }
  window.addEventListener("resize", resizeCanvas);
  window._creditsResizeHandler = resizeCanvas;
  const escHandler = (e) => {
    if (e.key === "Escape") {
      closeCreditsModal();
    }
  };
  document.addEventListener("keydown", escHandler);
  window._creditsEscHandler = escHandler;
  setTimeout(() => closeButton.focus(), 100);
}
function closeCreditsModal() {
  isModalOpen = false;
  if (modalElement) {
    modalElement.classList.remove("active");
    setTimeout(() => {
      if (modalElement) {
        modalElement.remove();
        modalElement = null;
      }
    }, 300);
  }
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (fireworksInstance) {
    fireworksInstance.stop();
    fireworksInstance = null;
  }
  const escHandler = window._creditsEscHandler;
  if (escHandler) {
    document.removeEventListener("keydown", escHandler);
    delete window._creditsEscHandler;
  }
  const resizeHandler = window._creditsResizeHandler;
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    delete window._creditsResizeHandler;
  }
  if (focusTrigger && focusTrigger instanceof HTMLElement) {
    focusTrigger.focus();
    focusTrigger = null;
  }
  floatingNames = [];
  canvas = null;
  textCanvas = null;
  textCtx = null;
}
window.openCreditsModal = openCreditsModal;
window.closeCreditsModal = closeCreditsModal;
export {
  closeCreditsModal,
  openCreditsModal
};
//# sourceMappingURL=credits-modal.js.map
