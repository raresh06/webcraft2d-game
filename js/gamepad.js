// =============================================================================
// WEBCRAFT 2D - GAMEPAD API CONTROLLER MODULE (gamepad.js)
// Native Controller Support, Analog Platformer Movement, 360° Aiming & Rebinding
// =============================================================================

export const DEFAULT_GAMEPAD_BINDINGS = {
    jump: 0,           // A / Cross
    crouch: 1,         // B / Circle
    attack: 7,         // RT / R2 (Right Trigger)
    attack_alt: 2,     // X / Square
    place: 6,          // LT / L2 (Left Trigger)
    inventory: 3,      // Y / Triangle
    prev_item: 4,      // LB / L1
    next_item: 5,      // RB / R1
    map: 8,            // Back / Select / Share
    pause: 9,          // Start / Options / Menu
    bg_build: 10,      // Left Stick Click (L3)
    debug: 11          // Right Stick Click (R3)
};

export const GAMEPAD_BUTTON_NAMES = {
    0: 'A / Cross',
    1: 'B / Circle',
    2: 'X / Square',
    3: 'Y / Triangle',
    4: 'LB / L1',
    5: 'RB / R1',
    6: 'LT / L2',
    7: 'RT / R2',
    8: 'Back / Select',
    9: 'Start / Menu',
    10: 'LS Click (L3)',
    11: 'RS Click (R3)',
    12: 'D-Pad Up',
    13: 'D-Pad Down',
    14: 'D-Pad Left',
    15: 'D-Pad Right',
    16: 'Guide / Home'
};

export const DEFAULT_GAMEPAD_SETTINGS = {
    deadzone: 0.18,          // 0.05 to 0.40
    aimSensitivity: 1.0,     // 0.5 to 3.0
    invertAimY: false,
    autoAimFacing: true,
    vibrationEnabled: true
};

export let gamepadBindings = { ...DEFAULT_GAMEPAD_BINDINGS };
export let gamepadSettings = { ...DEFAULT_GAMEPAD_SETTINGS };

export let connectedGamepads = {};
export let activeGamepadIndex = -1;
export let lastActiveGamepadTime = 0;
export let isUsingGamepad = false;

// Edge detection maps: button index -> boolean
let currentButtonsDown = {};
let prevButtonsDown = {};
let justPressedButtons = {};
let justReleasedButtons = {};

// Rebinding state
export let rebindingGamepadAction = null;
export let rebindingGamepadBtnEl = null;

/**
 * Format a gamepad button index to a friendly readable label
 */
export function formatGamepadButtonName(btnIndex) {
    if (btnIndex === undefined || btnIndex === null) return 'Unbound';
    if (GAMEPAD_BUTTON_NAMES[btnIndex]) return GAMEPAD_BUTTON_NAMES[btnIndex];
    return `Button ${btnIndex}`;
}

/**
 * Load bindings & settings from localStorage
 */
export function loadGamepadConfig() {
    try {
        if (typeof localStorage === 'undefined') return;
        const savedBinds = localStorage.getItem('swc_gamepad_bindings_v1');
        if (savedBinds) {
            gamepadBindings = Object.assign({}, DEFAULT_GAMEPAD_BINDINGS, JSON.parse(savedBinds));
        }
        const savedSettings = localStorage.getItem('swc_gamepad_settings_v1');
        if (savedSettings) {
            gamepadSettings = Object.assign({}, DEFAULT_GAMEPAD_SETTINGS, JSON.parse(savedSettings));
        }
    } catch (err) {
        console.warn('Failed to load gamepad config from localStorage:', err);
    }
}

/**
 * Save current bindings & settings to localStorage
 */
export function saveGamepadConfig() {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem('swc_gamepad_bindings_v1', JSON.stringify(gamepadBindings));
        localStorage.setItem('swc_gamepad_settings_v1', JSON.stringify(gamepadSettings));
    } catch (err) {
        console.warn('Failed to save gamepad config to localStorage:', err);
    }
}

/**
 * Reset all gamepad bindings back to default
 */
export function resetGamepadBindings() {
    gamepadBindings = { ...DEFAULT_GAMEPAD_BINDINGS };
    saveGamepadConfig();
}

/**
 * Reset all controller tuning settings to default
 */
export function resetGamepadSettings() {
    gamepadSettings = { ...DEFAULT_GAMEPAD_SETTINGS };
    saveGamepadConfig();
}

/**
 * Set a controller tuning setting
 */
export function setGamepadSetting(key, val) {
    if (gamepadSettings.hasOwnProperty(key)) {
        gamepadSettings[key] = val;
        saveGamepadConfig();
    }
}

/**
 * Check if a controller is currently connected
 */
export function isGamepadConnected() {
    return activeGamepadIndex !== -1 && !!connectedGamepads[activeGamepadIndex];
}

