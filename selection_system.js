export function raytraceSphereMouse(mouseX, mouseY, posView, spaceRadius, projMatrix) {
	const pos = posView; 
	var chi = Math.acos(pos.w / spaceRadius);
    if (pos.z < 0)
        chi = 2 * Math.PI - chi;
	

}