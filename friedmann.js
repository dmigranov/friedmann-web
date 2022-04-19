// drawElements = indexed, drawArrays = non-indexed
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSRequestNotHttp

import * as SphericalMath from './spherical_math.js';
import * as SphericalMesh from './spherical_mesh.js';
import * as SphericalRandom from './spherical_random.js';
import * as Shader from './shader_loading.js';
import * as Graph from './graph.js';
import * as SelectionSystem from './selection_system.js';

import { FriedmannTimer } from './friedmann_timer.js';

// Obtain a reference to the canvas
const canvas = document.querySelector("#glCanvas");
const graphCanvas = document.getElementById("graphcanvas");
const pointCanvas = document.getElementById("pointcanvas");

const muOutput = document.getElementById("muOutput");
const radiusOutput = document.getElementById("radiusOutput");
const currentObjectOutput = document.getElementById("currentObjectOutput");
const simulationSpeedOutput = document.getElementById("simulationSpeedOutput"); 

const initialMuCoeff = 1. / 3.;
const initialSimulationTime = 8. / (9. * initialMuCoeff);
const friedmannTimer = new FriedmannTimer(initialSimulationTime, initialMuCoeff);

const PI_MUL_2 = 2 * Math.PI;

const initialObjectRadius = 0.1;

// Initialize the GL context
const gl = canvas.getContext("webgl2");
gl.enable(gl.CULL_FACE); // should it stay? TODO


// Initialize the 2D contexts
const context2dGraph = graphCanvas.getContext('2d');
const context2dPoint = pointCanvas.getContext('2d');

Graph.drawAxes(graphCanvas, context2dGraph);
Graph.drawGraph(graphCanvas, context2dGraph, 20);

function main() {
	// Initialize user input handling
	document.addEventListener('keydown', keyDownHandler);
	document.addEventListener("keydown", function (e) {
		if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.code) > -1) {
			e.preventDefault();
		}
	}, false);
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

function radiusFunction(mu) {
	return 2 * (1 - Math.cos(mu));
}