/**
 * Get the currently active Gamepad object from navigator
 */
export function getActiveGamepad() {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
    const gamepads = navigator.getGamepads();
    if (!gamepads) return null;
    if (activeGamepadIndex !== -1 && gamepads[activeGamepadIndex]) {
        return gamepads[activeGamepadIndex];
    }
    // Fallback: scan for first non-null gamepad
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            activeGamepadIndex = i;
            return gamepads[i];
        }
    }
    return null;
}

/**
 * Apply deadzone filtering and non-linear response curve to stick axis
 */
export function applyAxisDeadzone(val, deadzone = gamepadSettings.deadzone) {
    if (!Number.isFinite(val)) return 0;
    const absVal = Math.abs(val);
    if (absVal <= deadzone) return 0;
    const sign = Math.sign(val);
    // Smoothly scale remainder [deadzone, 1.0] -> [0.0, 1.0]
    const scaled = (absVal - deadzone) / (1.0 - deadzone);
    return sign * Math.min(1.0, Math.max(0.0, scaled));
}

/**
 * Get continuous horizontal move axis (-1.0 to 1.0)
 * Uses analog Left Stick X with deadzone, or digital D-Pad / Left/Right buttons
 */
export function getGamepadMoveAxis() {
    const gp = getActiveGamepad();
    if (!gp) return 0;

    // Analog Left Stick X (axes[0])
    const stickX = (gp.axes && gp.axes.length > 0) ? gp.axes[0] : 0;
    const filteredStick = applyAxisDeadzone(stickX, gamepadSettings.deadzone);
    if (Math.abs(filteredStick) > 0.01) {
        return filteredStick;
    }

    // Digital fallback: D-Pad Left (14) or D-Pad Right (15)
    const dLeft = isGamepadButtonDown(gp, 14);
    const dRight = isGamepadButtonDown(gp, 15);
    if (dLeft && !dRight) return -1.0;
    if (dRight && !dLeft) return 1.0;

    return 0;
}

/**
 * Get vertical axis (-1.0 to 1.0)
 * Negative = Up (climb up ladder / jump), Positive = Down (climb down ladder / crouch)
 */
export function getGamepadVerticalAxis() {
    const gp = getActiveGamepad();
    if (!gp) return 0;

    const stickY = (gp.axes && gp.axes.length > 1) ? gp.axes[1] : 0;
    const filteredStick = applyAxisDeadzone(stickY, gamepadSettings.deadzone);
    if (Math.abs(filteredStick) > 0.01) {
        return filteredStick;
    }

    // Digital fallback: D-Pad Up (12) or D-Pad Down (13)
    const dUp = isGamepadButtonDown(gp, 12);
    const dDown = isGamepadButtonDown(gp, 13);
    if (dUp && !dDown) return -1.0;
    if (dDown && !dUp) return 1.0;

    return 0;
}

/**
 * Get 360° right-stick aiming vector
 */
export function getGamepadAimVector() {
    const gp = getActiveGamepad();
    if (!gp || !gp.axes || gp.axes.length < 4) {
        return { x: 0, y: 0, active: false };
    }

    const rawX = gp.axes[2];
    let rawY = gp.axes[3];
    if (gamepadSettings.invertAimY) rawY = -rawY;

    const stickX = applyAxisDeadzone(rawX, gamepadSettings.deadzone);
    const stickY = applyAxisDeadzone(rawY, gamepadSettings.deadzone);

    const mag = Math.hypot(stickX, stickY);
    if (mag > 0.05) {
        const normMag = Math.min(1.0, mag * gamepadSettings.aimSensitivity);
        return {
            x: (stickX / mag) * normMag,
            y: (stickY / mag) * normMag,
            active: true
        };
    }

    return { x: 0, y: 0, active: false };
}

/**
 * Check if a physical button on gamepad is currently depressed (threshold > 0.35)
 */
export function isGamepadButtonDown(gp, buttonIndex) {
    if (!gp || !gp.buttons || buttonIndex === undefined || buttonIndex === null) return false;
    const btn = gp.buttons[buttonIndex];
    if (!btn) return false;
    if (typeof btn === 'number') return btn > 0.35;
    return !!(btn.pressed || (typeof btn.value === 'number' && btn.value > 0.35));
}

/**
 * Check if an action is currently held / active on gamepad
 */
