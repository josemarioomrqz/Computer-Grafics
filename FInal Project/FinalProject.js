// Jose Marquez
// Final Project - MSU Texas Tennis Center 
// Description: This project implements a vivid 3D model of the MSU Texas Tennis Center using WebGL.



// Minimal vector utilities 
function vec3(x, y, z) {
    return [x, y, z];
}

function v3sub(a,b) {
    return [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
}

function v3cross(a,b){
  return [
    a[1]*b[2]-a[2]*b[1],
    a[2]*b[0]-a[0]*b[2],
    a[0]*b[1]-a[1]*b[0]
  ];
}

function v3len(a){ return Math.hypot(a[0],a[1],a[2]); }


function v3norm(a){
  const l = v3len(a) || 1;
  return [a[0]/l, a[1]/l, a[2]/l];
}

// Column major 4x4 matrix utilities
function mat4Identity(){
  return [
    1,0,0,0,
    0,1,0,0,
    0,0,1,0,
    0,0,0,1
  ];
}
function mat4Mul(a,b){
  const out = new Array(16).fill(0);
  for(let c=0;c<4;c++){
    for(let r=0;r<4;r++){
      out[c*4+r] =
        a[0*4+r]*b[c*4+0] +
        a[1*4+r]*b[c*4+1] +
        a[2*4+r]*b[c*4+2] +
        a[3*4+r]*b[c*4+3];
    }
  }
  return out;
}
function mat4Translate(tx,ty,tz){
  const m = mat4Identity();
  m[12]=tx; m[13]=ty; m[14]=tz;
  return m;
}
function mat4Scale(sx,sy,sz){
  const m = mat4Identity();
  m[0]=sx; m[5]=sy; m[10]=sz;
  return m;
}
function mat4RotateY(rad){
  const c=Math.cos(rad), s=Math.sin(rad);
  const m = mat4Identity();
  m[0]= c;  m[8]= s;
  m[2]=-s;  m[10]=c;
  return m;
}
function mat4RotateX(rad){
  const c=Math.cos(rad), s=Math.sin(rad);
  const m = mat4Identity();
  m[5]= c;  m[9]=-s;
  m[6]= s;  m[10]=c;
  return m;
}
function mat4Perspective(fovy, aspect, near, far){
  const f = 1/Math.tan(fovy/2);
  const nf = 1/(near-far);
  const m = new Array(16).fill(0);
  m[0]=f/aspect;
  m[5]=f;
  m[10]=(far+near)*nf;
  m[11]=-1;
  m[14]=(2*far*near)*nf;
  return m;
}
function mat4LookAt(eye, target, up){
  const z = v3norm(v3sub(eye,target)); // forward
  const x = v3norm(v3cross(up, z));
  const y = v3cross(z, x);

  const m = mat4Identity();
  m[0]=x[0]; m[4]=x[1]; m[8]=x[2];
  m[1]=y[0]; m[5]=y[1]; m[9]=y[2];
  m[2]=z[0]; m[6]=z[1]; m[10]=z[2];
  m[12]=-(x[0]*eye[0]+x[1]*eye[1]+x[2]*eye[2]);
  m[13]=-(y[0]*eye[0]+y[1]*eye[1]+y[2]*eye[2]);
  m[14]=-(z[0]*eye[0]+z[1]*eye[1]+z[2]*eye[2]);
  return m;
}


// Geometry generation functions
function createBox(){
  // Unit cube centered at origin.
  const p = [
    // +X
    0.5,-0.5,-0.5,  0.5, 0.5,-0.5,  0.5, 0.5, 0.5,  0.5,-0.5, 0.5,
    // -X
   -0.5,-0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5,-0.5, -0.5,-0.5,-0.5,
    // +Y
   -0.5, 0.5,-0.5, -0.5, 0.5, 0.5,  0.5, 0.5, 0.5,  0.5, 0.5,-0.5,
    // -Y
   -0.5,-0.5, 0.5, -0.5,-0.5,-0.5,  0.5,-0.5,-0.5,  0.5,-0.5, 0.5,
    // +Z
   -0.5,-0.5, 0.5,  0.5,-0.5, 0.5,  0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    // -Z
    0.5,-0.5,-0.5, -0.5,-0.5,-0.5, -0.5, 0.5,-0.5,  0.5, 0.5,-0.5,
  ];
  const n = [
    // +X
    1,0,0, 1,0,0, 1,0,0, 1,0,0,
    // -X
   -1,0,0,-1,0,0,-1,0,0,-1,0,0,
    // +Y
    0,1,0, 0,1,0, 0,1,0, 0,1,0,
    // -Y
    0,-1,0,0,-1,0,0,-1,0,0,-1,0,
    // +Z
    0,0,1, 0,0,1, 0,0,1, 0,0,1,
    // -Z
    0,0,-1,0,0,-1,0,0,-1,0,0,-1,
  ];
  const idx = [];
  for(let f=0; f<6; f++){
    const base = f*4;
    idx.push(base+0, base+1, base+2, base+0, base+2, base+3);
  }
  return { positions: new Float32Array(p), normals: new Float32Array(n), indices: new Uint16Array(idx) };
}

function createPlane(){
  // Unit plane (XZ) centered at origin, Y=0.
  const p = [
    -0.5,0,-0.5,
     0.5,0,-0.5,
     0.5,0, 0.5,
    -0.5,0, 0.5
  ];
  const n = [
    0,1,0, 0,1,0, 0,1,0, 0,1,0
  ];
  const idx = [0,1,2, 0,2,3];
  return { positions: new Float32Array(p), normals: new Float32Array(n), indices: new Uint16Array(idx) };
}

function createCylinder(segments=16){
  // Unit-height cylinder centered at origin, radius 0.5, height 1.
  const positions = [];
  const normals = [];
  const indices = [];

  // Side vertices
  for(let i=0;i<=segments;i++){
    const t = (i/segments)*Math.PI*2;
    const x = Math.cos(t)*0.5;
    const z = Math.sin(t)*0.5;

    // bottom
    positions.push(x, -0.5, z);
    normals.push(Math.cos(t), 0, Math.sin(t));
    // top
    positions.push(x,  0.5, z);
    normals.push(Math.cos(t), 0, Math.sin(t));
  }

  const stride = 2; // two vertices per segment step
  for(let i=0;i<segments;i++){
    const a = i*stride;
    const b = a+1;
    const c = a+stride;
    const d = a+stride+1;
    // two triangles per quad
    indices.push(a, b, d, a, d, c);
  }

  // Caps (simple fan)
  const baseIndex = positions.length/3;

  // bottom center
  positions.push(0, -0.5, 0);
  normals.push(0, -1, 0);
  // bottom ring
  for(let i=0;i<=segments;i++){
    const t = (i/segments)*Math.PI*2;
    positions.push(Math.cos(t)*0.5, -0.5, Math.sin(t)*0.5);
    normals.push(0, -1, 0);
  }
  for(let i=0;i<segments;i++){
    indices.push(
      baseIndex,
      baseIndex+1+i+1,
      baseIndex+1+i
    );
  }

  const topBase = positions.length/3;

  // top center
  positions.push(0, 0.5, 0);
  normals.push(0, 1, 0);
  // top ring
  for(let i=0;i<=segments;i++){
    const t = (i/segments)*Math.PI*2;
    positions.push(Math.cos(t)*0.5, 0.5, Math.sin(t)*0.5);
    normals.push(0, 1, 0);
  }
  for(let i=0;i<segments;i++){
    indices.push(
      topBase,
      topBase+1+i,
      topBase+1+i+1
    );
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint16Array(indices)
  };
}

// WebGL helpers
function createShader(gl, type, src){
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){
    throw new Error(gl.getShaderInfoLog(s) || "Shader compile error");
  }
  return s;
}
function createProgram(gl, vsSrc, fsSrc){
  const vs = createShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if(!gl.getProgramParameter(p, gl.LINK_STATUS)){
    throw new Error(gl.getProgramInfoLog(p) || "Program link error");
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return p;
}
function createMesh(gl, geom){
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // positions
  const vboPos = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vboPos);
  gl.bufferData(gl.ARRAY_BUFFER, geom.positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

  // normals (not used in Part A shading, but ready for Part B)
  const vboNor = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vboNor);
  gl.bufferData(gl.ARRAY_BUFFER, geom.normals, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);

  // indices
  const ibo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geom.indices, gl.STATIC_DRAW);

  gl.bindVertexArray(null);

  return {
    vao,
    indexCount: geom.indices.length
  };
}

