// js random ~ uniform distribution (Euclidean)

function getRandom(min, max) {
	return Math.random() * (max - min) + min;
  }

const epsilon = 0.001;


export function generatePoint(spaceRadius) {
	const spaceRadiusSquare = spaceRadius * spaceRadius;

	var isPointGenerated = false;
    while (!isPointGenerated) {
		const x = getRandom(-spaceRadius, spaceRadius);
		const y = getRandom(-spaceRadius, spaceRadius);
		const z = getRandom(-spaceRadius, spaceRadius);
		const w = getRandom(-spaceRadius, spaceRadius);

		const normSquare = x * x + y * y + z * z + w * w;

		if (normSquare >= epsilon && normSquare <= spaceRadiusSquare) //not too close to zero and inside the sphere
			isPointGenerated  = true;
	}

	const coeff = spaceRadius / Math.sqrt(normSquare);

	return coeff * DirectX::SimpleMath::Vector4(x, y, z, w);
}

export function generatePoints(spaceRadius, objectRadius, count) {

}
