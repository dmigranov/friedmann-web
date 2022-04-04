const borderGap = 10;

export function drawAxes(graphCanvas, context2d) {
    context2d.save();
    context2d.lineWidth = 1;

    // +Y axis
    context2d.beginPath();
    context2d.moveTo(borderGap, borderGap);
    context2d.lineTo(borderGap, graphCanvas.height - borderGap);
    context2d.stroke();

    // +X axis
    context2d.beginPath();
    context2d.moveTo(borderGap, graphCanvas.height - borderGap);
    context2d.lineTo(graphCanvas.width - borderGap, graphCanvas.height - borderGap);
    context2d.stroke();
    
    context2d.restore();
}