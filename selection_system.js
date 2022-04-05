// mouseX = (double)ms.x / width * 2. - 1.;
// mouseY = -((double)ms.y / height * 2. - 1);

export function raytraceSphereMouse(mouseX, mouseY, posWorld, spaceRadius, viewMatrix, projMatrix) {
	var pos = vec4.create(); // = pos_view
	vec4.transformMat4(pos, posWorld, viewMatrix);
	var chi = Math.acos(pos.w / spaceRadius);
    if (pos.z < 0)
        chi = 2 * Math.PI - chi;
	

}