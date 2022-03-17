// https://armno.medium.com/vscode-and-webgl-development-dfc17bba52ed
// starts here
function onload() {
    // Obtain a reference to the canvas
    var canvas = document.querySelector("#glCanvas");
    // Initialize the GL context
    var gl = canvas.getContext("webgl");
    // Only continue if WebGL is available and working
    if (gl === null) {
        alert("Unable to initialize WebGL. Your browser or machine may not support it.");
        return;
    }
    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);
}
