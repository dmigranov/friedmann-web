
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
		m_currentSimulationTime += deltaTime;
    m_currentFrameTime += deltaTime;
    m_mu += m_muCoeff * deltaTime;
	  }
}