// todo: WebGL поддерживает Instancing!
// drawElements = indexed, drawArrays = non-indexed

window.onload = main;

// starts here
function main() {
  // Obtain a reference to the canvas
  const canvas = document.querySelector("#glCanvas");

  // Initialize the GL context
  const gl = canvas.getContext("webgl");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  // Initialize user input handling
  document.addEventListener('keydown', keyDownHandler, false);
  document.addEventListener('keyup', keyUpHandler, false);

  // Do one-time initialization of graphics resources
  //var programInfo = initScene(gl);
  var scene = initScene(gl);

  var then = 0;
  function render(now) {
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    updateScene(scene, deltaTime);
    drawScene(gl, scene, deltaTime);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}


var cubeRotationX = 0.;
var cubeRotationY = 0.;
function updateScene(scene, deltaTime) {
  const constants = scene.constants;

  // OPTION 1
  // const modelViewMatrix = mat4.create();
  // ... (probably you'll need to know the total time)
  // constants.modelViewMatrix = modelViewMatrix;

  // OPTION 2
  // const modelViewMatrix = constants.modelViewMatrix;
  // just modify it!

  { //that's option 1
    const modelViewMatrix = mat4.create();
    if (leftPressed) {
      cubeRotationX -= deltaTime;
    }
    if (rightPressed) {
      cubeRotationX += deltaTime;
    }
    if (upPressed) {
      cubeRotationY += deltaTime;
    }
    if (downPressed) {
      cubeRotationY -= deltaTime;
    }
    mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]); 
    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotationX, [0, 1, 0]);
    mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotationY, [1, 0, 0]);
    constants.modelViewMatrix = modelViewMatrix;
  }
}


function drawScene(gl, scene, deltaTime) {
  const programInfo = scene.programInfo;
  const buffers = scene.buffers;
  const constants = scene.constants;

  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Tell WebGL how to pull out the positions from the position buffer into the aVertexPosition attribute.
  // (we bind the square's vertex buffer to the attribute the shader is using for aVertexPosition )
  // Attributes receive values from buffers. Each iteration of the vertex shader receives the next value from the buffer assigned to that attribute
  {
    const numComponents = 3; // pull out 3 values per iteration (xyz); in future - 4!
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

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    constants.projectionMatrix);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    constants.modelViewMatrix);

  //DRAW!
  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset); //type specifies the type of the values in the element (index) array buffer
  }
}

function initScene(gl) {
  // Vertex shader
  const vsSource = `
  attribute vec4 aVertexPosition;
  attribute vec4 aVertexColor;

  uniform mat4 uModelViewMatrix;
  uniform mat4 uProjectionMatrix;

  varying lowp vec4 vColor; //out; varying used for interpolated data between a vertex shader and a fragment shader. 

  void main() {
    gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    vColor = aVertexColor; 
  }`;

  // Fragment shader
  const fsSource = `
  varying lowp vec4 vColor;

  void main() {
    gl_FragColor = vColor;
    //todo: modify
  }`;

  // Initialize a shader program; this is where all the lighting
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

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
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    },
  };

  // Here's where we call the routine that builds all the objects we'll be drawing.
  const buffers = initBuffers(gl);

  // Create a perspective matrix
  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix,     // destination matrix
    modelViewMatrix,     // matrix to translate
    [-0.0, 0.0, -6.0]);  // amount to translate

  const scene = {
    programInfo: programInfo,
    buffers: buffers,
    constants: {
      projectionMatrix: projectionMatrix,
      modelViewMatrix: modelViewMatrix,
    }
  };

  return scene;
}

//
// Initialize the buffers we will need. 
//
function initBuffers(gl) {
  const positions = [
    // Front face
    -1.0, -1.0, 1.0,
    1.0, -1.0, 1.0,
    1.0, 1.0, 1.0,
    -1.0, 1.0, 1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0, 1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, -1.0, -1.0,

    // Top face
    -1.0, 1.0, -1.0,
    -1.0, 1.0, 1.0,
    1.0, 1.0, 1.0,
    1.0, 1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
    1.0, -1.0, -1.0,
    1.0, -1.0, 1.0,
    -1.0, -1.0, 1.0,

    // Right face
    1.0, -1.0, -1.0,
    1.0, 1.0, -1.0,
    1.0, 1.0, 1.0,
    1.0, -1.0, 1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0, 1.0,
    -1.0, 1.0, 1.0,
    -1.0, 1.0, -1.0,
  ];

  const positionBuffer = gl.createBuffer(); // Create a buffer for the square's positions.
  // Select the positionBuffer as the one to apply buffer operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  // Now pass the list of positions into WebGL to build the shape. 
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);


  const faceColors = [
    [1.0, 1.0, 1.0, 1.0],    // Front face: white
    [1.0, 0.0, 0.0, 1.0],    // Back face: red
    [0.0, 1.0, 0.0, 1.0],    // Top face: green
    [0.0, 0.0, 1.0, 1.0],    // Bottom face: blue
    [1.0, 1.0, 0.0, 1.0],    // Right face: yellow
    [1.0, 0.0, 1.0, 1.0],    // Left face: purple
  ];

  var colors = [];
  for (var j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j];
    colors = colors.concat(c, c, c, c);     // Repeat each color four times for the four vertices of the face
  }

  const colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);


  const indices = [
    0, 1, 2, 0, 2, 3,    // front
    4, 5, 6, 4, 6, 7,    // back
    8, 9, 10, 8, 10, 11,   // top
    12, 13, 14, 12, 14, 15,   // bottom
    16, 17, 18, 16, 18, 19,   // right
    20, 21, 22, 20, 22, 23,   // left
  ];

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


//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}


//
// creates a shader of the given type, uploads the source and compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
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
      case "KeyA":
      case "KeyW":
      case "KeyS":
      //TODO
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
      case "KeyA":
      case "KeyW":
      case "KeyS":
      //TODO
      default:
        return;
    }
  }
}