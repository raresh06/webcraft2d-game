// =============================================================================
// WEBCRAFT 2D - TOASTS & NOTIFICATION BANNERS (js/ui/toasts.js)
// Alert toasts, planar rift arrival/departure announcement banners.
// Decoupled to eliminate circular dependency between ui.js and riftexplorerspawner.js.
// =============================================================================

import { IDS } from '../core/constants.js';

export function showToast(msg, iconOrDuration = null, maybeDuration = 3000) {
    if (typeof document === 'undefined') return;
    const c = document.getElementById('toast-container');
    if (!c) return;

    let iconHtml = null;
    let duration = 3000;

    if (typeof iconOrDuration === 'number') {
        duration = iconOrDuration;
    } else if (typeof iconOrDuration === 'string') {
        if (/^\d+$/.test(iconOrDuration.trim())) {
            duration = parseInt(iconOrDuration.trim(), 10);
        } else {
            iconHtml = iconOrDuration;
            if (typeof maybeDuration === 'number') {
                duration = maybeDuration;
            }
        }
    }

    const t = document.createElement('div');
    t.className = 'toast flex items-center gap-2.5';
    if (iconHtml) {
        t.innerHTML = `${iconHtml}<span>${msg}</span>`;
    } else {
        t.innerText = msg;
    }
    c.appendChild(t);
    setTimeout(() => { if (t.parentElement) t.remove(); }, duration);
}

export function showKaelArrivalBanner() {
    if (typeof document === 'undefined') return;
    let container = document.getElementById('kael-banner-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'kael-banner-container';
        document.body.appendChild(container);
    }

    const banner = document.createElement('div');
    banner.className = 'kael-arrival-banner';

    const iconFrame = document.createElement('div');
    iconFrame.className = 'kael-relic-frame';
    const astralShardId = (IDS && IDS.ASTRAL_SHARD) ? IDS.ASTRAL_SHARD : 166;
    const texturesObj = (typeof window !== 'undefined' && window.textures) ? window.textures : null;
    if (texturesObj && texturesObj[astralShardId]) {
        const img = document.createElement('img');
        img.src = texturesObj[astralShardId].src;
        img.className = 'w-8 h-8 pixelated drop-shadow-[2px_2px_0_#000]';
        iconFrame.appendChild(img);
    } else {
        iconFrame.innerHTML = `
            <svg viewBox="0 0 24 24" width="28" height="28" style="image-rendering: pixelated; shape-rendering: crispEdges;">
                <rect x="10" y="2" width="4" height="2" fill="#fde047"/>
                <rect x="8" y="4" width="8" height="3" fill="#c084fc"/>
                <rect x="6" y="7" width="12" height="10" fill="#a855f7"/>
                <rect x="8" y="10" width="8" height="4" fill="#7e22ce"/>
                <rect x="9" y="17" width="6" height="3" fill="#6b21a8"/>
                <rect x="11" y="20" width="2" height="2" fill="#3b0764"/>
                <rect x="9" y="8" width="2" height="2" fill="#ffffff"/>
            </svg>
        `;
    }
    banner.appendChild(iconFrame);

    const content = document.createElement('div');
    content.className = 'flex flex-col min-w-0';

    const header = document.createElement('span');
    header.className = "kael-banner-header text-amber-300 font-bold font-['VT323'] tracking-widest leading-none drop-shadow-[2px_2px_0_#000] uppercase";
    header.style.color = '#fde047';
    header.innerText = 'PLANAR RIFT OPENED';
    content.appendChild(header);

    const title = document.createElement('span');
    title.className = "kael-banner-title text-2xl sm:text-3xl text-white font-bold font-['VT323'] drop-shadow-[2px_2px_0_#000] truncate leading-tight";
    title.style.color = '#ffffff';
    title.innerText = 'Kael, The Atlas Explorer has arrived!';
    content.appendChild(title);

    const subtitle = document.createElement('span');
    subtitle.className = "kael-banner-subtitle text-sm sm:text-base text-white font-['VT323'] drop-shadow-[1px_1px_0_#000] leading-none mt-0.5";
    subtitle.style.color = '#ffffff';
    subtitle.innerText = 'Seek the cosmic traveler before the rift collapses!';
    content.appendChild(subtitle);

    banner.appendChild(content);
    container.appendChild(banner);

    if (typeof playSound === 'function') {
        playSound('portal_warp', { vol: 1.0 });
    } else if (typeof window !== 'undefined' && typeof window.playSound === 'function') {
        window.playSound('portal_warp', { vol: 1.0 });
    }

    setTimeout(() => {
        banner.classList.add('dismissing');
        setTimeout(() => {
            if (banner.parentElement) banner.remove();
        }, 400);
    }, 6500);
}

