// =============================================================================
// WEBCRAFT 2D - PARTICLES & FLOATING FX (js/rendering/particles.js)
// Particle systems, floating combat numbers, and musical note effects
// =============================================================================

import {
    GRAVITY
} from '../core/constants.js';

import {
    particles, floatingTexts
} from '../core/state.js';

    export class Particle {
        constructor(x = 0, y = 0, color = '#ffffff') {
            this.init(x, y, color);
        }
        init(x, y, color) {
            this.x = x; this.y = y;
            this.vx = (Math.random() - 0.5) * 8;
            this.vy = (Math.random() - 1) * 8;
            this.life = 20 + Math.random() * 15;
            this.color = color;
            this.size = Math.random() * 4 + 2;
            this.alive = true;
        }
        update() {
            if (!this.alive) return;
            this.x += this.vx; this.y += this.vy; this.vy += GRAVITY * 0.9;
            this.life--;
            if (this.life <= 0) this.alive = false;
        }
        draw(ctx, camX, camY) {
            if (!this.alive) return;
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - camX, this.y - camY, this.size, this.size);
        }
    }

    export const MAX_PARTICLES = 160;
    export function spawnParticle(x, y, color) {
        for (let i = 0; i < particles.length; i++) {
            if (!particles[i].alive) {
                particles[i].init(x, y, color);
                return particles[i];
            }
        }
        if (particles.length < MAX_PARTICLES) {
            const p = new Particle(x, y, color);
            particles.push(p);
            return p;
        }
        const p = particles[0];
        p.init(x, y, color);
        return p;
    }

    export class FloatingText {
        constructor(x, y, text, color) {
            this.x = x; this.y = y; this.text = text; this.color = color;
            this.life = 40; this.vy = -1.5;
        }
        update() { this.y += this.vy; this.life--; }
        draw(ctx, camX, camY) {
            ctx.globalAlpha = Math.max(0, this.life / 40);
            ctx.fillStyle = this.color; ctx.font = '24px "VT323"';
            ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
            ctx.strokeText(this.text, this.x - camX, this.y - camY);
            ctx.fillText(this.text, this.x - camX, this.y - camY);
            ctx.globalAlpha = 1.0;
        }
    }

    export const NOTE_PATTERNS = [
        // 0: Single Eighth Note ♪ (8x8)
        [
            "....###.",
            "....###.",
            "....##.#",
            "....##..",
            "....##..",
            "..####..",
            ".######.",
            "..####.."
        ],
        // 1: Beamed Double Note ♫ (9x8)
        [
            ".#######.",
            ".#######.",
            ".##...##.",
            ".##...##.",
            ".##...##.",
            "####.####",
            "#########",
            ".###..###"
        ]
    ];

    export class NoteParticle {
        constructor(x = 0, y = 0) {
            this.init(x, y);
        }
        init(x, y) {
            this.startX = x;
            this.x = x;
            this.y = y;
            this.patternIndex = Math.random() < 0.5 ? 0 : 1;
            const colors = ['#f43f5e', '#ec4899', '#a855f7', '#6366f1', '#3b82f6', '#06b6d4', '#10b981', '#eab308'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.life = 55 + Math.random() * 25;
            this.maxLife = this.life;
            this.vy = -(1.2 + Math.random() * 0.8);
            this.freq = 0.08 + Math.random() * 0.06;
            this.amp = 8 + Math.random() * 8;
            this.time = Math.random() * 100;
            this.pSize = 2;
            this.alive = true;
        }
        update() {
            if (!this.alive) return;
            this.time += 1;
            this.y += this.vy;
            this.x = this.startX + Math.sin(this.time * this.freq) * this.amp;
            this.life--;
            if (this.life <= 0) this.alive = false;
        }
        draw(ctx, camX, camY) {
            if (!this.alive) return;
            const alpha = Math.max(0, Math.min(1, this.life / (this.maxLife * 0.25)));
            const pattern = NOTE_PATTERNS[this.patternIndex] || NOTE_PATTERNS[0];
            const rows = pattern.length;
            const cols = pattern[0].length;
            const pSize = this.pSize;
            const originX = Math.round(this.x - camX - (cols * pSize) / 2);
            const originY = Math.round(this.y - camY - (rows * pSize) / 2);

            ctx.save();
            ctx.globalAlpha = alpha;
            // 1) 1-texel black pixel drop-shadow
            ctx.fillStyle = '#000000';
            for (let r = 0; r < rows; r++) {
                const rowStr = pattern[r];
                for (let c = 0; c < cols; c++) {
                    if (rowStr[c] === '#') {
                        ctx.fillRect(originX + c * pSize + 1, originY + r * pSize + 1, pSize, pSize);
                    }
                }
            }
            // 2) Main colored pixel note
            ctx.fillStyle = this.color;
            for (let r = 0; r < rows; r++) {
                const rowStr = pattern[r];
                for (let c = 0; c < cols; c++) {
                    if (rowStr[c] === '#') {
                        ctx.fillRect(originX + c * pSize, originY + r * pSize, pSize, pSize);
                    }
                }
            }
            ctx.restore();
        }
    }

    export let noteParticles = [];
    export function spawnNoteParticle(x, y) {
        for (let i = 0; i < noteParticles.length; i++) {
            if (!noteParticles[i].alive) {
                noteParticles[i].init(x, y);
                return noteParticles[i];
            }
        }
        if (noteParticles.length < 50) {
            const np = new NoteParticle(x, y);
            noteParticles.push(np);
            return np;
        }
        const np = noteParticles[0];
        np.init(x, y);
        return np;
    }
    

// Global Window Registration for cross-module compatibility
if (typeof window !== 'undefined') {
    window.Particle = Particle;
    window.MAX_PARTICLES = MAX_PARTICLES;
    window.spawnParticle = spawnParticle;
    window.FloatingText = FloatingText;
    window.NOTE_PATTERNS = NOTE_PATTERNS;
    window.NoteParticle = NoteParticle;
    window.noteParticles = noteParticles;
    window.spawnNoteParticle = spawnNoteParticle;
}
