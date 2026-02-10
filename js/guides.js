/**
 * guides.js — Typography guide lines
 * Interactive, draggable guide lines rendered on the letter canvas.
 */

export const TYPO_TERMS = [
    { id: 'ascender',   name: 'Ascender Line', color: '#E53935' },
    { id: 'cap-height', name: 'Cap Height',    color: '#FB8C00' },
    { id: 'x-height',   name: 'x-Height',      color: '#43A047' },
    { id: 'baseline',   name: 'Baseline',       color: '#1446FF' },
    { id: 'descender',  name: 'Descender Line', color: '#8E24AA' },
];

/**
 * Manages draggable typography guide lines on a canvas.
 * Positions are stored as 0–1 fractions of canvas height.
 */
export class GuideLineEditor {
    constructor(canvas) {
        this.canvas = canvas;
        this.panel  = canvas.parentElement;
        this.ctx    = canvas.getContext('2d');

        // Default Y positions (fraction of canvas height)
        this.positions = {
            'ascender':   0.05,
            'cap-height': 0.12,
            'x-height':   0.30,
            'baseline':   0.70,
            'descender':  0.90,
        };

        this.dragging = null;

        // Create a DOM label for each guide line
        this.labels = {};
        for (const term of TYPO_TERMS) {
            const el = document.createElement('span');
            el.className    = 'guide-label';
            el.dataset.guide = term.id;
            el.textContent  = term.name;
            el.style.color  = term.color;
            this.panel.appendChild(el);
            this.labels[term.id] = el;
        }

        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseMove = this._onMouseMove.bind(this);
        this._onMouseUp   = this._onMouseUp.bind(this);

        this.panel.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('mouseup', this._onMouseUp);
    }

    /** Convert clientY to a 0–1 fraction of canvas height. */
    _toFraction(clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    }

    _onMouseDown(e) {
        const label = e.target.closest('.guide-label');
        if (!label) return;
        this.dragging = label.dataset.guide;
        e.preventDefault();
    }

    _onMouseMove(e) {
        if (!this.dragging) return;
        this.positions[this.dragging] = this._toFraction(e.clientY);
    }

    _onMouseUp() {
        this.dragging = null;
    }

    /** Draw all guide lines and position their DOM labels. */
    draw() {
        const ctx = this.ctx;
        const w   = this.canvas.width;
        const h   = this.canvas.height;

        const panelRect  = this.panel.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        const canvasLeft = canvasRect.left - panelRect.left;
        const canvasTop  = canvasRect.top  - panelRect.top;
        const cssHeight  = canvasRect.height;

        ctx.save();
        for (const term of TYPO_TERMS) {
            const frac = this.positions[term.id];
            const y    = frac * h;

            // Dashed line across canvas
            ctx.beginPath();
            ctx.strokeStyle = term.color;
            ctx.lineWidth   = 1.5;
            ctx.setLineDash([8, 6]);
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Position DOM label to the left of the canvas
            const label = this.labels[term.id];
            label.style.top     = (canvasTop + frac * cssHeight) + 'px';
            label.style.right   = (panelRect.width - canvasLeft + 8) + 'px';
            label.style.display = '';
        }
        ctx.restore();
    }

    /** Hide all DOM labels (when guides are toggled off). */
    hideLabels() {
        for (const term of TYPO_TERMS) {
            this.labels[term.id].style.display = 'none';
        }
    }
}