// Shaders
const VS = `#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;

uniform mat4 uModel;
uniform mat4 uView;
uniform mat4 uProj;

out vec3 vNormalWorld;

void main(){
  // For Part A we won't light yet, but we pass a normal for later.
  // Approx world normal (ok for now since we use uniform scale in this part).
  vNormalWorld = aNormal;
  gl_Position = uProj * uView * uModel * vec4(aPosition, 1.0);
}
`;

const FS = `#version 300 es
precision highp float;

uniform vec3 uColor;

out vec4 outColor;

void main(){
  // Unlit color for Part A modeling focus.
  outColor = vec4(uColor, 1.0);
}
`;

// Scene management
const Scene = {
  objects: []
};

function addObject(mesh, model, color){
  Scene.objects.push({ mesh, model, color });
}

// Build the tennis center scene
function buildScene(gl, meshes){
  Scene.objects.length = 0;

  //Ground 
  {
    const model = mat4Mul(
      mat4Translate(0, -0.01, 0),
      mat4Scale(60, 1, 40)
    );
    addObject(meshes.plane, model, [0.18, 0.18, 0.20]);
  }

  // Sidewalk area
  {
    const model = mat4Mul(
      mat4Translate(6, 0.0, 6),
      mat4Scale(18, 1, 6)
    );
    addObject(meshes.plane, model, [0.55, 0.55, 0.57]);
  }

  // Curb line (thin raised strip)
  {
    const model = mat4Mul(
      mat4Translate(6, 0.02, 3.0),
      mat4Scale(18, 0.06, 0.3)
    );
    addObject(meshes.box, model, [0.35, 0.35, 0.36]);
  }

  // Building main brick block 
  {
    const model = mat4Mul(
      mat4Translate(12, 1.6, 6),
      mat4Scale(10, 3.2, 6)
    );
    addObject(meshes.box, model, [0.55, 0.32, 0.20]); // brick-ish
  }

  // Roof block
  {
    const model = mat4Mul(
      mat4Translate(12, 3.5, 6),
      mat4Scale(10.6, 0.6, 6.6)
    );
    addObject(meshes.box, model, [0.20, 0.15, 0.12]);
  }

  // Front awning lip
  {
    const model = mat4Mul(
      mat4Translate(12, 2.6, 2.6),
      mat4Scale(10.6, 0.3, 0.6)
    );
    addObject(meshes.box, model, [0.18, 0.18, 0.18]);
  }

  // Doors (two dark rectangles) 
  {
    const door1 = mat4Mul(
      mat4Translate(9.5, 1.1, 2.3),
      mat4Scale(1.1, 2.2, 0.12)
    );
    addObject(meshes.box, door1, [0.08, 0.08, 0.09]);

    const door2 = mat4Mul(
      mat4Translate(14.5, 1.1, 2.3),
      mat4Scale(1.1, 2.2, 0.12)
    );
    addObject(meshes.box, door2, [0.08, 0.08, 0.09]);
  }

  //  Building sign board: "MSU TENNIS CENTER" 
  {
    const model = mat4Mul(
      mat4Translate(12, 3.0, 2.3),
      mat4Scale(5.8, 0.7, 0.12)
    );
    addObject(meshes.box, model, [0.75, 0.75, 0.78]);
  }

  //Left fence wall area 
  // Position: left side of the scene.
  const fenceStartX = -6.0;
  const fenceEndX   =  4.0;
  const fenceZ      =  6.0;
  const postSpacing =  1.0;

  // Vertical posts
  for(let x = fenceStartX; x <= fenceEndX + 0.001; x += postSpacing){
    const model = mat4Mul(
      mat4Translate(x, 1.2, fenceZ),
      mat4Scale(0.08, 2.4, 0.08)
    );
    addObject(meshes.box, model, [0.25, 0.27, 0.30]);
  }

  // Top rail
  {
    const len = (fenceEndX - fenceStartX) + 0.2;
    const model = mat4Mul(
      mat4Translate((fenceStartX+fenceEndX)/2, 2.2, fenceZ),
      mat4Scale(len, 0.06, 0.06)
    );
    addObject(meshes.box, model, [0.22, 0.24, 0.27]);
  }

  // Mid rail
  {
    const len = (fenceEndX - fenceStartX) + 0.2;
    const model = mat4Mul(
      mat4Translate((fenceStartX+fenceEndX)/2, 1.2, fenceZ),
      mat4Scale(len, 0.06, 0.06)
    );
    addObject(meshes.box, model, [0.22, 0.24, 0.27]);
  }

  // Fence "panel" 
  {
    const len = (fenceEndX - fenceStartX);
    const model = mat4Mul(
      mat4Translate((fenceStartX+fenceEndX)/2, 1.2, fenceZ),
      mat4Scale(len, 2.2, 0.02)
    );
    addObject(meshes.box, model, [0.18, 0.20, 0.22]);
  }

  // "Tennis Courts" rectangle sign on the fence 
  {
    const model = mat4Mul(
      mat4Translate(-1.0, 1.6, fenceZ - 0.08),
      mat4Scale(1.8, 0.7, 0.05)
    );
    addObject(meshes.box, model, [0.85, 0.85, 0.86]);
  }

  //  Court area behind fence 
  {
    const model = mat4Mul(
      mat4Translate(-2, 0.0, 12),
      mat4Scale(18, 1, 12)
    );
    addObject(meshes.plane, model, [0.10, 0.35, 0.18]);
  }

  // Court lines (thin white strips) 
  {
    const line1 = mat4Mul(
      mat4Translate(-2, 0.01, 12),
      mat4Scale(16, 0.02, 0.12)
    );
    addObject(meshes.box, line1, [0.95, 0.95, 0.95]);

    const line2 = mat4Mul(
      mat4Translate(-2, 0.01, 8),
      mat4Scale(16, 0.02, 0.12)
    );
    addObject(meshes.box, line2, [0.95, 0.95, 0.95]);

    const line3 = mat4Mul(
      mat4Translate(-10, 0.01, 10),
      mat4Scale(0.12, 0.02, 8)
    );
    addObject(meshes.box, line3, [0.95, 0.95, 0.95]);

    const line4 = mat4Mul(
      mat4Translate(6, 0.01, 10),
      mat4Scale(0.12, 0.02, 8)
    );
    addObject(meshes.box, line4, [0.95, 0.95, 0.95]);
  }

  // Light poles in the background 
 
  const polePositions = [
    [-14, 3.0, 18],
    [-6,  3.0, 20],
    [ 2,  3.0, 18],
    [ 10, 3.0, 20]
  ];
  for(const [x,y,z] of polePositions){
    const model = mat4Mul(
      mat4Translate(x, 2.5, z),
      mat4Scale(0.25, 5.0, 0.25)
    );
    addObject(meshes.cyl, model, [0.20, 0.20, 0.22]);

    const head = mat4Mul(
      mat4Translate(x, 5.3, z),
      mat4Scale(1.2, 0.25, 1.2)
    );
    addObject(meshes.box, head, [0.35, 0.35, 0.38]);
  }
}

