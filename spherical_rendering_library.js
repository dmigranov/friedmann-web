

var gl;
var scene;
var updaters;
var simulationTime;

const SphericalVisibilityEnum = {
	VISIBLE_NONE: 1,
	VISIBLE_FRONT: 2,
	VISIBLE_ALL: 3,
};

export function initializeEngine(canvas) {
    gl = canvas.getContext("webgl2");
    gl.enable(gl.CULL_FACE); // should it stay? TODO

    updaters = [];
    simulationTime = 0.;

    var sceneObjects = [];

    scene = {
		programInfo: programInfo,
		constants: {
			projectionMatrixFront: projectionMatrixFront,
			projectionMatrixBack: projectionMatrixBack,
			viewMatrixFront: viewMatrixFront,
		},
		sceneObjects: sceneObjects,
	};

}

function drawScene() {
    const programInfo = scene.programInfo;
    const constants = scene.constants;

    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell WebGL to use our program when drawing
    gl.useProgram(programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrixFront,
        false,
        constants.projectionMatrixFront);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrixBack,
        false,
        constants.projectionMatrixBack);
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.viewMatrixFront,
        false,
        constants.viewMatrixFront);
    //gl.uniform1f(programInfo.uniformLocations.mu, friedmannTimer.mu);
    gl.uniform1f(programInfo.uniformLocations.mu, simulationTime);

    const sceneObjects = scene.sceneObjects;
    for (const sceneObject of sceneObjects) {
        const worldMatrix = sceneObject.worldMatrix;
        const buffers = sceneObject.buffers;

        if (sceneObject.sphericalVisibility == SphericalVisibilityEnum.VISIBLE_NONE)
            continue;

        // Tell WebGL how to pull out the positions from the position buffer into the aVertexPosition attribute.
        // (we bind the square's vertex buffer to the attribute the shader is using for aVertexPosition )
        // Attributes receive values from buffers. Each iteration of the vertex shader receives the next value from the buffer assigned to that attribute
        {
            const numComponents = 4; // pull out 4 values per iteration (xyzw);
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexPosition,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexPosition);
        }

        // Tell WebGL how to pull out the colors from the color buffer
        // into the vertexColor attribute.
        {
            const numComponents = 4;
            const type = gl.FLOAT;
            const normalize = false;
            const stride = 0;
            const offset = 0;
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
            gl.vertexAttribPointer(
                programInfo.attribLocations.vertexColor,
                numComponents,
                type,
                normalize,
                stride,
                offset);
            gl.enableVertexAttribArray(
                programInfo.attribLocations.vertexColor);
        }

        // Tell WebGL which indices to use to index the vertices
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

        // Set the shader uniforms unique for every object
        gl.uniformMatrix4fv(
            programInfo.uniformLocations.worldMatrix,
            false,
            worldMatrix);

        //todo: selection
        gl.uniform1i(programInfo.uniformLocations.isSelected, 0);


        //DRAW!
        {
            const vertexCount = buffers.indexCount;
            const type = gl.UNSIGNED_SHORT;
            const offset = 0;
            if (sceneObject.sphericalVisibility == SphericalVisibilityEnum.VISIBLE_ALL)
                gl.drawElementsInstanced(gl.TRIANGLES, vertexCount, type, offset, 2); //type specifies the type of the values in the element (index) array buffer
            else
                gl.drawElementsInstanced(gl.TRIANGLES, vertexCount, type, offset, 1);
        }
    }
}

export function addObject() {   //todo: интерфейс
    
}

export function addUpdater(updater) {
    updaters.push(updater);
}

export function setTime(time) {
    simulationTime = time;
}


export function startGame() {
    var then = 0;
    function render(now) {
        now *= 0.001;  // convert to seconds
        const deltaTime = now - then;
        then = now;

        //updateScene(scene, deltaTime);
        //todo: call updaters

        for (const updater of updaters) {
            updater(deltaTime, scene);
        }

        drawScene();
        //updatePage(scene, deltaTime); // todo: тут же отрисовка графика

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}