export function isGamepadActionActive(actionName) {
    const gp = getActiveGamepad();
    if (!gp) return false;

    // Movement shortcuts
    if (actionName === 'left') {
        return getGamepadMoveAxis() < -0.15;
    }
    if (actionName === 'right') {
        return getGamepadMoveAxis() > 0.15;
    }
    if (actionName === 'jump') {
        const boundBtn = gamepadBindings.jump;
        if (boundBtn !== undefined && isGamepadButtonDown(gp, boundBtn)) return true;
        if (isGamepadButtonDown(gp, 12)) return true; // D-Pad Up
        if (getGamepadVerticalAxis() < -0.65) return true; // Stick pushed hard up
        return false;
    }
    if (actionName === 'down' || actionName === 'crouch') {
        const boundBtn = gamepadBindings.crouch;
        if (boundBtn !== undefined && isGamepadButtonDown(gp, boundBtn)) return true;
        if (isGamepadButtonDown(gp, 13)) return true; // D-Pad Down
        if (getGamepadVerticalAxis() > 0.55) return true; // Stick pushed down
        return false;
    }

    // General bound actions
    const btnIndex = gamepadBindings[actionName];
    if (btnIndex !== undefined && isGamepadButtonDown(gp, btnIndex)) {
        return true;
    }

    // Alternate attack check
    if (actionName === 'attack' && gamepadBindings.attack_alt !== undefined) {
        if (isGamepadButtonDown(gp, gamepadBindings.attack_alt)) return true;
    }

    return false;
}

/**
 * Check if an action was just pressed this frame
 */
export function isGamepadActionJustPressed(actionName) {
    const boundBtn = gamepadBindings[actionName];
    if (boundBtn !== undefined && justPressedButtons[boundBtn]) return true;

    if (actionName === 'attack' && gamepadBindings.attack_alt !== undefined) {
        if (justPressedButtons[gamepadBindings.attack_alt]) return true;
    }
    if (actionName === 'jump' && justPressedButtons[12]) { // D-Pad Up
        return true;
    }
    if (actionName === 'crouch' && justPressedButtons[13]) { // D-Pad Down
        return true;
    }

    return false;
}

/**
 * Check if an action was just released this frame
 */
export function isGamepadActionJustReleased(actionName) {
    const boundBtn = gamepadBindings[actionName];
    if (boundBtn !== undefined && justReleasedButtons[boundBtn]) return true;

    if (actionName === 'attack' && gamepadBindings.attack_alt !== undefined) {
        if (justReleasedButtons[gamepadBindings.attack_alt]) return true;
    }

    return false;
}

/**
 * Start rebinding an action to the next pressed controller button
 */
export function startGamepadRebinding(action, btnEl) {
    if (rebindingGamepadAction && rebindingGamepadBtnEl) {
        rebindingGamepadBtnEl.classList.remove('waiting');
        rebindingGamepadBtnEl.innerText = formatGamepadButtonName(gamepadBindings[rebindingGamepadAction]);
    }
    rebindingGamepadAction = action;
    rebindingGamepadBtnEl = btnEl;
    if (btnEl) {
        btnEl.classList.add('waiting');
        btnEl.innerText = '> PRESS BUTTON <';
    }
}

/**
 * Cancel active rebinding
 */
export function cancelGamepadRebinding() {
    if (rebindingGamepadAction && rebindingGamepadBtnEl) {
        rebindingGamepadBtnEl.classList.remove('waiting');
        rebindingGamepadBtnEl.innerText = formatGamepadButtonName(gamepadBindings[rebindingGamepadAction]);
    }
    rebindingGamepadAction = null;
    rebindingGamepadBtnEl = null;
}

/**
 * Complete rebinding with a pressed button index
 */
export function finishGamepadRebinding(buttonIndex) {
    if (!rebindingGamepadAction) return;

    gamepadBindings[rebindingGamepadAction] = buttonIndex;
    saveGamepadConfig();

    if (rebindingGamepadBtnEl) {
        rebindingGamepadBtnEl.classList.remove('waiting');
        rebindingGamepadBtnEl.innerText = formatGamepadButtonName(buttonIndex);
    }

    if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
        window.showToast(`Bound ${rebindingGamepadAction} to ${formatGamepadButtonName(buttonIndex)}`);
    }
    if (typeof window !== 'undefined' && typeof window.playSound === 'function') {
        window.playSound('click', { isUI: true });
    }

    rebindingGamepadAction = null;
    rebindingGamepadBtnEl = null;

    if (typeof window !== 'undefined' && typeof window.updateGamepadButtonsUI === 'function') {
        window.updateGamepadButtonsUI();
    }
}

/**
 * Trigger haptic vibration effect
 */
export function triggerGamepadVibration(durationMs = 100, weakMagnitude = 0.4, strongMagnitude = 0.4) {
    if (!gamepadSettings.vibrationEnabled) return;
    const gp = getActiveGamepad();
    if (!gp) return;

    try {
        if (gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
            gp.vibrationActuator.playEffect('dual-rumble', {
                startDelay: 0,
                duration: durationMs,
                weakMagnitude: Math.min(1.0, Math.max(0.0, weakMagnitude)),
                strongMagnitude: Math.min(1.0, Math.max(0.0, strongMagnitude))
            }).catch(() => {});
        } else if (gp.hapticActuators && gp.hapticActuators.length > 0) {
            gp.hapticActuators[0].pulse(strongMagnitude, durationMs);
        }
    } catch (e) {
        // Haptics not permitted or unsupported by device
    }
}

