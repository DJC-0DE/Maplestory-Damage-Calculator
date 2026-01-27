/**
 * Credits Modal with Fireworks Animation
 * Displays special thanks to contributors with animated name fireworks
 */

// @ts-ignore - fireworks-js doesn't have perfect types
import Fireworks from 'fireworks-js';

// Extend Window interface for our global functions
declare global {
    interface Window {
        _creditsEscHandler?: (e: KeyboardEvent) => void;
        _creditsResizeHandler?: () => void;
        openCreditsModal?: () => void;
        closeCreditsModal?: () => void;
    }
}

interface FloatingName {
    name: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
}

const CREDIT_NAMES = ['ClawDancer', 'Lunariz', 'Tom', 'Starlight @ Luna 1', 'Freakeh', 'yesopj', 'Claude Code'];
const FIREWORK_COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9d56e', '#ff8b94', '#a8e6cf'];

const ANIMATION_CONFIG = {
    SPEED: 2,
    NAME_RADIUS: 60,
    INITIAL_FIREWORKS: 3
} as const;

let animationFrameId: number | null = null;
let canvas: HTMLCanvasElement | null = null;
let fireworksInstance: Fireworks | null = null;
let textCanvas: HTMLCanvasElement | null = null;
let textCtx: CanvasRenderingContext2D | null = null;
let floatingNames: FloatingName[] = [];
let modalElement: HTMLElement | null = null;
let isModalOpen = false;
let focusTrigger: Element | null = null;

/**
 * Initialize a floating name
 */
function createFloatingName(name: string, index: number, canvasWidth: number, canvasHeight: number): FloatingName {
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

/**
 * Check collision between two floating names
 */
function checkCollision(a: FloatingName, b: FloatingName): boolean {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < a.radius + b.radius;
}

/**
 * Resolve collision between two floating names
 */
function resolveCollision(a: FloatingName, b: FloatingName): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance === 0) return;

    // Normal vector
    const nx = dx / distance;
    const ny = dy / distance;

    // Relative velocity
    const dvx = a.vx - b.vx;
    const dvy = a.vy - b.vy;

    // Relative velocity along collision normal
    const dvn = dvx * nx + dvy * ny;

    // Don't resolve if moving apart
    if (dvn > 0) return;

    // Elastic collision response
    a.vx -= dvn * nx;
    a.vy -= dvn * ny;
    b.vx += dvn * nx;
    b.vy += dvn * ny;

    // Separate overlapping circles
    const overlap = (a.radius + b.radius - distance) / 2;
    a.x -= overlap * nx;
    a.y -= overlap * ny;
    b.x += overlap * nx;
    b.y += overlap * ny;
}

/**
 * Update floating names
 */
