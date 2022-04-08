import * as SphericalMath from './spherical_math.js';

//pos[3] = pos.w
//pos[2] = pos.z

export function raytraceSphereMouse(mouseX, mouseY, posView, spaceRadius, initialObjectRadius, projMatrix, radiusFunction, mu) {
	const pos = posView;
	var chi = Math.acos(pos[3] / spaceRadius); //вроде считает
	if (pos[2] < 0)
		chi = 2 * Math.PI - chi;
	const muOriginal = mu - chi;
	const effectiveRadius = radiusFunction(muOriginal);

	var r_sphere, w_sphere;
	w_sphere = effectiveRadius - 2 * effectiveRadius * Math.pow(Math.sin(initialObjectRadius / effectiveRadius / 2), 2);
	r_sphere = Math.sqrt(effectiveRadius * effectiveRadius - w_sphere * w_sphere);

	const leftReferenceVector = vec4.fromValues(-r_sphere, 0, 0, w_sphere);
	const rightReferenceVector = vec4.fromValues(r_sphere, 0, 0, w_sphere);

	// no need to normalize pos - it's already given for the unit radius
	const sphCoord = SphericalMath.getSphericalFromCartesian(pos);

	const lrvChanged = vec4.create();
	vec4.transformMat4(lrvChanged, leftReferenceVector, SphericalMath.sphericalRotationZW(sphCoord.x));
	const rrvChanged = vec4.create();
	vec4.transformMat4(rrvChanged, rightReferenceVector, SphericalMath.sphericalRotationZW(sphCoord.x));

	const lrvProjected = vec4.create();
	vec4.transformMat4(lrvProjected, lrvChanged, projMatrix);
	const rrvProjected = vec4.create();
	vec4.transformMat4(rrvProjected, rrvChanged, projMatrix);


	if (lrvProjected[3] == 0 || rrvProjected[3] == 0)
		return -10;

	vec4.scale(lrvProjected, lrvProjected, 1 / lrvProjected[3]);
	vec4.scale(rrvProjected, rrvProjected, 1 / rrvProjected[3]);

	const dist = (rrvProjected[0] - lrvProjected[0]) / 2;
	const distSq = dist * dist;
	console.log(distSq);

	const posProj_4D = vec4.create();
	vec4.transformMat4(posProj_4D, pos, projMatrix);
	const posProj_w = posProj_4D[3]

	if (posProj_4D[3] == 0)
		return -10;
	const posProj = vec3.fromValues(posProj_4D[0] / posProj_w, posProj_4D[1] / posProj_w, posProj_4D[2] / posProj_w);

	const distFromCursorToCenterSq = Math.pow(posProj[0] - mouseX, 2) + Math.pow(posProj[1] - mouseY, 2);
	if (distFromCursorToCenterSq > distSq)
		return -10;

	//console.log(posProj[2]);
	if (pos[2] < 0)
		return posProj[2] + 1;	// !
	return posProj[2]; 
}