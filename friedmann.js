import * as SphericalMath from './spherical_math.js';
import * as SphericalRandom from './spherical_random.js';
import * as Graph from './graph.js';
import * as SelectionSystem from './selection_system.js';
import * as SphericalRendering from './spherical_rendering_library.js';

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
	canvas.addEventListener("contextmenu", e => e.preventDefault());

	SphericalRendering.initializeEngine(canvas);

	const buffers = SphericalRendering.createSphere(initialObjectRadius, 15, 15, [0., 1., 0., 1.]);
	const points = SphericalRandom.generatePoints(1, initialObjectRadius, 100);
	const worldMatrices = points.map((point) => SphericalMath.absolutePositionMatrix(point[0], point[1], point[2], point[3]));
	for (const worldMatrix of worldMatrices) {
		SphericalRendering.addObject(worldMatrix, buffers);
	}

	SphericalRendering.addUpdater((deltaTime, scene) => { updateScene(scene, deltaTime) });
	SphericalRendering.addUpdater((deltaTime, scene) => { updatePage(scene, deltaTime) });
	SphericalRendering.addUpdater((deltaTime, scene) => { SphericalRendering.setTime(friedmannTimer.mu) });

	SphericalRendering.startGame();
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

	if (rightMouseButtonClicked() && currentObject != null) {
		currentObject.isSelected = !currentObject.isSelected;
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

		if (sceneObject.isSelected && vPressed)
			;	//todo: set invisible - отдельный механизм!
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

	simulationSpeedOutput.innerHTML = "<br/>(" + friedmannTimer.muCoeff.toFixed(2) + " μ/second)";
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
var vPressed = false;
var rPressed = false;

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
			case "KeyV":
				vPressed = true;
				return;
			case "KeyR":
				rPressed = true;
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
			case "KeyV":
				vPressed = false;
				return;
			case "KeyR":
				rPressed = false;
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

main();


// 19.04: начата ветка library (перенос кода в отдельный модуль)