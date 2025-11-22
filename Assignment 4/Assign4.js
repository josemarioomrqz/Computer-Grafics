// Jose Marquez
// Assignment 4 - Computer Graphics
// Description of Part 1: Cube uses it's own shaders and geometry.
// Phong-lit cube with a gold material.


// Vertex Shader
const PHONG_VS = `

  // Vertex attributes 
  attribute vec3 a_Position;
  attribute vec3 a_Normal;
  
  // Uniform Matrices
  uniform mat4 u_Model;
  uniform mat4 u_View;
  uniform mat4 u_Proj;
  uniform mat4 u_NormalMatrix;

  // Varying variables to pass to fragment shader 
   varying vec3 v_FragPos;
   varying vec3 v_Normal;

   // Main function
   void main() {
    // World-Space position of the vertex
    vec4 worldPosition = u_Model * vec4(a_Position, 1.0);
    v_FragPos = vec3(worldPosition);
    
    // Trasform the normal to world space
    v_Normal = mat3(u_NormalMatrix) * a_Normal;
    
    // Final position of the vertex in the clip space
    gl_Position = u_Proj * u_View * worldPosition;

}`;

// Fragment shader
const PHONG_FS = `
   // Set the precision for floats 
   precision mediump float;

   
   // Varying variables from vertex shader
    varying vec3 v_FragPos;
    varying vec3 v_Normal;

    // Light properties
    uniform vec3 u_LightPos;
    uniform vec3 u_LightColor;
    uniform vec3 u_AmbientLight;
    uniform vec3 u_ViewPos;

    // Material (gold)
    uniform vec3 u_MaterialAmbient;
    uniform vec3 u_MaterialDiffuse;
    uniform vec3 u_MaterialSpecular;
    uniform float u_Shininess;

    // Main function 

        void main() {
    // Normalize normal
    vec3 N = normalize(v_Normal);

    // Direction from fragment to light
    vec3 L = normalize(u_LightPos - v_FragPos);

    // Diffuse term
    float diff = max(dot(N, L), 0.0);

    //  Camera/View direction 
    vec3 V = normalize(u_ViewPos - v_FragPos);

    // Reflection direction
    vec3 R = reflect(-L, N);
    float spec = 0.0;
    if (diff > 0.0) {
        spec = pow(max(dot(R, V), 0.0), u_Shininess);
    }
        // Combine results
        vec3 ambient  = u_AmbientLight * u_MaterialAmbient;
        vec3 diffuse  = u_LightColor * u_MaterialDiffuse * diff;
        vec3 specular = u_LightColor * u_MaterialSpecular * spec;

        // Final color
        vec3 color = ambient + diffuse + specular;
        gl_FragColor = vec4(color, 1.0);
}
`;

// WebGl Helpers
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

// Create the program 

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

// Matrix Helpers 

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

function makeLookAt(eye, target, up) {
  const ex = eye[0], ey = eye[1], ez = eye[2];
  const tx = target[0], ty = target[1], tz = target[2];
  const ux = up[0], uy = up[1], uz = up[2];

  // f = normalize(target - eye)
  let fx = tx - ex, fy = ty - ey, fz = tz - ez;
  const fLen = Math.hypot(fx, fy, fz) || 1;
  fx /= fLen; fy /= fLen; fz /= fLen;

  // s = normalize(cross(f, up))
  let sx = fy * uz - fz * uy;
  let sy = fz * ux - fx * uz;
  let sz = fx * uy - fy * ux;
  const sLen = Math.hypot(sx, sy, sz) || 1;
  sx /= sLen; sy /= sLen; sz /= sLen;

  // u = cross(s, f)
  const ux2 = sy * fz - sz * fy;
  const uy2 = sz * fx - sx * fz;
  const uz2 = sx * fy - sy * fx;

  // Column-major 4x4
  return new Float32Array([
    sx,  ux2, -fx, 0,
    sy,  uy2, -fy, 0,
    sz,  uz2, -fz, 0,
    -(sx * ex + sy * ey + sz * ez),
    -(ux2 * ex + uy2 * ey + uz2 * ez),
     fx * ex + fy * ey + fz * ez,
    1
  ]);
}