/**
 * Get all button indices currently pressed on the controller (for live UI tester)
 */
export function getPressedButtonIndices() {
    const gp = getActiveGamepad();
    if (!gp || !gp.buttons) return [];
    const pressed = [];
    for (let i = 0; i < gp.buttons.length; i++) {
        if (isGamepadButtonDown(gp, i)) pressed.push(i);
    }
    return pressed;
}

/**
 * Main per-frame poll called from game loop
 */
export function updateGamepad() {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return;

    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    // Refresh connected gamepads list
    connectedGamepads = {};
    let foundActive = false;
    for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (gp) {
            connectedGamepads[i] = gp;
            if (activeGamepadIndex === -1 || activeGamepadIndex === i) {
                activeGamepadIndex = i;
                foundActive = true;
            }
        }
    }
    if (!foundActive) {
        const indices = Object.keys(connectedGamepads);
        activeGamepadIndex = indices.length > 0 ? parseInt(indices[0], 10) : -1;
    }

    const activeGp = (activeGamepadIndex !== -1) ? connectedGamepads[activeGamepadIndex] : null;
    if (!activeGp) {
        currentButtonsDown = {};
        justPressedButtons = {};
        justReleasedButtons = {};
        return;
    }

    // Check for user activity on gamepad (buttons or stick movement)
    let hadActivity = false;
    const newButtonsDown = {};
    justPressedButtons = {};
    justReleasedButtons = {};

    if (activeGp.buttons) {
        for (let i = 0; i < activeGp.buttons.length; i++) {
            const isDown = isGamepadButtonDown(activeGp, i);
            if (isDown) {
                newButtonsDown[i] = true;
                hadActivity = true;
                if (!prevButtonsDown[i]) {
                    justPressedButtons[i] = true;
                }
            } else if (prevButtonsDown[i]) {
                justReleasedButtons[i] = true;
            }
        }
    }

    if (activeGp.axes) {
        for (let i = 0; i < activeGp.axes.length; i++) {
            if (Math.abs(activeGp.axes[i]) > gamepadSettings.deadzone) {
                hadActivity = true;
                break;
            }
        }
    }

    prevButtonsDown = { ...newButtonsDown };
    currentButtonsDown = newButtonsDown;

    if (hadActivity) {
        lastActiveGamepadTime = Date.now();
        isUsingGamepad = true;
    } else if (Date.now() - lastActiveGamepadTime > 8000) {
        isUsingGamepad = false;
    }

    // Handle button rebinding assignment
    if (rebindingGamepadAction) {
        const pressedIndices = Object.keys(justPressedButtons);
        if (pressedIndices.length > 0) {
            const chosenBtn = parseInt(pressedIndices[0], 10);
            finishGamepadRebinding(chosenBtn);
        }
    }
}

// =============================================================================
// GAMEPAD NATIVE UI & MENU NAVIGATION
// =============================================================================

export let gamepadFocusedElement = null;
export let isGamepadUINavActive = false;
let lastNavTimestamp = 0;
let activeNavDirection = null;
let directionHoldStartTime = 0;
const NAV_INITIAL_DELAY_MS = 250;
const NAV_REPEAT_INTERVAL_MS = 125;

/**
 * Identify the topmost active overlay or screen that requires controller navigation
 */
export function getActiveUIContainer() {
    if (typeof document === 'undefined') return null;

    // 1. High priority dedicated modals / overlays in stack order
    const modalIds = [
        'kick-modal',
        'guest-confirm-modal',
        'new-world-modal',
        'publish-multiplayer-modal',
        'auth-profile-modal',
        'profile-details-modal',
        'credits-modal',
        'tutorial-modal',
        'whats-new-modal',
        'skin-upload-modal',
        'skin-owned-modal',
        'skins-menu',
        'achievements-modal',
        'settings-menu',
        'world-map-modal',
        'multiplayer-modal',
        'worlds-menu',
        'death-menu',
        'pause-menu',
        'inventory-container'
    ];

    for (const id of modalIds) {
        const el = document.getElementById(id);
        if (el && !el.classList.contains('hidden') && el.style.display !== 'none' && (el.offsetWidth > 0 || el.offsetHeight > 0)) {
            return el;
        }
    }

    // 2. Any other modal or dialog
    const candidateOverlays = Array.from(document.querySelectorAll(
        '.menu-overlay:not(.hidden):not(#main-menu):not(#shared-menu-bg), [role="dialog"]:not(.hidden), [aria-modal="true"]:not(.hidden)'
    ));
    const visibleOverlays = candidateOverlays.filter(el => {
        return (el.offsetWidth > 0 || el.offsetHeight > 0) && el.style.display !== 'none';
    });
    if (visibleOverlays.length > 0) {
        visibleOverlays.sort((a, b) => {
            const za = parseInt(window.getComputedStyle ? window.getComputedStyle(a).zIndex : a.style.zIndex, 10) || 0;
            const zb = parseInt(window.getComputedStyle ? window.getComputedStyle(b).zIndex : b.style.zIndex, 10) || 0;
            return zb - za;
        });
        return visibleOverlays[0];
    }

    // 3. Main Menu (only when in MENU state or not actively playing)
    const isPlaying = (typeof window !== 'undefined' && window.STATE === 'PLAYING');
    if (!isPlaying) {
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu && !mainMenu.classList.contains('hidden') && mainMenu.style.display !== 'none') {
            return mainMenu;
        }
    }

    return null;
}

