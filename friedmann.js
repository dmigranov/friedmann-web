// todo: WebGL поддерживает Instancing!
// drawElements = indexed, drawArrays = non-indexed

// Obtain a reference to the canvas
const canvas = document.querySelector("#glCanvas");
const output1 = document.getElementById("output1");
const output2 = document.getElementById("output2");

main()

function main() {
  // Initialize the GL context
  const gl = canvas.getContext("webgl2");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

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
    updatePage(scene, deltaTime)

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}


var cubeRotationX = 0.;
var cubeRotationY = 0.;
function updateScene(scene, deltaTime) {
  const constants = scene.constants;

  // OPTION 1
  // const worldMatrix = mat4.create();
  // ... (probably you'll need to know the total time)
  // constants.worldMatrix = worldMatrix;

  // OPTION 2
  // const worldMatrix = constants.worldMatrix;
  // just modify it!

  { //that's option 1
    const worldMatrix = mat4.create();
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

    mat4.rotate(worldMatrix, worldMatrix, cubeRotationX, [0, 1, 0]);
    mat4.rotate(worldMatrix, worldMatrix, cubeRotationY, [1, 0, 0]);
    constants.worldMatrix = worldMatrix;
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
    programInfo.uniformLocations.viewMatrix,
    false,
    constants.viewMatrix);
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.worldMatrix,
    false,
    constants.worldMatrix);


  //DRAW!
  {
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    //gl.drawElements(gl.TRIANGLES, vertexCount, type, offset); 
    gl.drawElementsInstanced(gl.TRIANGLES, vertexCount, type, offset, 2); //type specifies the type of the values in the element (index) array buffer
  }
}


function updatePage(scene, deltaTime) {
  if (mouseX >= 0 && mouseY >= 0 && mouseX <= canvas.clientWidth && mouseY <= canvas.clientHeight)
    output1.innerHTML = "Mouse:  <br />" + " x: " + mouseX + ", y: " + mouseY;
  else
    output1.innerHTML = "Mouse outside!";

  // if (leftMouseButtonClicked())
  if (leftMouseButtonPressed)
    output2.innerHTML = "Mouse down!";
  else
    output2.innerHTML = "Mouse up!";

  // TODO: dx, dy from mouse (probably in UpdateScene)
}


function initScene(gl) {
  // Vertex shader
  const vsSource = `#version 300 es
  
  in vec4 aVertexPosition; // webgl: in instead of attribute
  in vec4 aVertexColor;

  uniform mat4 uWorldMatrix;

  uniform mat4 uViewMatrixFront;

  uniform mat4 uProjectionMatrixFront;
  uniform mat4 uProjectionMatrixBack;

  out mediump vec4 vColor; //out = webgl 1.0 varyinh; used for interpolated data between a vertex shader and a fragment shader

  void main() {
    mat4 uViewMatrix;
    if (gl_InstanceID == 0)
      uViewMatrix = uViewMatrixFront;
    else
      uViewMatrix = uViewMatrixFront; //todo: домножить на матрицу

    gl_Position = uProjectionMatrixFront * uViewMatrix * uWorldMatrix * aVertexPosition;
    vColor = aVertexColor; 
  }`;

  // Fragment shader
  const fsSource = `#version 300 es
  precision mediump float;

  in mediump vec4 vColor;
  out vec4 fragColor;

  void main() {
    fragColor = vColor;
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
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrixFront'),
      viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrixFront'),
      worldMatrix: gl.getUniformLocation(shaderProgram, 'uWorldMatrix'),
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

  const worldMatrix = mat4.create();

  const viewMatrix = mat4.create();
  mat4.translate(viewMatrix, viewMatrix, [-0.0, 0.0, -6.0]);

  const scene = {
    programInfo: programInfo,
    buffers: buffers,
    constants: {
      projectionMatrix: projectionMatrix,
      viewMatrix: viewMatrix,
      worldMatrix: worldMatrix,
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


// KEYBOARD

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