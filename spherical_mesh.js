
export function createSphere(gl, radius, sliceCount, stackCount, color) {
	const phiStep = Math.PI / stackCount;
	const thetaStep = Math.PI / sliceCount;

	const height = Math.sqrt(1. - (radius * radius)); //

	var positions = [];
	var colors = [];
	var indices = [];
	var tex = [];

	var vertexCount = 0;

	// North Pole
	positions.push(0., radius, 0., 1);	//todo: заменить 1 на height
	colors.push(color[0], color[1], color[2], color[3]);
	tex.push(0., 0.);
	vertexCount++;

	var i, j;
	for (i = 1; i <= stackCount - 1; i++) {
		const phi = i * phiStep;
		for (j = 0; j <= sliceCount; j++) {
			const theta = j * thetaStep;
            positions.push(
				(radius * Math.sin(phi) * Math.cos(theta)),
				(radius * Math.cos(phi)),
				(radius * Math.sin(phi) * Math.sin(theta)),
				1 //todo: заменить 1 на height
			);
			colors.push(color[0], color[1], color[2], color[3]);
            tex.push(theta / (2 * Math.PI), phi / Math.PI);
			vertexCount++;
		}
	}


	// South Pole
	positions.push(0., -radius, 0., 1);	//todo: заменить 1 на height
	colors.push(color[0], color[1], color[2], color[3]);
	tex.push(0., 1.);
	vertexCount++;


	// Indices
	var baseIndex = 1;
	const ringVertexCount = sliceCount + 1;

/*
	const northPoleIndex = 0;
    for (i = 1; i <= sliceCount; i++) {
        indices.push(northPoleIndex);
        indices.push(i + 1);
        indices.push(i);
    }
*/
    
    for (i = 0; i < stackCount - 2; i++) {
        for (j = 0; j < sliceCount; j++) {
            indices.push(baseIndex + i * ringVertexCount + j);
            indices.push(baseIndex + i * ringVertexCount + j + 1);
            indices.push(baseIndex + (i + 1) * ringVertexCount + j);

            indices.push(baseIndex + (i + 1) * ringVertexCount + j);
            indices.push(baseIndex + i * ringVertexCount + j + 1);
            indices.push(baseIndex + (i + 1) * ringVertexCount + j + 1);
        }
    }
/*
    const southPoleIndex = vertexCount - 1;
    baseIndex = southPoleIndex - ringVertexCount;
    for (i = 0; i < sliceCount; i++) {
        indices.push(southPoleIndex);
        indices.push(baseIndex + i);
        indices.push(baseIndex + i + 1);
    }
*/
	console.log(indices);

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