/**
 * Returns true if an interactive UI / menu / overlay is currently active
 */
export function isGamepadUINavigating() {
    return getActiveUIContainer() !== null;
}

/**
 * Get all focusable, visible interactive elements inside a container
 */
export function getFocusableElements(container) {
    if (!container) return [];

    const selector = [
        'button:not(:disabled)',
        'input:not([type="hidden"]):not(:disabled)',
        'select:not(:disabled)',
        'textarea:not(:disabled)',
        'a[href]',
        '[role="button"]:not([aria-disabled="true"])',
        '.keybind-btn',
        '.mc-btn',
        '.slot',
        '.recipe-book-item',
        '.recipe-pin-btn',
        '.ach-tab-btn',
        '.settings-tab-btn',
        '.controls-subtab-btn',
        '.auth-tab-btn',
        '.world-row',
        '.world-info',
        '[tabindex="0"]'
    ].join(', ');

    const raw = Array.from(container.querySelectorAll(selector));
    const unique = [];
    const seen = new Set();

    for (const el of raw) {
        if (!el || seen.has(el)) continue;
        seen.add(el);

        // Visibility & dimension checks
        if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
        if (el.style.display === 'none' || el.style.visibility === 'hidden') continue;
        if (el.disabled || el.getAttribute('aria-hidden') === 'true') continue;

        // Check if inside a hidden tab or parent within container
        const hiddenParent = el.closest('.hidden, [style*="display: none"]');
        if (hiddenParent && hiddenParent !== container && container.contains(hiddenParent)) continue;

        unique.push(el);
    }

    return unique;
}

/**
 * Set gamepad focus to an element and update visual styling
 */
export function setGamepadFocus(el) {
    if (gamepadFocusedElement && gamepadFocusedElement !== el) {
        gamepadFocusedElement.classList.remove('gamepad-focused');
    }

    gamepadFocusedElement = el;

    if (el) {
        el.classList.add('gamepad-focused');
        isGamepadUINavActive = true;
        try { el.focus({ preventScroll: true }); } catch (e) {}
        try {
            el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        } catch (e) {}
    }
}

/**
 * Clear the gamepad visual outline
 */
export function clearGamepadFocusVisuals() {
    if (gamepadFocusedElement) {
        gamepadFocusedElement.classList.remove('gamepad-focused');
    }
    isGamepadUINavActive = false;
}

/**
 * Perform spatial 2D navigation in a direction ('up', 'down', 'left', 'right')
 */