// Camaera Controls
const Camera = {
  yaw: -0.6,
  pitch: -0.25,
  distance: 28,
  target: [2, 1.2, 8],
  dragging: false,
  lastX: 0,
  lastY: 0
};

function resetCamera(){
  Camera.yaw = -0.6;
  Camera.pitch = -0.25;
  Camera.distance = 28;
  Camera.target = [2, 1.2, 8];
}


// Main
  
const canvas = document.getElementById("glcanvas");
const gl = canvas.getContext("webgl2", { antialias: true });
if(!gl){
  alert("WebGL2 not supported in this browser.");
  throw new Error("WebGL2 not supported");
}

// Resize handling
function resize(){
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.floor(canvas.clientWidth * dpr);
  const h = Math.floor(canvas.clientHeight * dpr);
  if(canvas.width !== w || canvas.height !== h){
    canvas.width = w; canvas.height = h;
  }
  gl.viewport(0,0,canvas.width,canvas.height);
}
window.addEventListener("resize", resize);

// Create program
const program = createProgram(gl, VS, FS);
gl.useProgram(program);

// Uniform locations
const uModel = gl.getUniformLocation(program, "uModel");
const uView  = gl.getUniformLocation(program, "uView");
const uProj  = gl.getUniformLocation(program, "uProj");
const uColor = gl.getUniformLocation(program, "uColor");

