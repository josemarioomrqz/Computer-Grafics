// Jose Marquez 
// Assignment 3 - Computer Graphics 
// Description: 
// Part 1: Create a cube in a 3D space. This part defines geometry and topolgy of a cube



class Cube {
    /**
     * Part 1: a cube in 3D.
     * This class encapsulates:
     *  - geometry  (vertices)
     *  - topology  (faces/triangles)
     *  - a WebGL position buffer built from that data
     */
    constructor(gl) {
        this.gl = gl;

        // --- Geometry: 8 vertices of a unit cube centered at the origin ---
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

        // --- Topology: 12 triangles, indices into this.vertices ---
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

        // Optional: basic transform info you can use later in your scene.
        this.translation = [0, 0, 0];
        this.rotation    = [0, 0, 0]; // could be degrees or radians
        this.scale       = [1, 1, 1];

        // Build the WebGL buffer for this cube's positions.
        this.positionBuffer = this._createPositionBuffer();
    }

    // ----- Helper: flatten geometry + topology into a Float32Array -----
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

    // ----- Helper: create WebGL buffer from the flattened positions -----
    _createPositionBuffer() {
        const gl = this.gl;
        const positions = this._buildTrianglePositionArray();

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        // Number of vertices in this buffer (needed for drawArrays).
        buffer.numVertices = positions.length / 3;
        return buffer;
    }

    /**
     * Draws the cube.
     * Assumes:
     *   - The shader program is already in use (gl.useProgram).
     *   - `positionAttribLocation` is the location of a vec3 position attribute.
     *   - Any matrices (model/view/projection) uniforms are already set.
     */
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

// ---- Minimal step to actually see something on the canvas ----
// Tiny shader pair (position-only, solid color).
const VS_SOURCE = `
attribute vec3 a_Position;
void main() {
  gl_Position = vec4(a_Position, 1.0);
}
`;
const FS_SOURCE = `
precision mediump float;
void main() {
  gl_FragColor = vec4(0.9, 0.4, 0.2, 1.0);
}
`;

// Minimal helpers to compile/link shaders (no extras).
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

// Minimal main() to set up WebGL and draw the cube (no matrices yet).
function main() {
  const canvas = document.getElementById("glCanvas");
  if (!canvas) {
    console.error("No canvas with id='glCanvas' found. - Assignment3.js:172");
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

  // Create and draw the cube
  const cube = new Cube(gl);
  cube.draw(a_Position);
}

// Run when the page finishes loading.
window.onload = main;