export function navigateDirection(dir) {
    const container = getActiveUIContainer();
    if (!container) return;

    const focusables = getFocusableElements(container);
    if (focusables.length === 0) return;

    // If currently focused element is invalid or not in container, select first sensible element
    if (!gamepadFocusedElement || !container.contains(gamepadFocusedElement) || !focusables.includes(gamepadFocusedElement)) {
        let bestDefault = null;
        if (container.id === 'main-menu') {
            bestDefault = document.getElementById('btn-main-singleplayer') || focusables[0];
        } else if (container.id === 'pause-menu') {
            bestDefault = document.getElementById('resume-btn') || focusables[0];
        } else if (container.id === 'settings-menu') {
            bestDefault = container.querySelector('.settings-tab-btn.active') || focusables[0];
        } else {
            bestDefault = focusables[0];
        }
        setGamepadFocus(bestDefault);
        return;
    }

    // Special range slider behavior: Left/Right adjusts value
    if (gamepadFocusedElement.tagName === 'INPUT' && gamepadFocusedElement.type === 'range') {
        if (dir === 'left') {
            stepSlider(gamepadFocusedElement, -1);
            return;
        } else if (dir === 'right') {
            stepSlider(gamepadFocusedElement, 1);
            return;
        }
    }

    // 2D Spatial positioning
    const curRect = gamepadFocusedElement.getBoundingClientRect();
    const curCx = curRect.left + curRect.width / 2;
    const curCy = curRect.top + curRect.height / 2;

    const candidates = focusables.filter(el => el !== gamepadFocusedElement);
    let bestCandidate = null;
    let lowestScore = Infinity;

    for (const cand of candidates) {
        const r = cand.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const dx = cx - curCx;
        const dy = cy - curCy;

        let inDirection = false;
        let score = Infinity;

        if (dir === 'up' && dy < -4) {
            inDirection = true;
            score = Math.hypot(dx, dy) + Math.abs(dx) * 2.2;
        } else if (dir === 'down' && dy > 4) {
            inDirection = true;
            score = Math.hypot(dx, dy) + Math.abs(dx) * 2.2;
        } else if (dir === 'left' && dx < -4) {
            inDirection = true;
            score = Math.hypot(dx, dy) + Math.abs(dy) * 2.2;
        } else if (dir === 'right' && dx > 4) {
            inDirection = true;
            score = Math.hypot(dx, dy) + Math.abs(dy) * 2.2;
        }

        if (inDirection && score < lowestScore) {
            lowestScore = score;
            bestCandidate = cand;
        }
    }

    if (bestCandidate) {
        setGamepadFocus(bestCandidate);
        if (typeof window !== 'undefined' && typeof window.playSound === 'function') {
            window.playSound('click', { isUI: true });
        }
    } else {
        // Fallback: cycle in DOM order
        const curIdx = focusables.indexOf(gamepadFocusedElement);
        if (curIdx !== -1) {
            let nextIdx;
            if (dir === 'down' || dir === 'right') {
                nextIdx = (curIdx + 1) % focusables.length;
            } else {
                nextIdx = (curIdx - 1 + focusables.length) % focusables.length;
            }
            setGamepadFocus(focusables[nextIdx]);
            if (typeof window !== 'undefined' && typeof window.playSound === 'function') {
                window.playSound('click', { isUI: true });
            }
        }
    }
}

/**
 * Step a range slider by one unit or custom step
 */
export function stepSlider(sliderEl, stepSign) {
    if (!sliderEl) return;
    const min = parseFloat(sliderEl.min) || 0;
    const max = parseFloat(sliderEl.max) || 100;
    const step = parseFloat(sliderEl.step) || 1;
    const curVal = parseFloat(sliderEl.value) || 0;
    const nextVal = Math.min(max, Math.max(min, curVal + step * stepSign));

    sliderEl.value = nextVal;
    sliderEl.dispatchEvent(new Event('input', { bubbles: true }));
    sliderEl.dispatchEvent(new Event('change', { bubbles: true }));

    triggerGamepadVibration(30, 0.25, 0.25);
    if (typeof window !== 'undefined' && typeof window.playSound === 'function') {
        window.playSound('click', { isUI: true });
    }
}

/**
 * Cycle tab groups with LB / RB bumpers
 */
export function cycleTabs(isNext) {
    const container = getActiveUIContainer();
    if (!container) return;

    // Check for Settings subtabs if Controls tab is open
    if (container.id === 'settings-menu') {
        const controlsPanel = document.getElementById('settings-tab-controls');
        if (controlsPanel && controlsPanel.classList.contains('active')) {
            const subtabs = Array.from(container.querySelectorAll('.controls-subtab-btn'));
            if (subtabs.length > 1 && gamepadFocusedElement && subtabs.some(st => st.contains(gamepadFocusedElement) || st === gamepadFocusedElement)) {
                const curIdx = subtabs.findIndex(t => t.classList.contains('active'));
                const nextIdx = (curIdx + (isNext ? 1 : -1) + subtabs.length) % subtabs.length;
                subtabs[nextIdx].click();
                setGamepadFocus(subtabs[nextIdx]);
                return;
            }
        }

        const tabs = Array.from(container.querySelectorAll('.settings-tab-btn'));
        if (tabs.length > 0) {
            const curIdx = tabs.findIndex(t => t.classList.contains('active'));
            const nextIdx = (curIdx + (isNext ? 1 : -1) + tabs.length) % tabs.length;
            tabs[nextIdx].click();
            setGamepadFocus(tabs[nextIdx]);
            return;
        }
    }

    // Achievements tabs
    if (container.id === 'achievements-modal') {
        const tabs = Array.from(container.querySelectorAll('.ach-tab-btn'));
        if (tabs.length > 0) {
            const curIdx = tabs.findIndex(t => t.classList.contains('active'));
            const nextIdx = (curIdx + (isNext ? 1 : -1) + tabs.length) % tabs.length;
            tabs[nextIdx].click();
            setGamepadFocus(tabs[nextIdx]);
            return;
        }
    }

    // Auth tabs
    if (container.id === 'auth-profile-modal') {
        const tabs = Array.from(container.querySelectorAll('.auth-tab-btn'));
        if (tabs.length > 0) {
            const curIdx = tabs.findIndex(t => t.classList.contains('active'));
            const nextIdx = (curIdx + (isNext ? 1 : -1) + tabs.length) % tabs.length;
            tabs[nextIdx].click();
            setGamepadFocus(tabs[nextIdx]);
            return;
        }
    }
}