// Cube Geometry with Normals: Unit Cube centered at origin
function buildCubeData() {
  const vertices = [
    [-0.5, -0.5, -0.5], // 0
    [ 0.5, -0.5, -0.5], // 1
    [ 0.5,  0.5, -0.5], // 2
    [-0.5,  0.5, -0.5], // 3
    [-0.5, -0.5,  0.5], // 4
    [ 0.5, -0.5,  0.5], // 5
    [ 0.5,  0.5,  0.5], // 6
    [-0.5,  0.5,  0.5]  // 7
  ];

  // Each entry has triangle vertex indices and its face normal
  const faces = [
    // back (-Z)
    { idx: [0, 1, 2], normal: [0, 0, -1] },
    { idx: [0, 2, 3], normal: [0, 0, -1] },

    // front (+Z)
    { idx: [4, 5, 6], normal: [0, 0, 1] },
    { idx: [4, 6, 7], normal: [0, 0, 1] },

    // left (-X)
    { idx: [0, 4, 7], normal: [-1, 0, 0] },
    { idx: [0, 7, 3], normal: [-1, 0, 0] },

    // right (+X)
    { idx: [1, 5, 6], normal: [1, 0, 0] },
    { idx: [1, 6, 2], normal: [1, 0, 0] },

    // top (+Y)
    { idx: [3, 2, 6], normal: [0, 1, 0] },
    { idx: [3, 6, 7], normal: [0, 1, 0] },

    // bottom (-Y)
    { idx: [0, 1, 5], normal: [0, -1, 0] },
    { idx: [0, 5, 4], normal: [0, -1, 0] }
  ];

  const posArray = [];
  const normArray = [];

  for (const face of faces) {
    const n = face.normal;
    for (let i = 0; i < 3; i++) {
      const v = vertices[face.idx[i]];
      posArray.push(v[0], v[1], v[2]);
      normArray.push(n[0], n[1], n[2]);
    }
  }

  return {
    positions: new Float32Array(posArray),
    normals:   new Float32Array(normArray)
  };
}


// Main entry point for the application
function main() {
  const canvas = document.getElementById("glCanvas");
  if (!canvas) {
    console.error("No canvas with id='glCanvas' found. - Assign4.js:279");
    return;
  }

  // Match drawing buffer to CSS size
  canvas.width  = canvas.clientWidth;
  canvas.height = canvas.clientHeight;

  const gl = canvas.getContext("webgl");
  if (!gl) {
    alert("WebGL not supported");
    return;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(0.05, 0.05, 0.08, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Program
  const program = createProgram(gl, PHONG_VS, PHONG_FS);
  gl.useProgram(program);

  // Attributes
  const a_Position = gl.getAttribLocation(program, "a_Position");
  const a_Normal   = gl.getAttribLocation(program, "a_Normal");

  // Uniforms
  const u_Model         = gl.getUniformLocation(program, "u_Model");
  const u_View          = gl.getUniformLocation(program, "u_View");
  const u_Proj          = gl.getUniformLocation(program, "u_Proj");
  const u_NormalMatrix  = gl.getUniformLocation(program, "u_NormalMatrix");

  const u_LightPos      = gl.getUniformLocation(program, "u_LightPos");
  const u_LightColor    = gl.getUniformLocation(program, "u_LightColor");
  const u_AmbientLight  = gl.getUniformLocation(program, "u_AmbientLight");
  const u_ViewPos       = gl.getUniformLocation(program, "u_ViewPos");

  const u_MatAmbient    = gl.getUniformLocation(program, "u_MaterialAmbient");
  const u_MatDiffuse    = gl.getUniformLocation(program, "u_MaterialDiffuse");
  const u_MatSpecular   = gl.getUniformLocation(program, "u_MaterialSpecular");
  const u_Shininess     = gl.getUniformLocation(program, "u_Shininess");

  // ---- Build cube geometry ----
  const cube = buildCubeData();

  // Position buffer
  const posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(a_Position);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);

  // Normal buffer
  const normBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cube.normals, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(a_Normal);
  gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);

  // ---- Matrices ----
  const aspect = canvas.width / canvas.height;
  const proj   = makePerspective(degToRad(45), aspect, 0.1, 50.0);

  const eye    = [4, 3, 6];   // same feel as Assignment3
  const target = [0, 0, 0];
  const up     = [0, 1, 0];
  const view   = makeLookAt(eye, target, up);

  // Just a slight rotation so we see 3 faces of the cube
  const R = makeRotationY(degToRad(30));
  const T = makeTranslation(0, 0, 0);
  const model = multiplyMat4(T, R);

  // For now (only rotation+translation), we can reuse model as normal matrix
  const normalMatrix = model;

  gl.uniformMatrix4fv(u_Model,        false, model);
  gl.uniformMatrix4fv(u_View,         false, view);
  gl.uniformMatrix4fv(u_Proj,         false, proj);
  gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix);

  // ---- Lighting setup ----
  // White light slightly above-right of the cube
  gl.uniform3f(u_LightPos,   4.0, 4.0, 4.0);
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

  // Camera position for specular
  gl.uniform3f(u_ViewPos, eye[0], eye[1], eye[2]);

  // ---- Gold material (classic OpenGL values) ----
  gl.uniform3f(u_MatAmbient,  0.24725, 0.1995, 0.0745);
  gl.uniform3f(u_MatDiffuse,  0.75164, 0.60648, 0.22648);
  gl.uniform3f(u_MatSpecular, 0.628281, 0.555802, 0.366065);
  gl.uniform1f(u_Shininess,   51.2);

  // ---- Draw ----
  gl.drawArrays(gl.TRIANGLES, 0, cube.positions.length / 3);
}

// Run when the page loads
window.onload = main;