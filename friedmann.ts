// https://armno.medium.com/vscode-and-webgl-development-dfc17bba52ed

// starts here
function main () {
    // Obtain a reference to the canvas
    const canvas = <HTMLCanvasElement>document.querySelector("#glCanvas");
    
    // Initialize the GL context
    const gl = canvas.getContext("webgl");
  
    // Only continue if WebGL is available and working
    if (gl === null) {
      alert("Unable to initialize WebGL. Your browser or machine may not support it.");
      return;
    }
  
    drawScene(gl, programInfo, buffers);
  }  

  function drawScene(gl, programInfo, buffers) {
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  window.onload = main;