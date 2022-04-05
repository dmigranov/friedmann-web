const PI_MUL_2 = 2 * Math.PI;

export class FriedmannTimer {
	constructor(initialSimulationTime, muCoeff) {
		this.initialSimulationTime = initialSimulationTime;
		this.currentSimulationTime = this.initialSimulationTime;
		this.mu = muCoeff * this.currentSimulationTime;
		this.muCoeff = muCoeff;
		this.currentFrameTime = 0.;
	}

	get simulationTime() {
		return this.currentSimulationTime;
	}

	get initialMu() {
		return this.initialSimulationTime * this.muCoeff;
	}

	addDelta(deltaTime) {
		this.currentSimulationTime += deltaTime;
		this.mu += this.muCoeff * deltaTime;

		if (this.mu < 0)
			this.mu = this.mu + PI_MUL_2;
		if (this.mu > PI_MUL_2)
			this.mu = this.mu - PI_MUL_2;

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