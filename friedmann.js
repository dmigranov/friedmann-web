// drawElements = indexed, drawArrays = non-indexed
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSRequestNotHttp

import * as SphericalMath from './spherical_math.js';
import * as SphericalMesh from './spherical_mesh.js';
import * as SphericalRandom from './spherical_random.js';
import * as Shader from './shader_loading.js';
import { FriedmannTimer } from './friedmann_timer.js';


// Obtain a reference to the canvas
const canvas = document.querySelector("#glCanvas");

const coordinates = document.getElementById("coordinates");
const output1 = document.getElementById("output1");
const output2 = document.getElementById("output2");
const muOutput = document.getElementById("muOutput");

const initialMuCoeff = 1. / 3.;
const initialSimulationTime = 8. / (9. * initialMuCoeff);
const friedmannTimer = new FriedmannTimer(initialSimulationTime, initialMuCoeff);

// Initialize the GL context
const gl = canvas.getContext("webgl2");

// Only continue if WebGL is available and working
if (gl === null)
	alert("Unable to initialize WebGL. Your browser or machine may not support it.");
else
	main()

function main() {
	//gl.enable(gl.CULL_FACE); // should it stay? TODO
	//todo: выключать culling если внутри объекта, и включать, если в антиподальной точке 
	//или просто залить изнутри объекты черным?

	// Initialize user input handling
	document.addEventListener('keydown', keyDownHandler);
	document.addEventListener('keyup', keyUpHandler);

	document.addEventListener('mousemove', mouseMoveHandler);
	document.addEventListener('mousedown', mouseDownHandler);
	document.addEventListener('mouseup', mouseUpHandler);
	document.addEventListener('click', leftMouseClickHandler);
	document.addEventListener('contextmenu', rightMouseClickHandler);

	// Do one-time initialization of graphics resources
	var scene = initScene(gl);

	var then = 0;
	function render(now) {
		now *= 0.001;  // convert to seconds
		const deltaTime = now - then;
		then = now;

		updateScene(scene, deltaTime);
		drawScene(gl, scene, deltaTime);
		updatePage(scene, deltaTime); // todo: тут же отрисовка графика

		requestAnimationFrame(render);
	}
	requestAnimationFrame(render);
}


const mouseCoeff = 25.;
const pitchLimit = Math.PI / 2.0 - 0.01

var cameraRotationX = 0.;
var cameraRotationY = 0.;

var oldMouseX = -1;
var oldMouseY = -1;
var mouseChangeX = 0;
var mouseChangeY = 0;

var isCursorInsideCanvas = false;

function updateScene(scene, deltaTime) {
	friedmannTimer.addDelta(deltaTime);

	if (mouseX >= 0 && mouseY >= 0 && mouseX <= canvas.clientWidth && mouseY <= canvas.clientHeight)
		isCursorInsideCanvas = true;
	else
		isCursorInsideCanvas = false;


	if (leftMouseButtonPressed && isCursorInsideCanvas) {
		if (oldMouseX != -1 && oldMouseY != -1) {
			mouseChangeX = mouseX - oldMouseX;
			mouseChangeY = mouseY - oldMouseY;
		}

		oldMouseX = mouseX;
		oldMouseY = mouseY;
	}
	else {
		oldMouseX = -1;
		oldMouseY = -1;
		mouseChangeX = 0;
		mouseChangeY = 0;
	}

	const constants = scene.constants;

	// OPTION 1
	// const worldMatrix = mat4.create();
	// ... (probably you'll need to know the total time)
	// constants.worldMatrix = worldMatrix;

	// OPTION 2
	// const worldMatrix = constants.worldMatrix;
	// just modify it!

	{ //that's option 1
		const viewMatrix = mat4.create();

		cameraRotationX += mouseChangeX / mouseCoeff;
		cameraRotationY += mouseChangeY / mouseCoeff;

		cameraRotationY = Math.max(-pitchLimit, cameraRotationY);
		cameraRotationY = Math.min(+pitchLimit, cameraRotationY);

		if (cameraRotationX > Math.PI)
			cameraRotationX -= 2 * Math.PI;
		else if (cameraRotationX < -Math.PI)
			cameraRotationX += 2 * Math.PI;

		mat4.rotate(viewMatrix, viewMatrix, cameraRotationY, [1, 0, 0]);
		mat4.rotate(viewMatrix, viewMatrix, cameraRotationX, [0, 1, 0]);

		constants.viewMatrixFront = viewMatrix;
	}

	{	//that's option 2
		const sceneObject = scene.sceneObjects[0];
		const worldMatrix = sceneObject.worldMatrix;

		var relativeZMovement = 0.;
		if (wPressed)
			relativeZMovement -= deltaTime;
		if (sPressed)
			relativeZMovement += deltaTime;

		mat4.multiply(worldMatrix, SphericalMath.sphericalRotationZW(relativeZMovement), worldMatrix); 		//те, что сначала, применяются справа!
	}
}


