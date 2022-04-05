//pos[3] = pos.w
//pos[2] = pos.z

export function raytraceSphereMouse(mouseX, mouseY, posView, spaceRadius, projMatrix, radiusFunction, mu) {
	const pos = posView; 
	var chi = Math.acos(pos[3] / spaceRadius); //вроде считает
    if (pos[2] < 0)
        chi = 2 * Math.PI - chi;
	const muOriginal = mu - chi;

	var r_sphere, w_sphere;

	//todo

	const leftReferenceVector = vec4.fromValues(-r_sphere, 0, 0, w_sphere);
	const rightReferenceVector = vec4.fromValues(r_sphere, 0, 0, w_sphere);

	//todo


	return 0; //todo
}