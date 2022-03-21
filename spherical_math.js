// !!!MATH!!!

//todo: учесть разницу между API
/* 
function bananaProjectionMatrixFrontHalf(fovY, aspect, z0)
{
  const height = 1 / Math.tan(fovY / 2);
  const width = height / aspect;
  return Matrix(
    width, 0., 0., 0.,
    0., height, 0., 0.,
    0., 0., 0.25, 1.,
    0., 0., -z0 / 4., 0);
}
*/

// rotation around plane XY which stays invariant
function sphericalRotationZW(d) // знаки поменял в сравнении с DX - проверить!
{ 
  return mat4.fromValues(
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, Math.cos(d), -Math.sin(d),
    0, 0, Math.sin(d), Math.cos(d));
}

function sphericalRotationXW(d) // знаки поменял в сравнении с DX - проверить!
{ 
  return mat4.fromValues(
    Math.cos(d), 0, 0, -Math.sin(d),
    0, 1, 0, 0,
    0, 0, 1, 0,
    Math.sin(d), 0, 0, Math.cos(d));
}