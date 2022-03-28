// js random ~ uniform distribution (Euclidean)

function getRandom(min, max) {
	return Math.random() * (max - min) + min;
}

const epsilon = 0.001;


export function generatePoint(spaceRadius) {
	const spaceRadiusSquare = spaceRadius * spaceRadius;

	var isPointGenerated = false;
	var x, y, z, w;
	var normSquare;
	while (!isPointGenerated) {
		x = getRandom(-spaceRadius, spaceRadius);
		y = getRandom(-spaceRadius, spaceRadius);
		z = getRandom(-spaceRadius, spaceRadius);
		w = getRandom(-spaceRadius, spaceRadius);

		normSquare = x * x + y * y + z * z + w * w;

		if (normSquare >= epsilon && normSquare <= spaceRadiusSquare) //not too close to zero and inside the sphere
			isPointGenerated = true;
	}

	const coeff = spaceRadius / Math.sqrt(normSquare);

	return vec4.fromValues(coeff * x, coeff * y, coeff * z, coeff * w);
}

export function generatePoints(spaceRadius, objectRadius, sphereCount) {
	for (var i = 0; i < sphereCount; i++) {
		const isPointGenerated = false;
		while (!isPointGenerated) {
			var point = generatePoint();
			
		}
	}
}
