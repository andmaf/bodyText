/**
 * pose.js — Pose detection via TensorFlow.js MoveNet Lightning
 * Runs a continuous estimatePoses() loop and exposes the latest keypoints.
 */

export class PoseDetector {
    constructor() {
        this.detector = null;
        this.poses    = [];
        this.ready    = false;
        this.backend  = null;
        this._video   = null;
        this._running = false;
    }

    /**
     * Load MoveNet Lightning and start detecting on the given <video>.
     * Tries WebGPU first, falls back to WebGL.
     */
    async init(video) {
        this._video = video;

        try {
            await tf.setBackend('webgpu');
            await tf.ready();
            this.backend = 'webgpu';
        } catch {
            await tf.setBackend('webgl');
            await tf.ready();
            this.backend = 'webgl';
        }
        console.log(`[pose] TF.js backend: ${this.backend}`);

        this.detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING },
        );

        this.ready    = true;
        this._running = true;
        this._detectLoop();
    }

    /** Continuous detection loop — one estimatePoses() per animation frame. */
    async _detectLoop() {
        while (this._running) {
            if (this._video.readyState >= 2) {
                try {
                    this.poses = await this.detector.estimatePoses(this._video);
                } catch {
                    // skip frame on transient errors
                }
            }
            await new Promise((r) => requestAnimationFrame(r));
        }
    }

    /** First detected pose, or null. */
    getPose() {
        return this.poses[0] ?? null;
    }

    /**
     * Keypoints of the first pose, or null.
     * Maps TF.js `score` to `confidence` for downstream compatibility.
     */
    getKeypoints() {
        const pose = this.getPose();
        if (!pose) return null;
        return pose.keypoints.map((kp) => ({ ...kp, confidence: kp.score }));
    }

    /** Stop the detection loop. */
    stop() {
        this._running = false;
    }
}
