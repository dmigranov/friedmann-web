const borderGap = 10;
const tickSize = 4;

export function updateGraph(graphCanvas, context2d, mu) {
    context2d.clearRect(0, 0, graphCanvas.width, graphCanvas.height); // todo: optimize?
    //https://stackoverflow.com/questions/3008635/html5-canvas-element-multiple-layers

    drawAxes(graphCanvas, context2d);
    drawGraph(graphCanvas, context2d, 20);

    drawPoint(graphCanvas, context2d, mu);    
}

export function drawPoint(graphCanvas, context2d, mu) {
    context2d.save();

    context2d.fillStyle = "green";

    var x = mu;
    var y = Math.cos(x) + 1; //2 - (1 - cosx)

    x = x / (2 * Math.PI) * (graphCanvas.width - 2 * borderGap) + borderGap;    //now from borderGap to width - borderGap
    y = y / 2 * (graphCanvas.height - 2 * borderGap) + borderGap;

    context2d.beginPath();
    var radius = 4;                     // Arc radius
    var startAngle = 0;                     // Starting point on circle
    var endAngle = 2 * Math.PI;           // End point on circle

    context2d.arc(x, y, radius, startAngle, endAngle);
    context2d.fill();

    context2d.restore();
}

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
    context2d.save();

    context2d.strokeStyle = "red";

    const iMultiplier = 2 * Math.PI / (numberOfPoints - 1);

    const height = graphCanvas.height;
    const width = graphCanvas.width;


    context2d.beginPath();
    for (var i = 0; i < numberOfPoints; i++) {
        var x = iMultiplier * i;
        var y = Math.cos(x) + 1; //2 - (1 -cosx) - to invert, because Y goes down

        x = x / (2 * Math.PI) //now from 0 to 1
            * (width - 2 * borderGap) + borderGap;    //now from borderGap to width - borderGap
        y = y / 2 * (height - 2 * borderGap) + borderGap;

        if (i == 0) {
            context2d.moveTo(x, y);
        }
        else {
            context2d.lineTo(x, y);
        }
    }
    context2d.stroke();

    context2d.restore();
}