// Create meshes
const meshes = {
  box: createMesh(gl, createBox()),
  plane: createMesh(gl, createPlane()),
  cyl: createMesh(gl, createCylinder(18))
};

// Build scene geometry instances
buildScene(gl, meshes);

// GL state
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.cullFace(gl.BACK);

// Mouse controls
canvas.addEventListener("mousedown", (e)=>{
  Camera.dragging = true;
  Camera.lastX = e.clientX;
  Camera.lastY = e.clientY;
});
window.addEventListener("mouseup", ()=>{
  Camera.dragging = false;
});
window.addEventListener("mousemove", (e)=>{
  if(!Camera.dragging) return;
  const dx = e.clientX - Camera.lastX;
  const dy = e.clientY - Camera.lastY;
  Camera.lastX = e.clientX;
  Camera.lastY = e.clientY;

  Camera.yaw   += dx * 0.005;
  Camera.pitch += dy * 0.005;
  Camera.pitch = Math.max(-1.2, Math.min(0.2, Camera.pitch));
});

// Zoom
canvas.addEventListener("wheel", (e)=>{
  e.preventDefault();
  Camera.distance *= (e.deltaY > 0) ? 1.08 : 0.92;
  Camera.distance = Math.max(8, Math.min(80, Camera.distance));
}, { passive: false });