function radiusAbridgedFunction(mu) {
	const startRadius = 0.2;
	const multiplier = 2. - startRadius / 2.;
	return startRadius + multiplier * (1. - Math.cos(mu));
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

var SphericalVisibilityEnum = {
	VISIBLE_NONE: 1,
	VISIBLE_FRONT: 2,
	VISIBLE_ALL: 3,
};

var oldPressedAnimationKey = false;

var isAnimation = true;

var currentObject;
var currentObjectIndex;

function updateScene(scene, deltaTime) {
	if (rightPressed) {
		isAnimation = false;
		friedmannTimer.addDelta(deltaTime);
	}
	else if (leftPressed) {
		isAnimation = false;
		friedmannTimer.addDelta(-deltaTime);
	}
	else if (isAnimation) {
		friedmannTimer.addDelta(deltaTime);
	}

	if (spacePressed) {
		if (!oldPressedAnimationKey)
			isAnimation = !isAnimation;
		oldPressedAnimationKey = true;
	}
	else
		oldPressedAnimationKey = false;

	const muCoeffDelta = 0.01;
	if (upPressed) {
		friedmannTimer.muCoeff += muCoeffDelta;
	}
	else if (downPressed) {
		const muCoeff = friedmannTimer.muCoeff;
		if (muCoeff >= muCoeffDelta)
			friedmannTimer.muCoeff -= muCoeffDelta;
	}

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

		/*
		if (dPressed) cameraRotationX += deltaTime;
		if (aPressed) cameraRotationX -= deltaTime;
		*/

		cameraRotationY = Math.max(-pitchLimit, cameraRotationY);
		cameraRotationY = Math.min(+pitchLimit, cameraRotationY);

		if (cameraRotationX > Math.PI)
			cameraRotationX -= 2 * Math.PI;
		else if (cameraRotationX < -Math.PI)
			cameraRotationX += 2 * Math.PI;

		mat4.multiply(viewMatrix,
			SphericalMath.sphericalRotationYZ(backspacePressed ? PI_MUL_2 + cameraRotationY : -cameraRotationY),
			SphericalMath.sphericalRotationXZ(backspacePressed ? cameraRotationX + Math.PI : cameraRotationX));

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

	const viewMatrix = scene.constants.viewMatrixFront;
	const projectionMatrix = scene.constants.projectionMatrixFront; // в оригинале - для elliptic случая, но не так важно
	const spaceRadius = radiusFunction(friedmannTimer.mu);

	const mouseXNorm = mouseX / canvas.clientWidth * 2. - 1.;		//from -1 (left) to 1 (right)
	const mouseYNorm = -(mouseY / canvas.clientHeight * 2. - 1.);	//from -1 (down) to 1 (up)
	// z is from -1 to 1 too!!!

	var minDistance = 10000;
	currentObject = null;
	currentObjectIndex = -1;

	for (var i = 0; i < scene.sceneObjects.length; i++) {
		const sceneObject = scene.sceneObjects[i];
		const worldMatrix = sceneObject.worldMatrix;

		var viewWorldMatrix = mat4.create();
		mat4.multiply(viewWorldMatrix, viewMatrix, worldMatrix); //todo: check if correct

		var sphPosition = vec4.fromValues(0, 0, 0, 1);
		vec4.transformMat4(sphPosition, sphPosition, viewWorldMatrix);

		const chi = SphericalMath.sphericalDistance(sphPosition, vec4.fromValues(0, 0, 0, 1), 1.);
		const mu = friedmannTimer.mu;


		if (mu < chi)
			sceneObject.sphericalVisibility = SphericalVisibilityEnum.VISIBLE_NONE;
		else {
			if (mu <= (PI_MUL_2 - chi)) // && mu >= chi
				sceneObject.sphericalVisibility = SphericalVisibilityEnum.VISIBLE_FRONT;
			else //mu > (2 * XM_PI - dist)
				sceneObject.sphericalVisibility = SphericalVisibilityEnum.VISIBLE_ALL;
		}

		// SELECTION
		if (sceneObject.visibility == SphericalVisibilityEnum.VISIBLE_NONE)
			continue;
		else if (isCursorInsideCanvas) {
			const zValue = SelectionSystem.raytraceSphereMouse(mouseXNorm, mouseYNorm, sphPosition, spaceRadius, initialObjectRadius, projectionMatrix, radiusAbridgedFunction, mu);
			if (zValue == -10)
				continue;

			if (zValue > 0 && sceneObject.sphericalVisibility == SphericalVisibilityEnum.VISIBLE_FRONT) //back copies aren't visible, so we just continue
				continue;

			if (zValue < minDistance) { 		//чем меньше тем ближе!
				minDistance = zValue;
				currentObject = sceneObject;
				currentObjectIndex = i;
			}
		}
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
	gl.uniform1f(programInfo.uniformLocations.mu, friedmannTimer.mu);

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


function updatePage(scene, deltaTime) {
	const transformed = vec4.fromValues(0, 0, 0, 1);
	vec4.transformMat4(transformed, transformed, SphericalMath.absolutePositionMatrix(0.6, 0, 0, 0.8))

	const mu = friedmannTimer.mu;
	muOutput.innerHTML = "μ: " + mu.toFixed(3);

	const radius = radiusFunction(mu);
	radiusOutput.innerHTML = "Radius: " + radius.toFixed(3);

	Graph.updateGraph(pointCanvas, context2dPoint, mu);

	const viewMatrix = scene.constants.viewMatrixFront; //todo
	if (currentObject != null) {
		const worldMatrix = currentObject.worldMatrix;

		var viewWorldMatrix = mat4.create();
		mat4.multiply(viewWorldMatrix, viewMatrix, worldMatrix); //todo: check if correct

		var sphPosition = vec4.fromValues(0, 0, 0, 1);
		vec4.transformMat4(sphPosition, sphPosition, viewWorldMatrix);

		var chi = Math.acos(sphPosition[3]);
		var half = "Front half";
		if (sphPosition[2] > 0) //камера смотрит по отрицательному направлению Z! (в отличие от DirectX)
		{
			chi = 2 * Math.PI - chi;
			half = "Back half";
		}

		currentObjectOutput.innerHTML = "Current object: №" + currentObjectIndex + "<br/>χ = " + chi.toFixed(2) + " (" + half + ")";
	}
	else
		currentObjectOutput.innerHTML = "Current object: no object<br/>&nbsp;";

	simulationSpeedOutput.innerHTML = "<br/>(" + friedmannTimer.muCoeff.toFixed(2)+ " μ/second)";
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
		float startRadius = 0.2f;
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
	out mediump float vRadiusRatio;


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

		mat4 viewWorldMatrix = viewMatrix * uWorldMatrix;

		vec4 position;
		vec4 position1 = normalize(aVertexPosition);
		vec4 objectCenter1 = vec4(0.f, 0.f, 0.f, 1.f); //local coordinates

		float chiCenter = SphericalDistance(objectCenter1, viewWorldMatrix * objectCenter1, 1.f);
		if (gl_InstanceID == 1)
			chiCenter += 3.14159265f;

		float radius = RadiusFunction(uMu);

		if (abs(position1.w - 1.) < 0.00001)
			position = position1 * radius;
		else
		{
			float distanceFromPointToCenter = SphericalDistance(objectCenter1, position1, 1.);
			float radiusOldCenter = RadiusAbridgedFunction(uMu - chiCenter);

			float w_new = radiusOldCenter * (1. - 2. * pow(sin(distanceFromPointToCenter / (2. * radiusOldCenter)), 2.));
			
			float lambda = sqrt((position1.x * position1.x + position1.y * position1.y + position1.z * position1.z) / (radiusOldCenter * radiusOldCenter - w_new * w_new));
			float x_new = position1.x / lambda, y_new = position1.y / lambda, z_new = position1.z / lambda; 
			
			position = vec4(x_new, y_new, z_new, w_new);
			position *= radius / radiusOldCenter;
		}

		vec4 cameraSpacePosition = viewWorldMatrix * position;

		float density = 0.05f;	//!

		float distance = SphericalDistance(vec4(0, 0, 0, radius), cameraSpacePosition, radius);
		if (gl_InstanceID == 1)
			distance += 3.14159265f * radius;

		float chi;
		chi = distance / radius;
		float radiusOld = RadiusFunction(uMu - chi);

		gl_Position = projectionMatrix * cameraSpacePosition;
		vColor = aVertexColor; 
		vFogFactor = clamp(exp(-density * distance), 0.0, 1.0);
		vRadiusRatio = radiusOld / radius;
	}`;

	// Fragment shader
	const fsSource = `#version 300 es

	#define PI 3.14159265
	#define C 299792458.

	uniform int uIsSelected;

	precision mediump float;
	in mediump vec4 vColor;
	in mediump float vFogFactor;
	in mediump float vRadiusRatio;

	out vec4 fragColor;

	float getFrequency(float hue)
	{
		float lambda = 650. - 250. / 270. * hue;
		float frequency = 2. * PI * C / lambda;
		return frequency;
	}

	float getHue(float frequency)
	{
		float lambda = 2. * PI * C / frequency;
		float hue = (650. - lambda) * 270. / 250.;
		return hue;
	}

	vec3 hsv2rgb(vec3 hsv)
	{
		float h = hsv.x, s = hsv.y, v = hsv.z;
		float r, g, b;

		float hh, ff, p, q, t;
		hh = h;
		if (hh >= 360.f) 
			hh = 0.f;
		hh /= 60.f;
		int i = int(hh);
		ff = hh - float(i);
		p = v * (1.0 - s);
		q = v * (1.0 - (s * ff));
		t = v * (1.0 - (s * (1.0 - ff)));

		switch (i) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;
		case 1:
			r = q;
			g = v;
			b = p;
			break;
		case 2:
			r = p;
			g = v;
			b = t;
			break;
		case 3:
			r = p;
			g = q;
			b = v;
			break; 
		case 4:
			r = t;
			g = p;
			b = v;
			break;
		case 5:
		default:
			r = v;
			g = p;
			b = q;
			break;
		}

		return vec3(r, g, b);
	}

	vec3 rgb2hsv(vec3 rgb)
	{
		float r = rgb.x, g = rgb.y, b = rgb.z;
		float min, max, delta;
		vec3 hsv;
		float h, s, v;

		min = r < g ? r : g;
		min = min < b ? min : b;

		max = r > g ? r : g;
		max = max > b ? max : b;

		delta = max - min;

		//! v
		v = max; 
		if (delta < 0.00001)
		{
			s = 0.f;
			h = 0.f; 
			return vec3(h, s, v);
		}


		//! s
		if (max > 0.f)
			s = (delta / max); 
		else
		{
			// max is 0 -> r = g = b = 
			s = 0.f;
			h = 0.f;
			return vec3(h, s, v);
		}


		//! h
		if (r >= max)                          
			h = (g - b) / delta;
		else
			if (g >= max)
				h = 2.f + (b - r) / delta; 
			else
				h = 4.f + (r - g) / delta;  

		h *= 60.f;  //degrees

		if (h < 0.f)
			h += 360.f;

		hsv.x = h;
		hsv.y = s;
		hsv.z = v;
		return hsv;
	}


	void main() {
		//todo: modify
		vec4 darkenedColor, dopplerColor; //darkenedColor = modifiedCOlor
		
		vec3 rgb = vec3(vColor.x, vColor.y, vColor.z);
		vec3 rgbNew;

		vec3 hsv = rgb2hsv(rgb);
		float hue = hsv.x;
		float freq = getFrequency(hue);

		float freqNew = freq * vRadiusRatio;
		float hueNew = getHue(freqNew);

		bool isRedshift = false, isBlueshift = false;
		float originalHueNew = hueNew;
		if (hueNew < 0.)
		{
			hueNew = 0.;
			isRedshift = true;
		}
		if (hueNew > 270.)
		{
			hueNew = 270.;
			isBlueshift = true;
		}

		vec3 hsvNew = vec3(hueNew, 1.f, 1.f);
		rgbNew = hsv2rgb(hsvNew);
		dopplerColor = vec4(rgbNew.x, rgbNew.y, rgbNew.z, vColor.w);

		if (!isRedshift && !isBlueshift)
			darkenedColor = dopplerColor;
		else 
		{
			float darkenCoeff = 0.4f; //discrete 
			vec4 dopplerColorDark = (1. - darkenCoeff) * vec4(0.f, 0.f, 0.f, 1.f) + darkenCoeff * dopplerColor;
		
			float interpolationDiff = 50.f; 
			float interpolationCoeff;

			if (isBlueshift)
			{
				float upperLimit = 270.f + interpolationDiff;
				originalHueNew = clamp(originalHueNew, 270.f, upperLimit);
				interpolationCoeff = (upperLimit - originalHueNew) / interpolationDiff;
			}
			else //if (isRedshift)
			{
				float lowerLimit = 0.f - interpolationDiff;
				originalHueNew = clamp(originalHueNew, lowerLimit, 0.f);
				interpolationCoeff = (originalHueNew - lowerLimit) / interpolationDiff;
			}	

			//darkenedColor = vec4(0., 0., 0., 1.); //todo
			darkenedColor = (1. - interpolationCoeff) * dopplerColorDark + interpolationCoeff * dopplerColor;
		}

		vec4 retColor = vFogFactor * darkenedColor + (1.0 - vFogFactor) * vec4(0., 0., 0., 1.);
		//vec4 retColor = darkenedColor;
		if(uIsSelected != 0)
			retColor = 0.3 * retColor + 0.7 * vec4(1., 1., 1., 1.);
		
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
			isSelected: gl.getUniformLocation(shaderProgram, 'uIsSelected'),
		},
	};

	// Here's where we call the routine that builds all the objects we'll be drawing.
	const buffers1 = SphericalMesh.createSphere(gl, initialObjectRadius, 15, 15, [0., 1., 0., 1.]);
	const buffers2 = SphericalMesh.createSphere(gl, initialObjectRadius, 15, 15, [1., 0., 0., 1.]);

	const points = SphericalRandom.generatePoints(1, initialObjectRadius, 100);
	const worldMatrices = points.map((point) => SphericalMath.absolutePositionMatrix(point[0], point[1], point[2], point[3]));
	var sceneObjects = worldMatrices.map((worldMatrix) => {
		return {
			worldMatrix: worldMatrix,
			//buffers: (Math.random() < 0.5 ? buffers1 : buffers2),
			buffers: buffers1,
			sphericalVisibility: SphericalVisibilityEnum.VISIBLE_NONE,
		}
	});

	//sceneObjects = [ { worldMatrix: SphericalMath.sphericalRotationZW(0.2), buffers: buffers1 }	];

	const viewMatrixFront = mat4.create();

	const projectionMatrixFront = SphericalMath.bananaProjectionMatrixFrontHalf(45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1);;
	const projectionMatrixBack = SphericalMath.bananaProjectionMatrixBackHalf(45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1);

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
var spacePressed = false;
var ctrlPressed = false;


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
			case "Space":
				spacePressed = true;
				break;
			case "ControlLeft":
			case "ControlRight":
				ctrlPressed = true;
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
			case "Space":
				spacePressed = false;
				break;
			case "ControlLeft":
			case "ControlRight":
				ctrlPressed = false;
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


// Only continue if WebGL is available and working
if (gl === null)
	alert("Unable to initialize WebGL. Your browser or machine may not support it.");
else
	main()