function updateFloatingNames(canvasWidth: number, canvasHeight: number): void {
    // Update positions
    floatingNames.forEach(name => {
        name.x += name.vx;
        name.y += name.vy;

        // Bounce off walls
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

    // Check collisions between all pairs
    for (let i = 0; i < floatingNames.length; i++) {
        for (let j = i + 1; j < floatingNames.length; j++) {
            if (checkCollision(floatingNames[i], floatingNames[j])) {
                resolveCollision(floatingNames[i], floatingNames[j]);
            }
        }
    }
}

/**
 * Draw the names on the text canvas
 */
function drawNames(): void {
    if (!textCanvas || !textCtx) return;

    // Clear text canvas
    textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);

    floatingNames.forEach(nameObj => {
        textCtx.save();

        const isFreakeh = nameObj.name.toLowerCase() === 'freakeh';
        const fontSize = isFreakeh ? 42 : 20;
        const glowColor = isFreakeh ? '#FFD700' : nameObj.color;

        // Glow effect
        textCtx.shadowColor = glowColor;

        // Main text
        textCtx.font = `bold ${fontSize}px Arial, sans-serif`;
        textCtx.fillStyle = isFreakeh ? '#FFD700' : '#ffffff';
        textCtx.textAlign = 'center';
        textCtx.textBaseline = 'middle';
        textCtx.fillText(nameObj.name, nameObj.x, nameObj.y);

        // Colored outline
        textCtx.strokeStyle = glowColor;
        textCtx.lineWidth = 2;
        textCtx.strokeText(nameObj.name, nameObj.x, nameObj.y);

        textCtx.restore();
    });
}

/**
 * Main animation loop
 */
function animate(): void {
    const canvasWidth = textCanvas?.width || 800;
    const canvasHeight = textCanvas?.height || 600;

    // Update floating names
    updateFloatingNames(canvasWidth, canvasHeight);

    // Draw names
    drawNames();

    animationFrameId = requestAnimationFrame(animate);
}

/**
 * Open the credits modal
 */
export function openCreditsModal(): void {
    closeCreditsModal();

    isModalOpen = true;
    focusTrigger = document.activeElement;

    modalElement = document.createElement('div');
    modalElement.id = 'credits-modal';
    modalElement.className = 'credits-modal-overlay';
    modalElement.setAttribute('role', 'dialog');
    modalElement.setAttribute('aria-modal', 'true');
    modalElement.setAttribute('aria-labelledby', 'credits-modal-title');

    const modalContent = document.createElement('div');
    modalContent.className = 'credits-modal-content';

    // Create header
    const header = document.createElement('div');
    header.className = 'credits-modal-header';

    const title = document.createElement('h2');
    title.id = 'credits-modal-title';
    title.className = 'credits-modal-title';
    title.textContent = '✨ Special Thanks ✨';

    header.appendChild(title);

    // Create canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'credits-modal-canvas-container';

    const closeButton = document.createElement('button');
    closeButton.className = 'credits-modal-close';
    closeButton.innerHTML = '✕';
    closeButton.setAttribute('aria-label', 'Close credits modal');
    closeButton.onclick = closeCreditsModal;

    // Create fireworks canvas (background)
    canvas = document.createElement('canvas');
    canvas.className = 'credits-modal-canvas';

    // Create text canvas (foreground for names)
    textCanvas = document.createElement('canvas');
    textCanvas.className = 'credits-modal-text-canvas';
    textCtx = textCanvas.getContext('2d');

    if (!textCtx) {
        console.error('Failed to get 2D context for text canvas');
        return;
    }

    // Assemble modal first to get container dimensions
    canvasContainer.appendChild(canvas);
    canvasContainer.appendChild(textCanvas);
    modalContent.appendChild(header);
    modalContent.appendChild(canvasContainer);
    modalContent.appendChild(closeButton);
    modalElement.appendChild(modalContent);
    document.body.appendChild(modalElement);

    // Get actual container dimensions
    const containerWidth = canvasContainer.clientWidth || 800;
    const containerHeight = canvasContainer.clientHeight || 600;

    // Initialize fireworks-js with actual dimensions
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

            // Update boundaries for fireworks - create new instance with updated boundaries
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
                        width: width,
                        height: height
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
            modalElement.classList.add('active');
        }
    });

    resizeCanvas();

    // Initialize floating names
    floatingNames = CREDIT_NAMES.map((name, i) =>
        createFloatingName(name, i, textCanvas!.width, textCanvas!.height)
    );

    // Start animations
    animate();

    // Start fireworks-js and launch initial batch
    if (fireworksInstance) {
        fireworksInstance.start();
    }

    window.addEventListener('resize', resizeCanvas);
    window._creditsResizeHandler = resizeCanvas;

    const escHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeCreditsModal();
        }
    };
    document.addEventListener('keydown', escHandler);
    window._creditsEscHandler = escHandler;

    setTimeout(() => closeButton.focus(), 100);
}

/**
 * Close the credits modal
 */
export function closeCreditsModal(): void {
    isModalOpen = false;

    if (modalElement) {
        modalElement.classList.remove('active');

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
        document.removeEventListener('keydown', escHandler);
        delete window._creditsEscHandler;
    }

    const resizeHandler = window._creditsResizeHandler;
    if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler);
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