function drawScene(gl, scene, deltaTime) {
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
	gl.uniform1f(programInfo.uniformLocations.mu, friedmannTimer.currentSimulationTime);

	const sceneObjects = scene.sceneObjects;
	for (const sceneObject of sceneObjects) {
		const worldMatrix = sceneObject.worldMatrix;
		const buffers = sceneObject.buffers;

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

		//DRAW!
		{
			const vertexCount = buffers.indexCount;
			const type = gl.UNSIGNED_SHORT;
			const offset = 0;
			//gl.drawElements(gl.TRIANGLES, vertexCount, type, offset); 
			gl.drawElementsInstanced(gl.TRIANGLES, vertexCount, type, offset, 2); //type specifies the type of the values in the element (index) array buffer
		}
	}
}


function updatePage(scene, deltaTime) {
	const proj = scene.constants.projectionMatrixFront;
	const projSph = SphericalMath.bananaProjectionMatrixBackHalf(45 * Math.PI / 180,
		gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1);

	if (isCursorInsideCanvas)
		coordinates.innerHTML = "Mouse:  <br />" + " x: " + mouseX + ", y: " + mouseY;
	else
		coordinates.innerHTML = "Mouse outside!";

	if (leftMouseButtonPressed) {
		if (isCursorInsideCanvas)
			output2.innerHTML = "dx: " + mouseChangeX + ", dy: " + mouseChangeY;
		else
			output2.innerHTML = "Mouse down!";
	}
	else
		output2.innerHTML = "Mouse up!";

	output1.innerHTML = cameraRotationX;

	const transformed = vec4.fromValues(0, 0, 0, 1);
	//vec4.transformMat4(transformed, transformed, SphericalMath.sphericalRotationYW(0.1))
	vec4.transformMat4(transformed, transformed, SphericalMath.absolutePositionMatrix(0.6, 0, 0, 0.8))
	//const dist = SphericalMath.sphericalDistance(transformed, vec4.fromValues(0, 0, 0, 1), 1);
	//const sphCoords = SphericalMath.getSphericalFromCartesian(transformed);

	muOutput.innerHTML = "Mu: " + friedmannTimer.mu.toFixed(3);
}


function initScene(gl) {
	// Vertex shader
	const vsSource = `#version 300 es

	float SphericalDistance(vec4 vector1, vec4 vector2, float radius)
	{
		float chordLength = distance(vector1, vector2); //chord length
		return 2.f * radius * asin(chordLength / (2.f * radius)); //angle is 2arcsin(L/2R), length of arc equals angle * R
	}

	float RadiusFunction(float mu) 
	{ 
		return 2.f * (1.f - cos(mu)); 
	}

	float RadiusAbridgedFunction(float mu) //сначала попытаемся для обычного радиуса
	{
		float startRadius = 0.14f;
		float multiplier = 2.f - startRadius / 2.;
		return startRadius + multiplier * (1. - cos(mu));
	}
  
	in vec4 aVertexPosition; // webgl: in instead of attribute
	in vec4 aVertexColor;

	uniform mat4 uWorldMatrix;
  
	uniform mat4 uViewMatrixFront;
	uniform mediump float uMu;
  
	uniform mat4 uProjectionMatrixFront;
	uniform mat4 uProjectionMatrixBack;

	out mediump vec4 vColor; //out = webgl 1.0 varying; used for interpolated data between a vertex shader and a fragment shader
	out mediump float vFogFactor;

	void main() {
		mat4 viewMatrix, projectionMatrix;
		if (gl_InstanceID == 0)
		{
			viewMatrix = uViewMatrixFront;
			projectionMatrix = uProjectionMatrixFront;
		}
		else
		{
			viewMatrix = -uViewMatrixFront;
			projectionMatrix = uProjectionMatrixBack;
		}

		
		vec4 position = aVertexPosition; //todo: correction
		float radius = 1.f;

		mat4 viewWorldMatrix = viewMatrix * uWorldMatrix;
		vec4 cameraSpacePosition = viewWorldMatrix * position;

		float density = 0.3f;	//!

		float distance = SphericalDistance(vec4(0, 0, 0, radius), cameraSpacePosition, radius);
		if (gl_InstanceID == 1)
			distance += 3.14159265 * radius;

		gl_Position = projectionMatrix * cameraSpacePosition;
		vColor = aVertexColor; 
		vFogFactor = clamp(exp(-density * distance), 0.0, 1.0);
	}`;

	// Fragment shader
	const fsSource = `#version 300 es

	#define PI 3.14159265
	#define C 299792458

	precision mediump float;
	in mediump vec4 vColor;
	in mediump float vFogFactor;

	out vec4 fragColor;

	void main() {
		//todo: modify


		vec4 retColor = vFogFactor * vColor + (1.0 - vFogFactor) * vec4(0., 0., 0., 1.);
		
		fragColor = retColor;
	}`;

	// Initialize a shader program; this is where all the lighting
	const shaderProgram = Shader.initShaderProgram(gl, vsSource, fsSource);

	// Collect all the info needed to use the shader program.
	// Look up which attribute our shader program is using for aVertexPosition 
	// and look up uniform locations (Uniforms stay the same value for all iterations of a shader)
	const programInfo = {
		program: shaderProgram,
		attribLocations: {
			vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
			vertexColor: gl.getAttribLocation(shaderProgram, 'aVertexColor'),
		},
		uniformLocations: {
			projectionMatrixFront: gl.getUniformLocation(shaderProgram, 'uProjectionMatrixFront'),
			projectionMatrixBack: gl.getUniformLocation(shaderProgram, 'uProjectionMatrixBack'),
			viewMatrixFront: gl.getUniformLocation(shaderProgram, 'uViewMatrixFront'),
			worldMatrix: gl.getUniformLocation(shaderProgram, 'uWorldMatrix'),
			mu: gl.getUniformLocation(shaderProgram, 'uMu'),
		},
	};

	// Here's where we call the routine that builds all the objects we'll be drawing.
	const buffers1 = SphericalMesh.createSphere(gl, 0.1, 15, 15, [0., 1., 0., 1.]);
	const buffers2 = SphericalMesh.createSphere(gl, 0.1, 15, 15, [1., 0., 0., 1.]);

	const points = SphericalRandom.generatePoints(1, 0.1, 100);
	const worldMatrices = points.map((point) => SphericalMath.absolutePositionMatrix(point[0], point[1], point[2], point[3]));
	var sceneObjects = worldMatrices.map((worldMatrix) => {
		return {
			worldMatrix: worldMatrix,
			buffers: (Math.random() < 0.5 ? buffers1 : buffers2)
		}
	});

	//sceneObjects = [ { worldMatrix: SphericalMath.sphericalRotationZW(0.2), buffers: buffers1 }	];

	const viewMatrixFront = mat4.create();

	const projectionMatrixFront = SphericalMath.bananaProjectionMatrixFrontHalf(45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1);;
	const projectionMatrixBack = SphericalMath.bananaProjectionMatrixBackHalf(45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1);;

	const scene = {
		programInfo: programInfo,
		constants: {
			projectionMatrixFront: projectionMatrixFront,
			projectionMatrixBack: projectionMatrixBack,
			viewMatrixFront: viewMatrixFront,
		},
		sceneObjects: sceneObjects,
	};

	return scene;
}

