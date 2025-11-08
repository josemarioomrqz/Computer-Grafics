// Jose Marquez 
// Assigmnet  - Computer Graphics
// Description:

"use strict";

// ========== Part I: Create a cube (geometry + topology) ==========
//
// This file defines the geometry (vertices) and topology (faces/triangles)
// for a cube, and provides helper functions to build a WebGL buffer and
// draw the cube. Later parts of the assignment (other solids + full scene)
// can be added below.

// Geometry: 8 unique vertices of a unit cube centered at the origin.
const cubeVertices = [
  [-0.5, -0.5, -0.5], // 0
  [ 0.5, -0.5, -0.5], // 1
  [ 0.5,  0.5, -0.5], // 2
  [-0.5,  0.5, -0.5], // 3
  [-0.5, -0.5,  0.5], // 4
  [ 0.5, -0.5,  0.5], // 5
  [ 0.5,  0.5,  0.5], // 6
  [-0.5,  0.5,  0.5]  // 7
];

// Topology: 12 triangles, each referencing vertices by index.
// Each face of the cube is split into 2 triangles.
const cubeFaces = [
  // back (-Z)
  [0, 1, 2],
  [0, 2, 3],

  // front (+Z)
  [4, 5, 6],
  [4, 6, 7],

  // left (-X)
  [0, 4, 7],
  [0, 7, 3],

  // right (+X)
  [1, 5, 6],
  [1, 6, 2],

  // top (+Y)
  [3, 2, 6],
  [3, 6, 7],

  // bottom (-Y)
  [0, 1, 5],
  [0, 5, 4]
];

/**
 * Helper: flattens geometry + topology into a Float32Array of positions
 * in triangle-list order: [x0, y0, z0, x1, y1, z1, ...]
 *
 * vertices: array of [x, y, z]
 * faces: array of [i0, i1, i2] indices into vertices
 */
function buildTrianglePositionArray(vertices, faces) {
  const data = [];

  for (let f = 0; f < faces.length; f++) {
    const tri = faces[f]; // [i0, i1, i2]

    for (let v = 0; v < 3; v++) {
      const idx = tri[v];
      const vert = vertices[idx]; // [x, y, z]
      data.push(vert[0], vert[1], vert[2]);
    }
  }

  return new Float32Array(data);
}

/**
 * Creates and returns a WebGL buffer containing the cube's vertex positions.
 *
 * gl: WebGLRenderingContext
 *
 * The returned buffer has a .numVertices property for convenience.
 */
function createCubePositionBuffer(gl) {
  const positions = buildTrianglePositionArray(cubeVertices, cubeFaces);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  // Store how many vertices we have so drawCube can use it.
  buffer.numVertices = positions.length / 3;
  return buffer;
}

/**
 * Simple draw helper for the cube.
 *
 * Assumes:
 *   - `positionAttribLocation` is the location of your vec3 position attribute
 *   - you've already called gl.useProgram(...) for your shader program
 *   - you've already set your matrices (model/view/projection) uniforms
 */
function drawCube(gl, cubeBuffer, positionAttribLocation) {
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.enableVertexAttribArray(positionAttribLocation);
  gl.vertexAttribPointer(
    positionAttribLocation,
    3,           // 3 components per vertex (x, y, z)
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.drawArrays(gl.TRIANGLES, 0, cubeBuffer.numVertices);
}

// Later parts (other Platonic solids + sphere, and full 3D scene) will go below this.