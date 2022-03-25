
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
            XMFLOAT4 pos(
				(radius * sinf(phi) * cosf(theta)),
				(radius * cosf(phi)),
				(radius * sinf(phi) * sinf(theta)),
				height
			);

            const uv = XMFLOAT2(theta / XM_2PI, phi / XM_PI);
			vertices.push_back({
				pos,
				//pos,       //так как это сфера! нормализовывать не нужно, так как и так радиус пространства 1 (но если сферическое пространство произвольного радиуса, то нужно)
				uv
			});

		}
	}


	// South Pole
	positions.push(0., -radius, 0., 1);	//todo: заменить 1 на height
	colors.concat(color);
	console.log(colors);
	tex.push(0., 1.);

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