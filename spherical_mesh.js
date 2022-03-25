
export function createSphere(gl, radius, sliceCount, stackCount, color) {
	const phiStep = Math.PI / stackCount;
	const thetaStep = Math.PI / sliceCount;

	const height = Math.sqrt(1. - (radius * radius));

	var positions = [];
	var colors = [];
	var indices = [];
	var tex = [];

	//todo

	// North Pole
	positions.push(0., radius, 0., 1);	//todo: заменить 1 на height
	colors.concat(color);
	console.log(colors);
	tex.push(0., 0.);


	for (var i = 1; i <= stackCount - 1; i++) {
		const phi = i * phiStep;
		for (var j = 0; j <= sliceCount; j++) {
			const theta = j * thetaStep;
            positions.push(
				(radius * Math.sin(phi) * Math.cos(theta)),
				(radius * Math.cos(phi)),
				(radius * Math.sin(phi) * Math.sin(theta)),
				1 //todo: заменить 1 на height
			);
			colors.concat(color); //проверить
            tex.push(theta / (2 * Math.PI), phi / Math.PI);
		}
	}


	// South Pole
	positions.push(0., -radius, 0., 1);	//todo: заменить 1 на height
	colors.concat(color);
	console.log(colors);
	tex.push(0., 1.);

	// Indices
	// todo

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