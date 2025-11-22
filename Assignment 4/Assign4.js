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
    uniform int u_LightingMode;

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
        vec3 color;
        if (u_LightingMode == 0) {
            color = ambient + diffuse;
        } else if (u_LightingMode == 1) {
            color = ambient + diffuse + specular;
        } else {
            color = ambient + 0.5 * (diffuse + specular);
        }
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

// Create the program from vertex and fragment shader sources
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

// Translation matrix
function makeTranslation(tx, ty, tz) {
  const m = makeIdentity();
  m[12] = tx;
  m[13] = ty;
  m[14] = tz;
  return m;
}

// Rotation around Y axis
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

// Perspective Projection matrix
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

// LookAt view matrix
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


// Part 2: Additional Solids and Solid Builder
const solids = {
  cube: {
    positions: [
      -0.5, -0.5, -0.5,
       0.5, -0.5, -0.5,
       0.5,  0.5, -0.5,
      -0.5,  0.5, -0.5,
      -0.5, -0.5,  0.5,
       0.5, -0.5,  0.5,
       0.5,  0.5,  0.5,
      -0.5,  0.5,  0.5
    ],
    indices: [
      0, 1, 2, 0, 2, 3,
      4, 5, 6, 4, 6, 7,
      0, 4, 7, 0, 7, 3,
      1, 5, 6, 1, 6, 2,
      3, 2, 6, 3, 6, 7,
      0, 1, 5, 0, 5, 4
    ]
  },
  
  // Tetrahedron
  tetra: {
    positions: [
       0.5,  0.5,  0.5,
      -0.5, -0.5,  0.5,
      -0.5,  0.5, -0.5,
       0.5, -0.5, -0.5
    ],
    indices: [
      0, 1, 2,
      0, 3, 1,
      0, 2, 3,
      1, 3, 2
    ]
  },

  // Octahedron
  octa: {
    positions: [
      0,  0.5,  0,
      0, -0.5,  0,
      0.5, 0,  0,
     -0.5, 0,  0,
      0,  0,  0.5,
      0,  0, -0.5
    ],
    indices: [
      0, 2, 4,
      0, 4, 3,
      0, 3, 5,
      0, 5, 2,
      1, 4, 2,
      1, 3, 4,
      1, 5, 3,
      1, 2, 5
    ]
  },
  
  // Icosahedron
  icosa: {
    positions: (function () {
      const phi = (1 + Math.sqrt(5)) / 2;
      let v = [
        -1,  phi,  0,
         1,  phi,  0,
        -1, -phi,  0,
         1, -phi,  0,
         0, -1,  phi,
         0,  1,  phi,
         0, -1, -phi,
         0,  1, -phi,
         phi,  0, -1,
         phi,  0,  1,
        -phi,  0, -1,
        -phi,  0,  1
      ];
      for (let i = 0; i < v.length; i += 3) {
        const x = v[i], y = v[i + 1], z = v[i + 2];
        const len = Math.sqrt(x * x + y * y + z * z) || 1;
        const r = 0.5 / len;
        v[i] = x * r;
        v[i + 1] = y * r;
        v[i + 2] = z * r;
      }
      return v;
    })(),

    
    indices: [
      0, 11, 5,
      0, 5, 1,
      0, 1, 7,
      0, 7, 10,
      0, 10, 11,
      1, 5, 9,
      5, 11, 4,
      11, 10, 2,
      10, 7, 6,
      7, 1, 8,
      3, 9, 4,
      3, 4, 2,
      3, 2, 6,
      3, 6, 8,
      3, 8, 9,
      4, 9, 5,
      2, 4, 11,
      6, 2, 10,
      8, 6, 7,
      9, 8, 1
    ]
  },

  // Dodecahedron
  dodeca: {
    positions: (function () {
      const phi = (1 + Math.sqrt(5)) / 2;
      const invPhi = 1 / phi;
      let v = [
        -1, -1, -1,
        -1, -1,  1,
        -1,  1, -1,
        -1,  1,  1,
         1, -1, -1,
         1, -1,  1,
         1,  1, -1,
         1,  1,  1,
         0, -invPhi, -phi,
         0, -invPhi,  phi,
         0,  invPhi, -phi,
         0,  invPhi,  phi,
        -invPhi, -phi,  0,
         invPhi, -phi,  0,
        -invPhi,  phi,  0,
         invPhi,  phi,  0,
        -phi,  0, -invPhi,
         phi,  0, -invPhi,
        -phi,  0,  invPhi,
         phi,  0,  invPhi
      ];
      for (let i = 0; i < v.length; i += 3) {
        const x = v[i], y = v[i + 1], z = v[i + 2];
        const len = Math.sqrt(x * x + y * y + z * z) || 1;
        const r = 0.5 / len;
        v[i] = x * r;
        v[i + 1] = y * r;
        v[i + 2] = z * r;
      }
      return v;
    })(),
    indices: (function () {
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
      const out = [];
      for (let k = 0; k < pentagons.length; k++) {
        const p = pentagons[k];
        out.push(p[0], p[1], p[2]);
        out.push(p[0], p[2], p[3]);
        out.push(p[0], p[3], p[4]);
      }
      return out;
    })()
  }
};

