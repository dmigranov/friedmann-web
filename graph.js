const borderGap = 10;
const tickSize = 4;

export function drawAxes(graphCanvas, context2d) {
    context2d.save();
    context2d.lineWidth = 1;

    const height = graphCanvas.height;
    const width = graphCanvas.width;
    // +Y axis
    context2d.beginPath();
    context2d.moveTo(borderGap, borderGap);
    context2d.lineTo(borderGap, height - borderGap);
    context2d.stroke();

    // +X axis
    context2d.beginPath();
    context2d.moveTo(borderGap, height - borderGap);
    context2d.lineTo(width - borderGap, height - borderGap);
    context2d.stroke();

    // X axis ticks
    context2d.beginPath();
    context2d.moveTo(width / 2, height - borderGap + tickSize);
    context2d.lineTo(width / 2, height - borderGap - tickSize);
    context2d.stroke();

    context2d.beginPath();
    context2d.moveTo(width - borderGap, height - borderGap + tickSize);
    context2d.lineTo(width - borderGap, height - borderGap - tickSize);
    context2d.stroke();

    // X axis tick
    context2d.beginPath();
    context2d.moveTo(borderGap + tickSize, borderGap);
    context2d.lineTo(borderGap - tickSize, borderGap);
    context2d.stroke();

    context2d.restore();
}

export function drawGraph(graphCanvas, context2d, numberOfPoints) {
    const xMultiplier = 2 * Math.PI / (numberOfPoints - 1);

    context2d.beginPath();
    for (var i = 0; i < numberOfPoints; i++) {
        var x = xMultiplier * i;
        var y = Math.cos(x) + 1; //2 - (1 - cosx) - to invert, because Y goes down

        x = x / XM_2PI * (friedmann_w - 10) + 5;
        y = y / 2 * (friedmann_h - 10) + 5;
        
        if (i == 0) {
            context2d.moveTo(XC(x), YC(y));
        } 
        else {
            context2d.lineTo(XC(x), YC(y));
        }
    }
    context2d.stroke();
}