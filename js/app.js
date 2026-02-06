/* ==========================================================================
   bodyText — main application
   Orchestrates camera, pose detection, stickman rendering, and guide lines
   ========================================================================== */

import { PoseDetector } from './pose.js';
import { drawStickman } from './renderer.js';
import { TYPO_TERMS, computeGuideLines, drawGuides } from './guides.js';

// ── DOM refs ────────────────────────────────────────────────────────────────
const videoEl   = document.getElementById('video');
const canvasEl  = document.getElementById('canvas');
const statusEl  = document.getElementById('status');
const termsEl   = document.getElementById('terms-list');
const btnGuides = document.getElementById('btn-toggle-guides');
const btnVideo  = document.getElementById('btn-toggle-video');

// ── State ───────────────────────────────────────────────────────────────────
let showGuides = true;
let showVideo  = true;
let detector   = null;
let ctx        = null;

// ── Camera ──────────────────────────────────────────────────────────────────
async function initCamera() {
    statusEl.textContent = 'Requesting camera…';
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
    });
    videoEl.srcObject = stream;
    return new Promise((resolve) => {
        videoEl.onloadedmetadata = () => { videoEl.play(); resolve(); };
    });
}

// ── Canvas sizing ───────────────────────────────────────────────────────────
function setupCanvas() {
    const container = canvasEl.parentElement;
    const resize = () => {
        canvasEl.width  = container.clientWidth;
        canvasEl.height = container.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    ctx = canvasEl.getContext('2d');
}

// ── Sidebar: typography terms list ──────────────────────────────────────────
function buildTermsList() {
    for (const term of TYPO_TERMS) {
        const li = document.createElement('li');
        li.className = 'term-item';
        li.id = `term-${term.id}`;
        li.innerHTML =
            `<div class="term-name" style="color:${term.color}">${term.name}</div>` +
            `<div class="term-description">${term.description}</div>`;
        termsEl.appendChild(li);
    }
}

// ── Render loop ─────────────────────────────────────────────────────────────
function render() {
    const w = canvasEl.width;
    const h = canvasEl.height;

    ctx.clearRect(0, 0, w, h);

    // Draw the webcam feed, mirrored so it feels like a mirror
    if (showVideo) {
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoEl, 0, 0, w, h);
        ctx.restore();
    } else {
        ctx.fillStyle = '#fefefe';
        ctx.fillRect(0, 0, w, h);
    }

    // Process keypoints
    const keypoints = detector.getKeypoints();
    if (keypoints) {
        // Scale from video coords → canvas coords, mirroring X
        const scaleX = w / videoEl.videoWidth;
        const scaleY = h / videoEl.videoHeight;
        const scaled = keypoints.map((kp) => ({
            ...kp,
            x: w - kp.x * scaleX,   // mirror horizontally
            y: kp.y * scaleY,
        }));

        drawStickman(ctx, scaled);

        if (showGuides) {
            const guides = computeGuideLines(scaled, h);
            drawGuides(ctx, guides, w);

            // Highlight active terms in the sidebar
            for (const term of TYPO_TERMS) {
                const el = document.getElementById(`term-${term.id}`);
                if (el) el.classList.toggle('active', guides !== null);
            }
        }
    }

    requestAnimationFrame(render);
}

// ── Controls ────────────────────────────────────────────────────────────────
function bindControls() {
    btnGuides.addEventListener('click', () => {
        showGuides = !showGuides;
        btnGuides.textContent = showGuides ? 'Hide Guides' : 'Show Guides';
    });
    btnVideo.addEventListener('click', () => {
        showVideo = !showVideo;
        btnVideo.textContent = showVideo ? 'Hide Video' : 'Show Video';
    });
}

// ── Boot ────────────────────────────────────────────────────────────────────
async function init() {
    try {
        buildTermsList();
        bindControls();
        setupCanvas();

        await initCamera();

        statusEl.textContent = 'Loading pose model…';
        detector = new PoseDetector();
        await detector.init(videoEl);

        statusEl.textContent = 'Ready — step into frame';
        requestAnimationFrame(render);
    } catch (err) {
        statusEl.textContent = `Error: ${err.message}`;
        console.error(err);
    }
}

init();
