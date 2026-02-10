/**
 * app.js — Main orchestrator
 * Wires camera, pose detection, stickman rendering, and typography guides
 * into a three-panel requestAnimationFrame loop.
 */

import { PoseDetector } from './pose.js';
import { drawStickman } from './renderer.js';
import { GuideLineEditor } from './guides.js';

/* ── DOM refs ──────────────────────────────────────────────────────────── */

const videoEl    = document.getElementById('video');
const canvasEl   = document.getElementById('canvas');
const skeletonEl = document.getElementById('canvas-skeleton');
const letterEl   = document.getElementById('canvas-letter');
const statusEl   = document.getElementById('status');
const btnGuides  = document.getElementById('btn-toggle-guides');
const btnVideo   = document.getElementById('btn-toggle-video');
const ratioBtns  = document.querySelectorAll('.ratio-btn');

/* ── State ─────────────────────────────────────────────────────────────── */

let showGuides  = true;
let showVideo   = true;
let detector    = null;
let ctx         = null;
let skeletonCtx = null;
let letterCtx   = null;
let guideEditor = null;

// Cover-crop source region (recalculated each frame)
let sx = 0, sy = 0, srcW = 0, srcH = 0;

/* ── Camera ────────────────────────────────────────────────────────────── */

async function initCamera() {
    statusEl.textContent = 'Requesting camera…';
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
    });
    videoEl.srcObject = stream;
    return new Promise((resolve) => {
        videoEl.onloadedmetadata = () => {
            videoEl.width  = videoEl.videoWidth;
            videoEl.height = videoEl.videoHeight;
            videoEl.play();
            resolve();
        };
    });
}

/* ── Canvas sizing ─────────────────────────────────────────────────────── */

/** Sync each canvas drawing-buffer to its CSS display size. */
function syncCanvasBuffers() {
    for (const el of [canvasEl, skeletonEl, letterEl]) {
        el.width  = el.clientWidth;
        el.height = el.clientHeight;
    }
}

/** Update the --glyph-ratio token and re-sync buffers. */
function setRatio(value) {
    document.documentElement.style.setProperty('--glyph-ratio', value.replace('/', ' / '));
    ratioBtns.forEach((btn) => btn.classList.toggle('active', btn.dataset.ratio === value));
    requestAnimationFrame(syncCanvasBuffers);
}

function setupCanvas() {
    syncCanvasBuffers();
    window.addEventListener('resize', syncCanvasBuffers);
    ratioBtns.forEach((btn) => btn.addEventListener('click', () => setRatio(btn.dataset.ratio)));
    ctx         = canvasEl.getContext('2d');
    skeletonCtx = skeletonEl.getContext('2d');
    letterCtx   = letterEl.getContext('2d');
    guideEditor = new GuideLineEditor(letterEl);
}

/* ── Cover-crop ────────────────────────────────────────────────────────── */
/**
 * Calculate a cover-crop rectangle so the video fills the canvas
 * without letterboxing. Writes to module-level sx/sy/srcW/srcH.
 */
function computeCrop(canvasW, canvasH, videoW, videoH) {
    const canvasAspect = canvasW / canvasH;
    const videoAspect  = videoW / videoH;

    if (canvasAspect > videoAspect) {
        srcW = videoW;
        srcH = videoW / canvasAspect;
        sx   = 0;
        sy   = (videoH - srcH) / 2;
    } else {
        srcH = videoH;
        srcW = videoH * canvasAspect;
        sx   = (videoW - srcW) / 2;
        sy   = 0;
    }
}

/* ── Render loop ───────────────────────────────────────────────────────── */

function render() {
    const w  = canvasEl.width;
    const h  = canvasEl.height;
    const gw = skeletonEl.width;
    const gh = skeletonEl.height;
    const lw = letterEl.width;
    const lh = letterEl.height;

    ctx.clearRect(0, 0, w, h);
    skeletonCtx.clearRect(0, 0, gw, gh);
    letterCtx.clearRect(0, 0, lw, lh);

    const videoW = videoEl.videoWidth;
    const videoH = videoEl.videoHeight;
    if (videoW && videoH) computeCrop(w, h, videoW, videoH);

    // Camera panel — mirrored webcam
    if (showVideo) {
        ctx.save();
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoEl, sx, sy, srcW, srcH, 0, 0, w, h);
        ctx.restore();
    } else {
        ctx.fillStyle = '#fefefe';
        ctx.fillRect(0, 0, w, h);
    }

    // Skeleton panel — stickman from scaled keypoints
    const keypoints = detector.getKeypoints();
    if (keypoints && srcW > 0 && srcH > 0) {
        const scaled = keypoints.map((kp) => ({
            ...kp,
            x: (w - ((kp.x - sx) * (w / srcW))) * (gw / w),
            y: ((kp.y - sy) * (h / srcH)) * (gh / h),
        }));
        drawStickman(skeletonCtx, scaled);
    }

    // Letter panel — typography guide lines
    if (showGuides) {
        guideEditor.draw();
    } else {
        guideEditor.hideLabels();
    }

    requestAnimationFrame(render);
}

/* ── Controls ──────────────────────────────────────────────────────────── */

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

/* ── Boot ──────────────────────────────────────────────────────────────── */

async function init() {
    try {
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
