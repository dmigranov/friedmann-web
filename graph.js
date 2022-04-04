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
    context2d.moveTo(XC(0), YC(0));
    context2d.lineTo(XC(MaxX()), YC(0));
    context2d.stroke();
    
    context2d.restore();
}