// Keyboard
window.addEventListener("keydown", (e)=>{
  if(e.key.toLowerCase() === "r"){
    resetCamera();
  }
});


// Compute camera view matrix
function getViewMatrix(){
  const cy = Math.cos(Camera.yaw), sy = Math.sin(Camera.yaw);
  const cp = Math.cos(Camera.pitch), sp = Math.sin(Camera.pitch);

  const x = Camera.target[0] + Camera.distance * cp * sy;
  const y = Camera.target[1] + Camera.distance * sp;
  const z = Camera.target[2] + Camera.distance * cp * cy;

  const eye = [x,y,z];
  return mat4LookAt(eye, Camera.target, [0,1,0]);
}

// Render loop
function render(){
  resize();

  gl.clearColor(0.06, 0.06, 0.08, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const aspect = canvas.width / Math.max(1, canvas.height);
  const proj = mat4Perspective(60 * Math.PI/180, aspect, 0.1, 200);
  const view = getViewMatrix();

  gl.useProgram(program);
  gl.uniformMatrix4fv(uView, false, new Float32Array(view));
  gl.uniformMatrix4fv(uProj, false, new Float32Array(proj));

  for(const obj of Scene.objects){
    gl.bindVertexArray(obj.mesh.vao);
    gl.uniformMatrix4fv(uModel, false, new Float32Array(obj.model));
    gl.uniform3fv(uColor, new Float32Array(obj.color));
    gl.drawElements(gl.TRIANGLES, obj.mesh.indexCount, gl.UNSIGNED_SHORT, 0);
  }
  gl.bindVertexArray(null);

  requestAnimationFrame(render);
}
resetCamera();
render();