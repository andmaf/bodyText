/* ==========================================================================
   Pose detection wrapper around ml5.js bodyPose (MoveNet)
   ========================================================================== */

export class PoseDetector {
    constructor() {
        this.detector = null;
        this.poses = [];
        this.ready = false;
    }

    /**
     * Load the MoveNet model and begin continuous detection on the
     * given <video> element. Resolves once the model is ready.
     */
    async init(video) {
        this.detector = await ml5.bodyPose('MoveNet');
        this.ready = true;
        this.detector.detectStart(video, (results) => {
            this.poses = results;
        });
    }

    /** Return the first detected pose, or null. */
    getPose() {
        return this.poses.length > 0 ? this.poses[0] : null;
    }

    /** Return keypoints array of the first detected pose, or null. */
    getKeypoints() {
        const pose = this.getPose();
        return pose ? pose.keypoints : null;
    }
}
