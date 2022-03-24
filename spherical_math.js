// !!!MATH!!!

//todo: учесть разницу между API
/* 
function bananaProjectionMatrixFrontHalf(fovY, aspect, z0)
{
  const height = 1 / Math.tan(fovY / 2);
  const width = height / aspect;
  return Matrix(
    width, 0., 0., 0.,
    0., height, 0., 0.,
    0., 0., 0.25, 1.,
    0., 0., -z0 / 4., 0);
}
*/

// rotation around plane XY which stays invariant
export function sphericalRotationZW(d) {
    return mat4.fromValues(
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, Math.cos(d), -Math.sin(d),
        0, 0, Math.sin(d), Math.cos(d));
}

export function sphericalRotationXW(d) {
    return mat4.fromValues(
        Math.cos(d), 0, 0, -Math.sin(d),
        0, 1, 0, 0,
        0, 0, 1, 0,
        Math.sin(d), 0, 0, Math.cos(d));
}

export function sphericalRotationYW(d) {
    return mat4.fromValues(
        1, 0, 0, 0,
        0, Math.cos(d), 0, -Math.sin(d),
        0, 0, 1, 0,
        0, Math.sin(d), 0, Math.cos(d));
}

export function sphericalRotationYZ(d) {
    return mat4.fromValues(
        1, 0, 0, 0,
        0, Math.cos(d), -Math.sin(d), 0,
        0, Math.sin(d), Math.cos(d), 0,
        0, 0, 0, 1);
}

export function sphericalRotationXZ(d) {
    return mat4.fromValues(
        Math.cos(d), 0, -Math.sin(d), 0,
        0, 1, 0, 0,
        Math.sin(d), 0, Math.cos(d), 0,
        0, 0, 0, 1);
}

export function sphericalRotationXY(d) {
    return mat4.fromValues(
        Math.cos(d), -Math.sin(d), 0, 0,
        Math.sin(d), Math.cos(d), 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1);
}

export function sphericalDistance(vector1, vector2, radius) {
    const chordLength = vec4.distance(vector1, vector2);
    return 2 * radius * Math.asin(chordLength / (2. * radius)); // angle is 2arcsin(L/2R), length of arc equals angle * R
}

export function sphericalDistanceDirectional(vector1, vector2, radius, isAhead) {
    const dist = sphericalDistance(vector1, vector2, radius);
    if (isAhead)
        return dist;
    else
        return 2 * Math.PI - dist;
}

//xyzw; returns: close to "z", "x", "y"
export function getSphericalFromCartesian(vector)
{
    const x4 = vector[0];
    const x3 = vector[1];
    const x2 = vector[2];
    const x1 = vector[3];

	const x42 = x4 * x4;
	const x22 = x2 * x2;
	const x32 = x3 * x3;

	const a1 = Math.acos(x1);
	if (x2 == 0 && x3 == 0 && x4 == 0)
		if (x1 > 0)
			return vec3.fromValues(a1, 0, 0);
		else
			return vec3.fromValues(a1, Math.PI, Math.PI);

	const a2 = Math.acos(x2 / Math.sqrt(x22 + x32 + x42));
	if (x3 == 0 && x4 == 0)
		if (x2 > 0)
			return vec3.fromValues(a1, a2, 0);
		else
			return vec3.fromValues(a1, a2, Math.PI);

	var a3;
	if (x4 >= 0)
		a3 = Math.acos(x3 / Math.sqrt(x32 + x42));
	else
		a3 = 2 * Math.PI - Math.acos(x3 / Math.sqrt(x32 + x42));

	return vec3.fromValues(a1, a2, a3);
}
