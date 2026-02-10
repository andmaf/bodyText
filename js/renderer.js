/**
 * renderer.js — Stickman drawing
 * Renders a skeleton figure from COCO-format keypoints.
 */

const SKELETON = [
    ['left_shoulder',  'right_shoulder'],
    ['left_shoulder',  'left_hip'],
    ['right_shoulder', 'right_hip'],
    ['left_hip',       'right_hip'],
    ['left_shoulder',  'left_elbow'],
    ['left_elbow',     'left_wrist'],
    ['right_shoulder', 'right_elbow'],
    ['right_elbow',    'right_wrist'],
    ['left_hip',       'left_knee'],
    ['left_knee',      'left_ankle'],
    ['right_hip',      'right_knee'],
    ['right_knee',     'right_ankle'],
];

const MIN_CONFIDENCE = 0.3;
const BONE_COLOR     = 'rgb(34, 34, 34)';
const JOINT_RADIUS   = 5;
const BONE_WIDTH     = 3;

/**
 * Draw a stickman on `ctx`.
 * Keypoints must already be scaled/mirrored to canvas coordinates.
 */
export function drawStickman(ctx, keypoints) {
    if (!keypoints?.length) return;

    const kp = {};
    for (const p of keypoints) kp[p.name] = p;

    ctx.save();
    ctx.lineCap  = 'round';
    ctx.lineJoin = 'round';

    // Bones
    ctx.strokeStyle = BONE_COLOR;
    ctx.lineWidth   = BONE_WIDTH;
    for (const [a, b] of SKELETON) {
        if (!kp[a] || !kp[b]) continue;
        if (kp[a].confidence < MIN_CONFIDENCE || kp[b].confidence < MIN_CONFIDENCE) continue;
        ctx.beginPath();
        ctx.moveTo(kp[a].x, kp[a].y);
        ctx.lineTo(kp[b].x, kp[b].y);
        ctx.stroke();
    }

    // Joints
    ctx.fillStyle = BONE_COLOR;
    for (const p of keypoints) {
        if (p.confidence < MIN_CONFIDENCE) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, JOINT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }

    // Head — sized from ear-to-ear distance
    if (kp.nose?.confidence >= MIN_CONFIDENCE) {
        let r = 30;
        if (kp.left_ear?.confidence >= MIN_CONFIDENCE &&
            kp.right_ear?.confidence >= MIN_CONFIDENCE) {
            r = Math.abs(kp.left_ear.x - kp.right_ear.x) * 0.65;
        }
        ctx.beginPath();
        ctx.strokeStyle = BONE_COLOR;
        ctx.lineWidth   = BONE_WIDTH;
        ctx.arc(kp.nose.x, kp.nose.y - r * 0.3, r, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}