export function showKaelDepartureBanner() {
    if (typeof closeAtlasDialogue === 'function') closeAtlasDialogue();
    else if (typeof window !== 'undefined' && typeof window.closeAtlasDialogue === 'function') window.closeAtlasDialogue();

    if (typeof closeAtlasMarket === 'function') closeAtlasMarket();
    else if (typeof window !== 'undefined' && typeof window.closeAtlasMarket === 'function') window.closeAtlasMarket();

    if (typeof document === 'undefined') return;
    let container = document.getElementById('kael-banner-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'kael-banner-container';
        document.body.appendChild(container);
    }

    const banner = document.createElement('div');
    banner.className = 'kael-arrival-banner';

    const iconFrame = document.createElement('div');
    iconFrame.className = 'kael-relic-frame';
    iconFrame.innerHTML = `
        <svg viewBox="0 0 24 24" width="28" height="28" style="image-rendering: pixelated; shape-rendering: crispEdges;">
            <rect x="4" y="2" width="16" height="20" fill="#1e1035"/>
            <rect x="7" y="6" width="10" height="12" fill="#311042"/>
            <rect x="10" y="9" width="4" height="6" fill="#6b21a8"/>
            <rect x="11" y="11" width="2" height="2" fill="#38bdf8"/>
        </svg>
    `;
    banner.appendChild(iconFrame);

    const content = document.createElement('div');
    content.className = 'flex flex-col min-w-0';

    const header = document.createElement('span');
    header.className = "kael-banner-header text-amber-400 font-bold font-['VT323'] tracking-widest leading-none drop-shadow-[2px_2px_0_#000] uppercase";
    header.style.color = '#fbbf24';
    header.innerText = 'PLANAR RIFT COLLAPSED';
    content.appendChild(header);

    const title = document.createElement('span');
    title.className = "kael-banner-title text-2xl sm:text-3xl text-white font-bold font-['VT323'] drop-shadow-[2px_2px_0_#000] truncate leading-tight";
    title.style.color = '#ffffff';
    title.innerText = 'Kael has departed through the void.';
    content.appendChild(title);

    const subtitle = document.createElement('span');
    subtitle.className = "kael-banner-subtitle text-sm sm:text-base text-white font-['VT323'] drop-shadow-[1px_1px_0_#000] leading-none mt-0.5";
    subtitle.style.color = '#ffffff';
    subtitle.innerText = 'The cosmic traveler will return on another day.';
    content.appendChild(subtitle);

    banner.appendChild(content);
    container.appendChild(banner);

    if (typeof playSound === 'function') {
        playSound('portal_warp', { vol: 0.7 });
    } else if (typeof window !== 'undefined' && typeof window.playSound === 'function') {
        window.playSound('portal_warp', { vol: 0.7 });
    }

    setTimeout(() => {
        banner.classList.add('dismissing');
        setTimeout(() => {
            if (banner.parentElement) banner.remove();
        }, 400);
    }, 5000);
}

// Backward compatibility window bindings
if (typeof window !== 'undefined') {
    window.showToast = showToast;
    window.showKaelArrivalBanner = showKaelArrivalBanner;
    window.showKaelDepartureBanner = showKaelDepartureBanner;
}
