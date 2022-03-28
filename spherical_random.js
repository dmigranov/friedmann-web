// js random ~ uniform distribution (Euclidean)

function getRandom(min, max) {
	return Math.random() * (max - min) + min;
  }

export function generatePoint(spaceRadius) {
	var isPointGenerated = false;
    while (!isPointGenerated) {
		const x = getRandom(-spaceRadius, spaceRadius);
		const y = getRandom(-spaceRadius, spaceRadius);
		const z = getRandom(-spaceRadius, spaceRadius);
		const w = getRandom(-spaceRadius, spaceRadius);

		
	}
}
