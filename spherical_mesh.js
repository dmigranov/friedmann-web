
export function createSphere(gl) {
	var positions = [];
	var colors = [];
	var indices = [];


	const positionBuffer = gl.createBuffer(); 
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	
}