/**
 * Master UI navigation handler called every frame
 */
export function handleGamepadUINavigation() {
    const gp = getActiveGamepad();
    if (!gp) return;

    const container = getActiveUIContainer();
    if (!container) {
        if (gamepadFocusedElement) {
            clearGamepadFocusVisuals();
            gamepadFocusedElement = null;
        }
        return;
    }

    // Auto-focus first element if none is selected yet
    if (!gamepadFocusedElement || !container.contains(gamepadFocusedElement)) {
        const focusables = getFocusableElements(container);
        if (focusables.length > 0) {
            let defaultEl = focusables[0];
            if (container.id === 'main-menu') {
                defaultEl = document.getElementById('btn-main-singleplayer') || defaultEl;
            } else if (container.id === 'pause-menu') {
                defaultEl = document.getElementById('resume-btn') || defaultEl;
            }
            setGamepadFocus(defaultEl);
        }
    }

    const now = performance.now();

    // 1. Directional Movement (Left Stick & D-Pad)
    const stickX = (gp.axes && gp.axes.length > 0) ? gp.axes[0] : 0;
    const stickY = (gp.axes && gp.axes.length > 1) ? gp.axes[1] : 0;
    const dUp = isGamepadButtonDown(gp, 12);
    const dDown = isGamepadButtonDown(gp, 13);
    const dLeft = isGamepadButtonDown(gp, 14);
    const dRight = isGamepadButtonDown(gp, 15);

    let currentDir = null;
    if (dUp || stickY < -0.55) {
        currentDir = 'up';
    } else if (dDown || stickY > 0.55) {
        currentDir = 'down';
    } else if (dLeft || stickX < -0.55) {
        currentDir = 'left';
    } else if (dRight || stickX > 0.55) {
        currentDir = 'right';
    }

    if (currentDir) {
        // Re-display focus visual if it was hidden by mouse
        if (!isGamepadUINavActive && gamepadFocusedElement) {
            setGamepadFocus(gamepadFocusedElement);
        }

        if (activeNavDirection !== currentDir) {
            activeNavDirection = currentDir;
            directionHoldStartTime = now;
            lastNavTimestamp = now;
            navigateDirection(currentDir);
        } else {
            const timeHeld = now - directionHoldStartTime;
            if (timeHeld >= NAV_INITIAL_DELAY_MS) {
                if (now - lastNavTimestamp >= NAV_REPEAT_INTERVAL_MS) {
                    lastNavTimestamp = now;
                    navigateDirection(currentDir);
                }
            }
        }
    } else {
        // Returned to deadzone
        activeNavDirection = null;
    }

    // 2. Action Buttons
    // Button 0 (A / Cross): Click / Select
    if (justPressedButtons[0]) {
        if (!isGamepadUINavActive && gamepadFocusedElement) {
            setGamepadFocus(gamepadFocusedElement);
        }
        if (gamepadFocusedElement) {
            triggerGamepadVibration(40, 0.35, 0.35);

            if (gamepadFocusedElement.tagName === 'INPUT' && (gamepadFocusedElement.type === 'checkbox' || gamepadFocusedElement.type === 'radio')) {
                gamepadFocusedElement.checked = !gamepadFocusedElement.checked;
                gamepadFocusedElement.dispatchEvent(new Event('change', { bubbles: true }));
            } else if (gamepadFocusedElement.classList.contains('slot')) {
                gamepadFocusedElement.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 0 }));
                gamepadFocusedElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
                gamepadFocusedElement.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }));
                gamepadFocusedElement.click();
            } else {
                gamepadFocusedElement.click();
            }

            if (gamepadFocusedElement.tagName === 'INPUT' && (gamepadFocusedElement.type === 'text' || gamepadFocusedElement.type === 'password' || gamepadFocusedElement.type === 'number')) {
                gamepadFocusedElement.focus();
            }
        }
    }

    // Button 1 (B / Circle): Back / Cancel / Dismiss
    if (justPressedButtons[1]) {
        triggerGamepadVibration(35, 0.25, 0.25);
        if (container.id !== 'main-menu') {
            if (typeof window !== 'undefined' && typeof window.closeForegroundScreen === 'function') {
                window.closeForegroundScreen();
            } else {
                // Fallback close button search
                const closeBtn = container.querySelector('.close-modal-btn, [data-action="close"], .btn-back, #btn-settings-back, #btn-worlds-back, #btn-achievements-close, #btn-skin-close, #btn-auth-close, #resume-btn');
                if (closeBtn) closeBtn.click();
            }
            // Auto focus new active container
            setTimeout(() => {
                const nextContainer = getActiveUIContainer();
                if (nextContainer) {
                    const focusables = getFocusableElements(nextContainer);
                    if (focusables.length > 0) setGamepadFocus(focusables[0]);
                }
            }, 50);
        }
    }

    // Button 2 (X / Square): Right Click on Inventory Slots
    if (justPressedButtons[2]) {
        if (gamepadFocusedElement && gamepadFocusedElement.classList.contains('slot')) {
            triggerGamepadVibration(30, 0.25, 0.25);
            gamepadFocusedElement.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true, button: 2 }));
            gamepadFocusedElement.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 2 }));
            gamepadFocusedElement.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 2 }));
        }
    }

    // Button 4 & 5 (LB / RB): Cycle Tabs
    if (justPressedButtons[4]) {
        triggerGamepadVibration(25, 0.2, 0.2);
        cycleTabs(false);
    }
    if (justPressedButtons[5]) {
        triggerGamepadVibration(25, 0.2, 0.2);
        cycleTabs(true);
    }

    // Button 9 (Start / Menu): Pause / Resume
    if (justPressedButtons[9]) {
        if (typeof window !== 'undefined' && typeof window.closeForegroundScreen === 'function') {
            window.closeForegroundScreen();
        }
    }

    // Button 3 (Y / Triangle): Inventory Toggle
    if (justPressedButtons[3]) {
        if (typeof window !== 'undefined' && typeof window.toggleInventory === 'function') {
            window.toggleInventory();
        }
    }
}


