/* ==========================================================================
   Stickman renderer
   Draws a skeleton figure from ml5.js bodyPose keypoints
   ========================================================================== */

const SKELETON = [
    // Torso
    ['left_shoulder', 'right_shoulder'],
    ['left_shoulder', 'left_hip'],
    ['right_shoulder', 'right_hip'],
    ['left_hip', 'right_hip'],
    // Left arm
    ['left_shoulder', 'left_elbow'],
    ['left_elbow', 'left_wrist'],
    // Right arm
    ['right_shoulder', 'right_elbow'],
    ['right_elbow', 'right_wrist'],
    // Left leg
    ['left_hip', 'left_knee'],
    ['left_knee', 'left_ankle'],
    // Right leg
    ['right_hip', 'right_knee'],
    ['right_knee', 'right_ankle'],
];

const MIN_CONFIDENCE = 0.3;
const BONE_COLOR = 'rgb(34, 34, 34)';
const JOINT_RADIUS = 5;
const BONE_WIDTH = 3;

/**
 * Draw a stickman skeleton on the given canvas context.
 * `keypoints` should already be scaled/mirrored to canvas coordinates.
 */
export function drawStickman(ctx, keypoints) {
    if (!keypoints || keypoints.length === 0) return;

    // Index keypoints by name for fast lookup
    const kp = {};
    for (const point of keypoints) {
        kp[point.name] = point;
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Bones
    ctx.strokeStyle = BONE_COLOR;
    ctx.lineWidth = BONE_WIDTH;

    for (const [nameA, nameB] of SKELETON) {
        const a = kp[nameA];
        const b = kp[nameB];
        if (!a || !b) continue;
        if (a.confidence < MIN_CONFIDENCE || b.confidence < MIN_CONFIDENCE) continue;

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    }

    // Joints
    ctx.fillStyle = BONE_COLOR;
    for (const point of keypoints) {
        if (point.confidence < MIN_CONFIDENCE) continue;
        ctx.beginPath();
        ctx.arc(point.x, point.y, JOINT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }

    // Head circle — sized from ear-to-ear distance or a fallback
    if (kp.nose && kp.nose.confidence >= MIN_CONFIDENCE) {
        let headRadius = 30;
        if (kp.left_ear && kp.right_ear &&
            kp.left_ear.confidence >= MIN_CONFIDENCE &&
            kp.right_ear.confidence >= MIN_CONFIDENCE) {
            headRadius = Math.abs(kp.left_ear.x - kp.right_ear.x) * 0.65;
        }

        ctx.beginPath();
        ctx.strokeStyle = BONE_COLOR;
        ctx.lineWidth = BONE_WIDTH;
        ctx.arc(kp.nose.x, kp.nose.y - headRadius * 0.3, headRadius, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}
