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
        gamepadSettings
    }; } catch (e) {}
}