/**
 * Initialize event listeners for Gamepad connect / disconnect
 */
export function initGamepadListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('gamepadconnected', (e) => {
        connectedGamepads[e.gamepad.index] = e.gamepad;
        activeGamepadIndex = e.gamepad.index;
        lastActiveGamepadTime = Date.now();
        isUsingGamepad = true;

        if (typeof window.showToast === 'function') {
            window.showToast(`Controller Connected: ${e.gamepad.id.split('(')[0].trim() || 'Gamepad'}`);
        }
        if (typeof window.updateGamepadUI === 'function') {
            window.updateGamepadUI();
        }
    });

    window.addEventListener('gamepaddisconnected', (e) => {
        delete connectedGamepads[e.gamepad.index];
        if (activeGamepadIndex === e.gamepad.index) {
            const remaining = Object.keys(connectedGamepads);
            activeGamepadIndex = remaining.length > 0 ? parseInt(remaining[0], 10) : -1;
        }

        if (typeof window.showToast === 'function') {
            window.showToast('Controller Disconnected');
        }
        if (typeof window.updateGamepadUI === 'function') {
            window.updateGamepadUI();
        }
    });

    // Mouse movement cleanly dims controller focus highlight
    window.addEventListener('mousemove', () => {
        if (isGamepadUINavActive) {
            clearGamepadFocusVisuals();
        }
    }, { passive: true });

    // Keyboard ESC cancels active gamepad rebinding
    window.addEventListener('keydown', (e) => {
        if (rebindingGamepadAction && (e.key === 'Escape' || e.code === 'Escape')) {
            e.preventDefault();
            e.stopPropagation();
            cancelGamepadRebinding();
        }
    }, true);

    loadGamepadConfig();
}

// Auto-initialize when loaded in browser
if (typeof window !== 'undefined') {
    initGamepadListeners();

    // Global bridge for cross-module compatibility
    try { window.GamepadManager = {
        updateGamepad,
        isGamepadConnected,
        getActiveGamepad,
        getGamepadMoveAxis,
        getGamepadVerticalAxis,
        getGamepadAimVector,
        isGamepadActionActive,
        isGamepadActionJustPressed,
        isGamepadActionJustReleased,
        startGamepadRebinding,
        cancelGamepadRebinding,
        resetGamepadBindings,
        resetGamepadSettings,
        setGamepadSetting,
        triggerGamepadVibration,
        getPressedButtonIndices,
        formatGamepadButtonName,
        gamepadBindings,
        gamepadSettings,
        // UI Navigation
        getActiveUIContainer,
        isGamepadUINavigating,
        getFocusableElements,
        setGamepadFocus,
        clearGamepadFocusVisuals,
        navigateDirection,
        stepSlider,
        cycleTabs,
        handleGamepadUINavigation,
        get gamepadFocusedElement() { return gamepadFocusedElement; }
    }; } catch (e) {}
}