// CONTROLS
// https://github.com/end3r/JavaScript-Game-Controls/

var rightPressed = false;
var leftPressed = false;
var upPressed = false;
var downPressed = false;
var dPressed = false;
var aPressed = false;
var wPressed = false;
var sPressed = false;
var backspacePressed = false;

function keyDownHandler(event) {
	if ("code" in event) {
		switch (event.code) {
			case "Unidentified":
				break;
			case "ArrowRight":
			case "Right":
				rightPressed = true;
				return;
			case "ArrowLeft":
			case "Left":
				leftPressed = true;
				return;
			case "ArrowUp":
			case "Up":
				upPressed = true;
				return;
			case "ArrowDown":
			case "Down":
				downPressed = true;
				return;
			case "KeyD":
				dPressed = true;
				return;
			case "KeyA":
				aPressed = true;
				return;
			case "KeyW":
				wPressed = true;
				return;
			case "KeyS":
				sPressed = true;
				return;
			case "Backspace":
				backspacePressed = true;
				break;
			default:
				return;
		}
	}
}


function keyUpHandler(event) {
	if ("code" in event) {
		switch (event.code) {
			case "Unidentified":
				break;
			case "ArrowRight":
			case "Right":
				rightPressed = false;
				return;
			case "ArrowLeft":
			case "Left":
				leftPressed = false;
				return;
			case "ArrowUp":
			case "Up":
				upPressed = false;
				return;
			case "ArrowDown":
			case "Down":
				downPressed = false;
				return;
			case "KeyD":
				dPressed = false;
				return;
			case "KeyA":
				aPressed = false;
				return;
			case "KeyW":
				wPressed = false;
				return;
			case "KeyS":
				sPressed = false;
				return;
			case "Backspace":
				backspacePressed = false;
				break;
			default:
				return;
		}
	}
}

var mouseX = -1;
var mouseY = -1;
var leftMouseButtonPressed = false;
var rightMouseButtonPressed = false;

var _leftMouseButtonClicked = false;
var _rightMouseButtonClicked = false;

function leftMouseButtonClicked() {
	const retValue = _leftMouseButtonClicked;
	_leftMouseButtonClicked = false;
	return retValue;
}

function rightMouseButtonClicked() {
	const retValue = _rightMouseButtonClicked;
	_rightMouseButtonClicked = false;
	return retValue;
}

// MOUSE
function mouseMoveHandler(event) {
	mouseX = event.pageX - canvas.offsetLeft;
	mouseY = event.pageY - canvas.offsetTop;
}

function mouseDownHandler(event) {
	switch (event.button) {
		case 0:
			leftMouseButtonPressed = true;
			return;
		case 2:
			rightMouseButtonPressed = true;
			return;
		default:
			return;
	}
}

function mouseUpHandler(event) {
	switch (event.button) {
		case 0:
			leftMouseButtonPressed = false;
			return;
		case 2:
			rightMouseButtonPressed = false;
			return;
		default:
			return;
	}
}

function leftMouseClickHandler(event) {
	_leftMouseButtonClicked = true;
}

function rightMouseClickHandler(event) {
	_rightMouseButtonClicked = true;
}