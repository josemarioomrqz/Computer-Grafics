// Jose Marquez 
// Assignment 3 - Computer Graphics 
// Description: 
// Part 1: Create a cube in a 3D space. This part defines geometry and topolgy of a cube



class Cube {
    constructor(gl) {
        this.gl = gl;

        // --- Geometry: 8 vertices of a unit cube centered at the origin
        // Each vertex is [x, y, z].
        this.vertices = [
            [-0.5, -0.5, -0.5], // 0
            [ 0.5, -0.5, -0.5], // 1
            [ 0.5,  0.5, -0.5], // 2
            [-0.5,  0.5, -0.5], // 3
            [-0.5, -0.5,  0.5], // 4
            [ 0.5, -0.5,  0.5], // 5
            [ 0.5,  0.5,  0.5], // 6
            [-0.5,  0.5,  0.5]  // 7
        ];

        // Topology: 12 triangles, indices into this.vertices
        // Each face of the cube is split into 2 triangles.
        this.faces = [
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

        // Basic Trasformation for scene
        this.translation = [0, 0, 0];
        this.rotation    = [0, 0, 0];
        this.scale       = [1, 1, 1];

        // Build the WebGL buffer for this cube's positions.
        this.positionBuffer = this._createPositionBuffer();
    }

    //  Helper: flatten geometry + topology into a Float32Array
    _buildTrianglePositionArray() {
        const data = [];

        for (let f = 0; f < this.faces.length; f++) {
            const tri = this.faces[f]; // [i0, i1, i2]

            for (let v = 0; v < 3; v++) {
                const idx = tri[v];
                const vert = this.vertices[idx]; // [x, y, z]
                data.push(vert[0], vert[1], vert[2]);
            }
        }

        return new Float32Array(data);
    }

    _createPositionBuffer() {
        // Helper: create WebGL buffer from the flattened positions
        const gl = this.gl;
        const positions = this._buildTrianglePositionArray();

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        // Number of vertices in this buffer 
        buffer.numVertices = positions.length / 3;
        return buffer;
    }

  // Draws the cube
    draw(positionAttribLocation) {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.enableVertexAttribArray(positionAttribLocation);
        gl.vertexAttribPointer(
            positionAttribLocation,
            3,          // x, y, z
            gl.FLOAT,
            false,
            0,
            0
        );

        gl.drawArrays(gl.TRIANGLES, 0, this.positionBuffer.numVertices);
    }

}

//  Part II: basic draw helpers for different solids 

// Generic helper: given geometry (vertices) and topology,
// build a buffer and draw it immediately.
function createAndDrawFromGeometry(gl, positionAttribLocation, vertices, faces) {
  const data = [];
  for (let f = 0; f < faces.length; f++) {
    const tri = faces[f];
    for (let v = 0; v < 3; v++) {
      const idx = tri[v];
      const vert = vertices[idx];
      data.push(vert[0], vert[1], vert[2]);
    }
  }
  const positions = new Float32Array(data);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

  gl.enableVertexAttribArray(positionAttribLocation);
  gl.vertexAttribPointer(
    positionAttribLocation,
    3,
    gl.FLOAT,
    false,
    0,
    0
  );

  gl.drawArrays(gl.TRIANGLES, 0, positions.length / 3);
}

// DrawCube: uses the Cube class from Part I
function DrawCube(gl, positionAttribLocation) {
  const cube = new Cube(gl);
  cube.draw(positionAttribLocation);
}

// DrawTetrahedron: define a regular tetrahedron centered at the origin.
// Vertices are chosen as four of the corners of a cube, scaled to ±0.5.
function DrawTetrahedron(gl, positionAttribLocation) {
  const vertices = [
    [ 0.5,  0.5,  0.5],  // 0
    [-0.5, -0.5,  0.5],  // 1
    [-0.5,  0.5, -0.5],  // 2
    [ 0.5, -0.5, -0.5]   // 3
  ];

  // Four triangular faces
  const faces = [
    [0, 1, 2],
    [0, 3, 1],
    [0, 2, 3],
    [1, 3, 2]
  ];

  createAndDrawFromGeometry(gl, positionAttribLocation, vertices, faces);
}

// DrawOctahedron: a regular octahedron centered at the origin.
function DrawOctahedron(gl, positionAttribLocation) {
  // Six vertices on the axes, scaled to 0.5
  const vertices = [
    [ 0,  0.5,  0],  // 0 top
    [ 0, -0.5,  0],  // 1 bottom
    [ 0.5, 0,  0],   // 2 +X
    [-0.5, 0,  0],   // 3 -X
    [ 0,  0,  0.5],  // 4 +Z
    [ 0,  0, -0.5]   // 5 -Z
  ];

  // Eight triangular faces
  const faces = [
    [0, 2, 4],
    [0, 4, 3],
    [0, 3, 5],
    [0, 5, 2],
    [1, 4, 2],
    [1, 3, 4],
    [1, 5, 3],
    [1, 2, 5]
  ];

  createAndDrawFromGeometry(gl, positionAttribLocation, vertices, faces);
}

// DrawIcosahedron: regular icosahedron using golden ratio coordinates.
function DrawIcosahedron(gl, positionAttribLocation) {
  const phi = (1 + Math.sqrt(5)) / 2;

  // Standard 12-vertex icosahedron layout
  let vertices = [
    [-1,  phi,  0],
    [ 1,  phi,  0],
    [-1, -phi,  0],
    [ 1, -phi,  0],

    [ 0, -1,  phi],
    [ 0,  1,  phi],
    [ 0, -1, -phi],
    [ 0,  1, -phi],

    [ phi,  0, -1],
    [ phi,  0,  1],
    [-phi,  0, -1],
    [-phi,  0,  1]
  ];

  // Optionally normalize vertices to fit roughly in a unit sphere radius 0.5
  vertices = vertices.map(v => {
    const x = v[0], y = v[1], z = v[2];
    const len = Math.sqrt(x*x + y*y + z*z) || 1;
    const r = 0.5 / len;
    return [x * r, y * r, z * r];
  });

  // 20 triangular faces (standard indexing for icosahedron)
  const faces = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],

    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],

    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],

    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1]
  ];

  createAndDrawFromGeometry(gl, positionAttribLocation, vertices, faces);
}

