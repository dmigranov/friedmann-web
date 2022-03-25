
export function createSphere(gl, radius, sliceCount, stackCount, color) {
	const phiStep = Math.PI / stackCount;
	const thetaStep = Math.PI / sliceCount;

	const height = Math.sqrt(1. - (radius * radius));

	var positions = [];
	var colors = [];
	var indices = [];

	//todo

	// North Pole
	positions.push(0., radius, 0., 1);	//todo: заменить 1 на height
	colors.concat(color);	
	console.log(colors);


	// South Pole
	positions.push(0., -radius, 0., 1);	//todo: заменить 1 на height
	colors.concat(color);	
	console.log(colors);

	const positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

	const colorBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

	const indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, //! for indices we use this
		new Uint16Array(indices), gl.STATIC_DRAW);

	return {
		position: positionBuffer,
		color: colorBuffer,
		indices: indexBuffer,
	};
}