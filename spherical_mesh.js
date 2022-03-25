
export function createSphere(gl, radius, sliceCount, stackCount, color) {
	const phiStep = Math.PI / stackCount;
	const thetaStep = Math.PI / sliceCount;

	const height = Math.sqrt(1. - (radius * radius));

	var positions = [];
	var colors = [];
	var indices = [];
	var tex = [];

	var vertexCount = 0;

	// North Pole
	positions.push(0., radius, 0., 1);	//todo: заменить 1 на height
	colors.concat(color);
	console.log(colors);
	tex.push(0., 0.);
	vertexCount++;


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
			vertexCount++;
		}
	}


	// South Pole
	positions.push(0., -radius, 0., 1);	//todo: заменить 1 на height
	colors.concat(color);
	console.log(colors);
	tex.push(0., 1.);
	vertexCount++;

	// Indices
	const northPoleIndex = 0;
    for (var i = 1; i <= sliceCount; i++) {
        indices.push(northPoleIndex);
        indices.push(i + 1);
        indices.push(i);
    }

    var baseIndex = 1;
    const ringVertexCount = sliceCount + 1;
    for (var i = 0; i < stackCount - 2; i++) {
        for (var j = 0; j < sliceCount; j++) {
            indices.push(baseIndex + i * ringVertexCount + j);
            indices.push(baseIndex + i * ringVertexCount + j + 1);
            indices.push(baseIndex + (i + 1) * ringVertexCount + j);

            indices.push(baseIndex + (i + 1) * ringVertexCount + j);
            indices.push(baseIndex + i * ringVertexCount + j + 1);
            indices.push(baseIndex + (i + 1) * ringVertexCount + j + 1);
        }
    }

    const southPoleIndex = vertexCount++; - 1;
    baseIndex = southPoleIndex - ringVertexCount;
    for (var i = 0; i < sliceCount; i++) {
        indices.push_back(southPoleIndex);
        indices.push_back(baseIndex + i);
        indices.push_back(baseIndex + i + 1);
    }

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