// DrawDodecahedron: regular dodecahedron built from a common coordinate set.
// Uses 20 vertices and triangulated pentagonal faces.
function DrawDodecahedron(gl, positionAttribLocation) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const invPhi = 1 / phi;

  // 20 vertices
  let vertices = [
    // 8 vertices of a cube
    [-1, -1, -1],
    [-1, -1,  1],
    [-1,  1, -1],
    [-1,  1,  1],
    [ 1, -1, -1],
    [ 1, -1,  1],
    [ 1,  1, -1],
    [ 1,  1,  1],

    // 12 vertices using phi and 1/phi
    [ 0, -invPhi, -phi],
    [ 0, -invPhi,  phi],
    [ 0,  invPhi, -phi],
    [ 0,  invPhi,  phi],

    [-invPhi, -phi,  0],
    [ invPhi, -phi,  0],
    [-invPhi,  phi,  0],
    [ invPhi,  phi,  0],

    [-phi,  0, -invPhi],
    [ phi,  0, -invPhi],
    [-phi,  0,  invPhi],
    [ phi,  0,  invPhi]
  ];

  // Normalize to fit roughly inside radius 0.5
  vertices = vertices.map(v => {
    const x = v[0], y = v[1], z = v[2];
    const len = Math.sqrt(x*x + y*y + z*z) || 1;
    const r = 0.5 / len;
    return [x * r, y * r, z * r];
  });

  // 12 pentagonal faces, triangulated as (v0,v1,v2) and (v0,v2,v3) and (v0,v3,v4)
  const pentagons = [
    [0,  8, 10, 16, 12],
    [0, 12, 13, 4,  8],
    [0, 16, 18, 2, 10],
    [7, 11, 9, 5, 19],
    [7, 19, 17, 6, 15],
    [7, 15, 14, 3, 11],
    [1, 9, 11, 3, 18],
    [1, 18, 16, 10, 8],
    [1, 8, 4, 13, 9],
    [2, 14, 15, 6, 17],
    [2, 17, 19, 5, 12],
    [2, 12, 16, 18, 14]
  ];

  const faces = [];
  for (const p of pentagons) {
    // fan triangulation around p[0]
    faces.push([p[0], p[1], p[2]]);
    faces.push([p[0], p[2], p[3]]);
    faces.push([p[0], p[3], p[4]]);
  }

  createAndDrawFromGeometry(gl, positionAttribLocation, vertices, faces);
}

