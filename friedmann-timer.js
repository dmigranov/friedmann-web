
class FriedmannTimer {
	constructor(initialSimulationTime, muCoeff) {
		this.currentSimulationTime = initialSimulationTime;
		this.mu = muCoeff * this.currentSimulationTime;
		this.muCoeff = muCoeff;
		this.currentFrameTime = 0.;
	}

	get simulationTime() {
		return this.currentSimulationTime;
	}

	addDelta(deltaTime) {
		this.currentSimulationTime += deltaTime;
		this.mu += this.muCoeff * deltaTime;
		this.currentFrameTime += deltaTime;
	}

	get isTimeToRepaint() {
		if (this.currentFrameTime >= this.frameUpdateTimeLimit || this.currentFrameTime <= -this.frameUpdateTimeLimit) {
			this.currentFrameTime = 0;
			return true;
		}
		return false;
	}
}