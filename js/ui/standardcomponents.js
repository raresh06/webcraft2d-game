/**
 * Webcraft2D Universal Standard UI Component System
 * 
 * Defines the unified visual standard and reusable HTML generators based on the
 * Fabulous Graphics aesthetic:
 *  - Charcoal stone panels (#20252b with 135deg subtle scanlines)
 *  - 4px beveled stone borders (#aebac2 top/left highlight, #080a0c bottom/right shadow)
 *  - VT323 pixel font titles (#ffd34d / var(--mc-accent-color) with drop-shadows)
 *  - Standard rectangular ON/OFF toggle switches (.mc-btn.is-on / .mc-btn.is-off)
 *  - Amber/gold glowing active preset tabs (.settings-tab-btn.active)
 *  - Standard action buttons: .btn-primary (green), .btn-secondary (slate), .btn-danger (red), .btn-amber (amber)
 */

/**
 * Update a toggle button element's DOM state, classes (.is-on / .is-off), and text.
 * @param {string|HTMLElement} btnOrId - Button element or its DOM ID
 * @param {boolean} isOn - Whether the option is currently ON
 * @param {string} [onText='ON'] - Label when active
 * @param {string} [offText='OFF'] - Label when inactive
 */
export function updateToggleBtnState(btnOrId, isOn, onText = 'ON', offText = 'OFF') {
    const btn = typeof btnOrId === 'string' ? document.getElementById(btnOrId) : btnOrId;
    if (!btn) return;

    btn.innerText = isOn ? onText : offText;
    if (isOn) {
        btn.classList.add('is-on');
        btn.classList.remove('is-off');
        btn.setAttribute('aria-pressed', 'true');
    } else {
        btn.classList.add('is-off');
        btn.classList.remove('is-on');
        btn.setAttribute('aria-pressed', 'false');
    }
}

/**
 * Update the active state of preset tabs in a container.
 * @param {string|HTMLElement} containerOrId - Container element or ID
 * @param {string} activeValue - The value/dataset attribute of the active preset
 */
