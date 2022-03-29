
class FriedmannTimer {
	constructor(initialSimulationTime, muCoeff) {
		this.currentSimulationTime = initialSimulationTime;

		this.muCoeff = muCoeff;
	}

	get simulationTime() {
		return this.currentSimulationTime;
	}
}