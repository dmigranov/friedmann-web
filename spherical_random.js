// js random ~ uniform distribution (Euclidean)

import * as SphericalMath from './spherical_math.js';

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
	var points = [];

	points.push(vec4.fromValues(0, 0, 0, spaceRadius));		// !
	points.push(vec4.fromValues(0, 0, 0, -spaceRadius));	// !

	for (var i = 2; i < sphereCount + 2; i++) {
		var isPointGenerated = false;
		while (!isPointGenerated) {
			var point = generatePoint(spaceRadius);
			isPointGenerated = true;

			for (var j = 0; j < i; j++) {
				const otherPoint = points[j];
				const distance = SphericalMath.sphericalDistance(point, otherPoint, spaceRadius);

				if (distance < 2 * objectRadius) {
					isPointGenerated = false;
					break;
				}
			}
		}

		points.push(point);
	}
	points.shift();
	points.shift();

	return points;
}