/* ==========================================================================
   Typography guide lines
   Defines typographic terms and maps them to body landmarks
   ========================================================================== */

export const TYPO_TERMS = [
    {
        id: 'ascender',
        name: 'Ascender Line',
        description: 'The highest point reached by lowercase letters like b, d, h, k, l.',
        color: '#E53935',
    },
    {
        id: 'cap-height',
        name: 'Cap Height',
        description: 'The height of a capital letter measured from the baseline.',
        color: '#FB8C00',
    },
    {
        id: 'x-height',
        name: 'x-Height',
        description: 'The height of the lowercase letter x — the core body of lowercase letters.',
        color: '#43A047',
    },
    {
        id: 'baseline',
        name: 'Baseline',
        description: 'The invisible line where letters sit. The foundation of all type.',
        color: '#1446FF',
    },
    {
        id: 'descender',
        name: 'Descender Line',
        description: 'The lowest point reached by letters like g, p, q, y.',
        color: '#8E24AA',
    },
];

/**
 * Derive guide-line Y positions from body keypoints.
 * Returns an object keyed by term id → Y pixel value, or null if
 * there aren't enough visible keypoints to compute lines.
 */
export function computeGuideLines(keypoints, canvasHeight) {
    if (!keypoints || keypoints.length === 0) return null;

    const kp = {};
    for (const point of keypoints) {
        if (point.confidence > 0.3) kp[point.name] = point;
    }

    // Need at minimum: nose, both shoulders, both hips
    if (!kp.nose || !kp.left_shoulder || !kp.right_shoulder ||
        !kp.left_hip || !kp.right_hip) {
        return null;
    }

    const noseY = kp.nose.y;
    const shoulderY = (kp.left_shoulder.y + kp.right_shoulder.y) / 2;
    const hipY = (kp.left_hip.y + kp.right_hip.y) / 2;

    // Estimate head top above nose
    const noseToShoulder = shoulderY - noseY;
    const headTopY = noseY - noseToShoulder * 0.6;
    const foreheadY = noseY - noseToShoulder * 0.3;

    // Use ankles if visible, otherwise estimate from body proportions
    let ankleY;
    if (kp.left_ankle && kp.right_ankle) {
        ankleY = (kp.left_ankle.y + kp.right_ankle.y) / 2;
    } else {
        ankleY = hipY + (hipY - noseY) * 1.2;
    }

    return {
        'ascender': headTopY,
        'cap-height': foreheadY,
        'x-height': shoulderY,
        'baseline': hipY,
        'descender': Math.min(ankleY, canvasHeight - 20),
    };
}

/**
 * Draw horizontal dashed guide lines with labels onto a canvas context.
 */
export function drawGuides(ctx, guideLines, canvasWidth) {
    if (!guideLines) return;

    ctx.save();
    for (const term of TYPO_TERMS) {
        const y = guideLines[term.id];
        if (y == null) continue;

        // Dashed line
        ctx.beginPath();
        ctx.strokeStyle = term.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 6]);
        ctx.moveTo(0, y);
        ctx.lineTo(canvasWidth, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label
        ctx.font = '600 12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = term.color;
        ctx.fillText(term.name, 12, y - 6);
    }
    ctx.restore();
}