// Sphere Geometry Generator

function buildSphereSolid() {
  const radius = 0.5;
  const latBands = 16;
  const lonBands = 16;
  const vertices = [];
  for (let lat = 0; lat <= latBands; lat++) {
    const theta = lat * Math.PI / latBands;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    for (let lon = 0; lon <= lonBands; lon++) {
      const phiAng = lon * 2 * Math.PI / lonBands;
      const sinPhi = Math.sin(phiAng);
      const cosPhi = Math.cos(phiAng);
      const x = radius * sinTheta * cosPhi;
      const y = radius * cosTheta;
      const z = radius * sinTheta * sinPhi;
      vertices.push(x, y, z);
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
      faces.push(first, third, second);
      faces.push(second, third, fourth);
    }
  }
  return { positions: vertices, indices: faces };
}

// Build solid data with computed normals
function buildSolidData(name) {
  let positions;
  let indices;
  if (name === "sphere") {
    const s = buildSphereSolid();
    positions = s.positions;
    indices = s.indices;
  } else {
    const s = solids[name];
    positions = s.positions;
    indices = s.indices;
  }
  const outPos = [];
  const outNorm = [];
  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;
    const v0x = positions[i0],     v0y = positions[i0 + 1],     v0z = positions[i0 + 2];
    const v1x = positions[i1],     v1y = positions[i1 + 1],     v1z = positions[i1 + 2];
    const v2x = positions[i2],     v2y = positions[i2 + 1],     v2z = positions[i2 + 2];
    const e1x = v1x - v0x, e1y = v1y - v0y, e1z = v1z - v0z;
    const e2x = v2x - v0x, e2y = v2y - v0y, e2z = v2z - v0z;
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    const len = Math.hypot(nx, ny, nz) || 1;
    const nnx = nx / len, nny = ny / len, nnz = nz / len;
    outPos.push(v0x, v0y, v0z);
    outPos.push(v1x, v1y, v1z);
    outPos.push(v2x, v2y, v2z);
    outNorm.push(nnx, nny, nnz);
    outNorm.push(nnx, nny, nnz);
    outNorm.push(nnx, nny, nnz);
  }
  return {
    positions: new Float32Array(outPos),
    normals: new Float32Array(outNorm)
  };
}


// Main entry point for the application
function main() {
  const canvas = document.getElementById("glCanvas");
  if (!canvas) {
    console.error("No canvas with id='glCanvas' found. - Assign4.js:548");
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
  const u_LightingMode  = gl.getUniformLocation(program, "u_LightingMode");

// Building Geometry for solids
  let currentSolid = "cube"; // Channging string to each solid name "cube", "tetra", "octa", "icosa", "dodeca", "sphere"
  let solid = buildSolidData(currentSolid);
  const posBuffer = gl.createBuffer();
  const normBuffer = gl.createBuffer();
  function updateGeometry() {
    solid = buildSolidData(currentSolid);
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, solid.positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_Position);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, solid.normals, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_Normal);
    gl.vertexAttribPointer(a_Normal, 3, gl.FLOAT, false, 0, 0);
  }
  updateGeometry();


