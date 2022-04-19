

var gl;
var scene;

export function initializeEngine(canvas) {
    gl = canvas.getContext("webgl2");
    gl.enable(gl.CULL_FACE); // should it stay? TODO


}


export function startGame() {
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