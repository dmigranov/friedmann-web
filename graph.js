export function drawAxes(graphCanvas, context2d) {
    context2d.save();
    context2d.lineWidth = 2;

    // +Y axis
    context2d.beginPath();
    context2d.moveTo(10, 10);
    context2d.lineTo(10, graphCanvas.height - 10);
    context2d.stroke();

    // +X axis
    /*
    context2d.beginPath();
    context2d.moveTo(XC(0), YC(0));
    context2d.lineTo(XC(MaxX()), YC(0));
    context2d.stroke();
    */
    context2d.restore();
}