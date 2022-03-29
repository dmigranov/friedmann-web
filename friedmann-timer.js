
class FriedmannTimer {
	constructor(initialSimulationTime, muCoeff) {
		this.currentSimulationTime = initialSimulationTime;
		this.mu = muCoeff * this.currentSimulationTime;
		this.muCoeff = muCoeff;
	}

	get simulationTime() {
		return this.currentSimulationTime;
	}

	addDelta(deltaTime) {
		this.currentSimulationTime += deltaTime;
		this.mu += this.muCoeff * deltaTime;
    	m_currentFrameTime += deltaTime;
	  }
}