// Matrices Set up
  const aspect = canvas.width / canvas.height;
  const proj   = makePerspective(degToRad(45), aspect, 0.1, 50.0);

  const eye    = [4, 3, 6];  
  const target = [0, 0, 0];
  const up     = [0, 1, 0];

  let rotationAngle = 0;
  let lightAngle = 0;
  let lightingMode = 0;
  let currentMaterial = 0;
  const materials = [
    { ambient: [0.24725, 0.1995, 0.0745], diffuse: [0.75164, 0.60648, 0.22648], specular: [0.628281, 0.555802, 0.366065], shininess: 51.2 },
    { ambient: [0.135, 0.2225, 0.1575], diffuse: [0.54, 0.89, 0.63], specular: [0.316228, 0.316228, 0.316228], shininess: 12.8 }
  ];

  function applyMaterial() {
    const m = materials[currentMaterial];
    gl.uniform3f(u_MatAmbient,  m.ambient[0],  m.ambient[1],  m.ambient[2]);
    gl.uniform3f(u_MatDiffuse,  m.diffuse[0],  m.diffuse[1],  m.diffuse[2]);
    gl.uniform3f(u_MatSpecular, m.specular[0], m.specular[1], m.specular[2]);
    gl.uniform1f(u_Shininess,   m.shininess);
  }
  applyMaterial();

  // Experimenting and  Having fun with key board controls: 1-6 to change solids, M to change material, and L to change lighting mode
  window.addEventListener("keydown", function(e) {
    if (e.key === "1") currentSolid = "cube";
    else if (e.key === "2") currentSolid = "tetra";
    else if (e.key === "3") currentSolid = "octa";
    else if (e.key === "4") currentSolid = "icosa";
    else if (e.key === "5") currentSolid = "dodeca";
    else if (e.key === "6") currentSolid = "sphere";
    if (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4" || e.key === "5" || e.key === "6") updateGeometry();
    if (e.key === "m" || e.key === "M") {
      currentMaterial = (currentMaterial + 1) % materials.length;
      applyMaterial();
    }
    if (e.key === "l" || e.key === "L") {
      lightingMode = (lightingMode + 1) % 3;
    }
  });

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    rotationAngle += 0.01;
    lightAngle += 0.02;

    const view   = makeLookAt(eye, target, up);

    // Just a slight rotation so we see 3 faces of the cube
    const R = makeRotationY(rotationAngle);
    const T = makeTranslation(0, 0, 0);
    const model = multiplyMat4(T, R);

   // For a cube, the normal matrix is the same as the model matrix
    const normalMatrix = model;

    gl.uniformMatrix4fv(u_Model,        false, model);
    gl.uniformMatrix4fv(u_View,         false, view);
    gl.uniformMatrix4fv(u_Proj,         false, proj);
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix);

    // Lighting set up
    // White light slightly above-right of the cube
    const lightRadius = 4.0;
    const lx = lightRadius * Math.cos(lightAngle);
    const lz = lightRadius * Math.sin(lightAngle);
    const ly = 4.0;
    gl.uniform3f(u_LightPos,   lx, ly, lz);
    gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
    gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2);

    // Camera position for specular
    gl.uniform3f(u_ViewPos, eye[0], eye[1], eye[2]);

    // Matrial Gold Set up 
    gl.uniform1i(u_LightingMode, lightingMode);

    // Draw the cube and other solids
    gl.drawArrays(gl.TRIANGLES, 0, solid.positions.length / 3);

    requestAnimationFrame(render);
  }

  render();
}

// Run when the page loads
window.onload = main;