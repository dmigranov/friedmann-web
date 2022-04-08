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

	const lrvChanged = Vector4::Transform(leftReferenceVector, SphericalRotationZW(sphCoord.x));
	vec4.transformMat4();
    auto rrvChanged = Vector4::Transform(rightReferenceVector, SphericalRotationZW(sphCoord.x));
	vec4.transformMat4();
	/*
    auto lrvProjected = Vector4::Transform(lrvChanged, proj);
    auto rrvProjected = Vector4::Transform(rrvChanged, proj);
    if (lrvProjected.w == 0 || rrvProjected.w == 0)
        return -1;
    */
	//todo


	return 0; //todo
}