export function updatePresetTabsState(containerOrId, activeValue) {
    const container = typeof containerOrId === 'string' ? document.getElementById(containerOrId) : containerOrId;
    if (!container) return;

    const btns = container.querySelectorAll('.settings-tab-btn, .preset-tab-btn');
    btns.forEach(btn => {
        const val = btn.dataset.preset || btn.dataset.value || btn.dataset.tab;
        const isActive = val === activeValue;
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
}

/**
 * Generate a standard option row container.
 */
export function renderStandardOptionRow({
    id = '',
    title = '',
    description = '',
    controlHtml = '',
    fullWidth = false,
    extraClasses = ''
}) {
    const idAttr = id ? ` id="${id}"` : '';
    const spanClass = fullWidth ? ' md:col-span-2' : '';
    const descHtml = description
        ? `<span class="fabulous-option-desc font-['VT323'] truncate" title="${description}">${description}</span>`
        : '';

    return `
        <div class="settings-row${spanClass} ${extraClasses}"${idAttr}>
            <div class="flex flex-col min-w-0 pr-2">
                <span class="settings-label" title="${title}">${title}</span>
                ${descHtml}
            </div>
            ${controlHtml}
        </div>
    `;
}

/**
 * Generate a standard toggle switch row with rectangular ON/OFF button.
 */
export function renderStandardToggleRow({
    id = '',
    buttonId = '',
    title = '',
    description = '',
    isChecked = false,
    onclick = '',
    onText = 'ON',
    offText = 'OFF',
    fullWidth = false
}) {
    const btnClass = isChecked ? 'mc-btn is-on' : 'mc-btn is-off';
    const btnText = isChecked ? onText : offText;
    const btnIdAttr = buttonId ? ` id="${buttonId}"` : '';
    const onclickAttr = onclick ? ` onclick="${onclick}"` : '';
    const ariaPressed = isChecked ? 'true' : 'false';

    const controlHtml = `
        <button type="button" class="${btnClass}"${btnIdAttr}${onclickAttr} aria-pressed="${ariaPressed}">
            ${btnText}
        </button>
    `;

    return renderStandardOptionRow({
        id,
        title,
        description,
        controlHtml,
        fullWidth
    });
}

/**
 * Generate a standard slider row with range input and numeric badge.
 */
export function renderStandardSliderRow({
    id = '',
    sliderId = '',
    badgeId = '',
    title = '',
    description = '',
    value = 50,
    min = 0,
    max = 100,
    step = 1,
    unit = '%',
    oninput = '',
    fullWidth = false
}) {
    const sIdAttr = sliderId ? ` id="${sliderId}"` : '';
    const bIdAttr = badgeId ? ` id="${badgeId}"` : '';
    const oninputAttr = oninput ? ` oninput="${oninput}"` : '';

    const controlHtml = `
        <div class="settings-slider-wrap">
            <input type="range" min="${min}" max="${max}" step="${step}" value="${value}" class="settings-slider"${sIdAttr}${oninputAttr}>
            <span class="settings-val-badge"${bIdAttr}>${value}${unit}</span>
        </div>
    `;

    return renderStandardOptionRow({
        id,
        title,
        description,
        controlHtml,
        fullWidth
    });
}

/**
 * Generate a horizontal preset tab button group.
 */
export function renderStandardPresetTabs({
    id = '',
    presets = [], // [{ id, label, value }]
    activeValue = '',
    onselect = '' // Function name to call with the preset value, e.g. "selectPreset"
}) {
    const idAttr = id ? ` id="${id}"` : '';
    const buttonsHtml = presets.map(p => {
        const isActive = p.value === activeValue || p.id === activeValue;
        const activeClass = isActive ? ' active' : '';
        const pIdAttr = p.id ? ` id="${p.id}"` : '';
        const onclickAttr = onselect ? ` onclick="${onselect}('${p.value || p.id}')"` : '';

        return `
            <button type="button" class="settings-tab-btn${activeClass}"${pIdAttr} data-preset="${p.value || p.id}"${onclickAttr}>
                ${p.label}
            </button>
        `;
    }).join('');

    return `
        <div class="settings-tabs-bar"${idAttr}>
            ${buttonsHtml}
        </div>
    `;
}

/**
 * Generate a standard section header with VT323 typography and border.
 */
export function renderStandardSectionTitle(title, extraHtml = '') {
    return `
        <div class="settings-section-title flex items-center justify-between">
            <span>${title}</span>
            ${extraHtml ? `<div class="flex items-center gap-2">${extraHtml}</div>` : ''}
        </div>
    `;
}

/**
 * Generate a standard action button matching the unified palette.
 * @param {Object} options
 * @param {string} [options.id]
 * @param {string} options.text
 * @param {'primary'|'secondary'|'danger'|'amber'} [options.type='secondary']
 * @param {string} [options.onclick]
 * @param {string} [options.extraClasses]
 * @param {string} [options.iconSvg]
 */
export function renderStandardButton({
    id = '',
    text = '',
    type = 'secondary',
    onclick = '',
    extraClasses = '',
    iconSvg = ''
}) {
    const idAttr = id ? ` id="${id}"` : '';
    const onclickAttr = onclick ? ` onclick="${onclick}"` : '';
    let typeClass = 'btn-secondary';
    if (type === 'primary') typeClass = 'btn-primary';
    else if (type === 'danger') typeClass = 'btn-danger';
    else if (type === 'amber') typeClass = 'btn-amber';

    const iconHtml = iconSvg ? `<span class="inline-flex items-center shrink-0 mr-1.5">${iconSvg}</span>` : '';

    return `
        <button type="button" class="mc-btn ${typeClass} ${extraClasses}"${idAttr}${onclickAttr}>
            ${iconHtml}${text}
        </button>
    `;
}

/**
 * Generate a complete standard modal container.
 */
export function renderStandardModal({
    id = '',
    title = '',
    subtitle = '',
    tabs = [],
    activeTab = '',
    contentHtml = '',
    footerHtml = '',
    maxWidth = '840px',
    maxHeight = '620px',
    onclose = '',
    extraClasses = ''
}) {
    const idAttr = id ? ` id="${id}"` : '';
    const tabsHtml = tabs && tabs.length > 0 ? renderStandardPresetTabs({ presets: tabs, activeValue: activeTab }) : '';
    const subtitleHtml = subtitle ? `<p class="modal-subtitle text-center mb-3 text-shadow-sm">${subtitle}</p>` : '';
    const closeBtnHtml = onclose
        ? `<button type="button" class="modal-close-red-btn absolute top-3 right-3" onclick="${onclose}" aria-label="Close">✕</button>`
        : '';

    return `
        <div class="menu-overlay hidden backdrop-blur-sm z-[160] flex items-center justify-center p-3 select-none ${extraClasses}"${idAttr} role="dialog" aria-modal="true">
            <section class="settings-panel select-none" style="max-width:${maxWidth};max-height:${maxHeight};">
                ${closeBtnHtml}
                <h1 class="screen-title text-center font-pixeloid-bold">${title}</h1>
                ${subtitleHtml}
                ${tabsHtml}
                <div class="fabulous-tab-content custom-scrollbar flex-1 min-h-0">
                    ${contentHtml}
                </div>
                ${footerHtml ? `<div class="mt-3 pt-2 border-t-2 border-[#46515a] flex justify-between items-center">${footerHtml}</div>` : ''}
            </section>
        </div>
    `;
}

// Global exposure for non-module scripts and inline handlers
if (typeof window !== 'undefined') {
    window.UIComponents = {
        updateToggleBtnState,
        updatePresetTabsState,
        renderStandardOptionRow,
        renderStandardToggleRow,
        renderStandardSliderRow,
        renderStandardPresetTabs,
        renderStandardSectionTitle,
        renderStandardButton,
        renderStandardModal
    };
}

