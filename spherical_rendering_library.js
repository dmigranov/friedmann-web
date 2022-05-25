import * as Shader from './shader_loading.js';
import * as SphericalMath from './spherical_math.js';
import * as SphericalMesh from './spherical_mesh.js';

// drawElements = indexed, drawArrays = non-indexed
// https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS/Errors/CORSRequestNotHttp

var gl;
var scene;
var updaters;
var simulationTime;

export const SphericalVisibilityEnum = {
    VISIBLE_NONE: 1,
    VISIBLE_FRONT: 2,
    VISIBLE_ALL: 3,
};

export function initializeEngine(canvas) {
    gl = canvas.getContext("webgl2");

    // Only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }

    gl.enable(gl.CULL_FACE); // should it stay? TODO
    //todo: выключать culling если внутри объекта, и включать, если в антиподальной точке 
    //или просто залить изнутри объекты черным?
    //todo: разобраться с этим (все в порядке с проекцией?)

    updaters = [];
    simulationTime = 4.;

    var sceneObjects = [];

    scene = initScene(gl);
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

	float getWavelengthFromHue(float hue)
	{
		float lambda = 650. - 250. / 270. * hue;
		return lambda;
	}

	float getFrequency(float wavelength)
	{
		float frequency = 2. * PI * C / wavelength;
		return frequency;
	}

	float getWavelengthFromFrequency(float frequency)
	{
		float lambda = 2. * PI * C / frequency;
		return lambda;
	}

	float getHue(float wavelength)
	{
		//float lambda = 2. * PI * C / frequency;
		float hue = (650. - wavelength) * 270. / 250.;
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


	const float w1 = 60., w2 = 540., w3 = 2000.;	// 10000 is too big; 1 - too small (won't be darkened at all)
	const float z1 = 400., z2 = 540., z3 = 650.;
	const float a = (z3 - z2) / (z3 - z1);

	float widenLambda(float lambda) 
	{
		float lambdaNew;

		// all of these preserve lambda_green = 539

		// 0. Not changing anything
		lambdaNew = lambda;

		// 1. linear interpolation: [100, 889] -> [400, 650] //красный цвет - это верхняя граница
		lambdaNew = 0.317 * lambda + 368.3;

		// 1.5. linear interpolation: [24, 950] -> [400, 650] //красный цвет - это верхняя граница
		//lambdaNew = 0.27 * lambda + 393.43;

		// 2. quadratic: [296, 783] -> [400, 650]
		//lambdaNew = 23.216 * sqrt(lambda);

		// 3. logarithm: [362, 704] -> [400, 650]
		//lambdaNew = 539. * log(lambda / 539. + 1.) / log(2.);

		// 4. exponential:  [291, inf] -> [400, 650]
		//lambdaNew = 650. * (1. - exp(-1.767 * lambda / 650.));

		// 5. projective:
		if (abs(lambda - w2) > 0.01)
		{
			float b = (lambda - w1) / (lambda - w2) * (w3 - w2) / (w3 - w1);
			lambdaNew = (a * z1 - b * z2) / (a - b);
		}
		else
			lambdaNew = lambda;

		// 6. piecewise


		return lambdaNew;
	}

	void main() {
		vec4 darkenedColor, dopplerColor; //darkenedColor = modifiedCOlor
		
		vec3 rgb = vec3(vColor.x, vColor.y, vColor.z);
		vec3 rgbNew;

		vec3 hsv = rgb2hsv(rgb);
		float hue = hsv.x;
		float lambda = getWavelengthFromHue(hue);
		float freq = getFrequency(lambda);

		float freqNew = freq * vRadiusRatio;
		float lambdaNew = getWavelengthFromFrequency(freqNew);
		float lambdaWidened = widenLambda(lambdaNew);
		float hueNew = getHue(lambdaWidened);

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

			//было 0
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

    var sceneObjects = [];

    const viewMatrixFront = mat4.create();

    const projectionMatrixFront = SphericalMath.bananaProjectionMatrixFrontHalf(45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.05);;
    const projectionMatrixBack = SphericalMath.bananaProjectionMatrixBackHalf(45 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.05);

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

        if (sceneObject.sphericalVisibility == SphericalVisibilityEnum.VISIBLE_NONE || sceneObject.isVisible == false)
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
        gl.uniform1i(programInfo.uniformLocations.isSelected, sceneObject.isSelected);

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

export function addObject(worldMatrix, buffers) {
    scene.sceneObjects.push({
        worldMatrix: worldMatrix,
        buffers: buffers,
        sphericalVisibility: SphericalVisibilityEnum.VISIBLE_ALL,
		isSelected: 0,
		isVisible: true,
    });
}

export function addUpdater(updater) {
    updaters.push(updater);
}

export function setTime(time) {
    simulationTime = time;
}

export function createSphere(radius, sliceCount, stackCount, color) {
    return SphericalMesh.createSphere(gl, radius, sliceCount, stackCount, color);
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