// DrawSphere: simple latitude-longitude sphere centered at origin.
function DrawSphere(gl, positionAttribLocation) {
  const radius = 0.5;
  const latBands = 16;
  const lonBands = 16;

  const vertices = [];
  for (let lat = 0; lat <= latBands; lat++) {
    const theta = lat * Math.PI / latBands; // 0..π
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= lonBands; lon++) {
      const phiAng = lon * 2 * Math.PI / lonBands; // 0..2π
      const sinPhi = Math.sin(phiAng);
      const cosPhi = Math.cos(phiAng);

      const x = radius * sinTheta * cosPhi;
      const y = radius * cosTheta;
      const z = radius * sinTheta * sinPhi;

      vertices.push([x, y, z]);
    }
  }

  const faces = [];
  const cols = lonBands + 1;
  for (let lat = 0; lat < latBands; lat++) {
    for (let lon = 0; lon < lonBands; lon++) {
      const first = lat * cols + lon;
      const second = first + 1;
      const third = (lat + 1) * cols + lon;
      const fourth = third + 1;

      faces.push([first, third, second]);
      faces.push([second, third, fourth]);
    }
  }

  createAndDrawFromGeometry(gl, positionAttribLocation, vertices, faces);
}

// Minimal step to actually see something on the canvas 
// Tiny shader pair 
const VS_SOURCE = `
attribute vec3 a_Position;
uniform mat4 u_MVP;
void main() {
  gl_Position = u_MVP * vec4(a_Position, 1.0);
}
`;
const FS_SOURCE = `
precision mediump float;
void main() {
  gl_FragColor = vec4(0.9, 0.4, 0.2, 1.0);
}
`;

// Minimal helpers to compile/link shaders
function compileShader(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error("Shader compile error: " + info);
  }
  return sh;
}
function createProgram(gl, vsSource, fsSource) {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(prog);
    gl.deleteProgram(prog);
    throw new Error("Program link error: " + info);
  }
  return prog;
}

// Minimal 4x4 matrix helpers for MVP 
function degToRad(d) {
  return d * Math.PI / 180;
}

function makeIdentity() {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ]);
}

// Column-major 4x4 multiply: out = a * b
function multiplyMat4(a, b) {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[row + k * 4] * b[k + col * 4];
      }
      out[row + col * 4] = sum;
    }
  }
  return out;
}

function makeTranslation(tx, ty, tz) {
  const m = makeIdentity();
  m[12] = tx;
  m[13] = ty;
  m[14] = tz;
  return m;
}

function makeRotationX(angleRad) {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return new Float32Array([
    1, 0, 0, 0,
    0,  c, s, 0,
    0, -s, c, 0,
    0, 0, 0, 1
  ]);
}

function makeRotationY(angleRad) {
  const c = Math.cos(angleRad);
  const s = Math.sin(angleRad);
  return new Float32Array([
     c, 0, -s, 0,
     0, 1,  0, 0,
     s, 0,  c, 0,
     0, 0,  0, 1
  ]);
}

function makePerspective(fovRad, aspect, near, far) {
  const f = 1.0 / Math.tan(fovRad / 2);
  const rangeInv = 1.0 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * 2 * rangeInv, 0
  ]);
}

// Minimal main() to set up WebGL and draw the cube
function main() {
  const canvas = document.getElementById("glCanvas");
  if (!canvas) {
    console.error("No canvas with id='glCanvas' found. - Assignment3.js:489");
    return;
  }

  // Match drawing buffer to CSS size so viewport is correct.
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const gl = canvas.getContext("webgl");
  if (!gl) {
    alert("WebGL not supported");
    return;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.05, 0.05, 0.08, 1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const program = createProgram(gl, VS_SOURCE, FS_SOURCE);
  gl.useProgram(program);

  const a_Position = gl.getAttribLocation(program, "a_Position");

  const u_MVP = gl.getUniformLocation(program, "u_MVP");

  // Build a simple MVP matrix: perspective * view * model
  const aspect = canvas.width / canvas.height;
  const proj = makePerspective(degToRad(45), aspect, 0.1, 10.0);

  // View: move the camera back a bit on -Z
  const view = makeTranslation(0, 0, -2.5);

  // Model: rotate cube around X and Y so it looks 3D
  const rotX = makeRotationX(degToRad(30));
  const rotY = makeRotationY(degToRad(30));
  const model = multiplyMat4(rotY, rotX);

  const vp = multiplyMat4(proj, view);
  const mvp = multiplyMat4(vp, model);

  gl.uniformMatrix4fv(u_MVP, false, mvp);

  // Create and draw the cube via the Part II function
  DrawCube(gl, a_Position);
}

// Run when the page finishes loading.
window.onload = main;