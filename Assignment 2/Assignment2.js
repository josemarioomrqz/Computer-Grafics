// Jose Marquez
// Assignment 2 - Computer Graphics
// Create a unit square (1x1) in a 3D space


class Square {
    constructor(gl) {
        this.gl = gl;
        this.initBuffers();
    }

    initBuffers() {
        const gl = this.gl;
        this.vertices = new Float32Array([
            -0.5,  0.5, 0, // Top-Left vertex 
             0.5,  0.5, 0, // Top-Right vertex 
            -0.5, -0.5, 0, // Bottom-Left vertex 
             0.5, -0.5, 0  // Bottom-Right vertex
        ]);

        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this.vertices, gl.STATIC_DRAW);
        this.vertexCount = 4;

    }
    // CPU path: pre-transform the 4 vertices and upload before drawing
    drawCPU(programInfo, model) {
        const gl = this.gl;
        const src = this.vertices; // Float32Array length 12
        const out = new Float32Array(src.length);

        // multiply vec4(x,y,z,1) by model (column-major)
        for (let i = 0; i < src.length; i += 3) {
            const x = src[i], y = src[i+1], z = src[i+2];
            out[i]   = model[0]*x + model[4]*y + model[8]*z  + model[12];
            out[i+1] = model[1]*x + model[5]*y + model[9]*z  + model[13];
            out[i+2] = model[2]*x + model[6]*y + model[10]*z + model[14];
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, out);

        gl.vertexAttribPointer(
            programInfo.attribLocations.position,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.position);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexCount);
    }
    // Draw the square 
    draw(programInfo) {
        const gl = this.gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(
            programInfo.attribLocations.position,
            3,
            gl.FLOAT,
            false,
            0,
            0
        );


        // Enable the vertex attribute array for position
        gl.enableVertexAttribArray(programInfo.attribLocations.position);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.vertexCount);

    } 
}

// Initialize WebGL context 
function initWebGL(canvas) {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
        throw new Error('WebGL not supported');
    }

    gl.viewport(0, 0, canvas.width, canvas.height); // Set the viewport
    gl.clearColor(0.1, 0.1, 0.1, 1.0); // Set clear color to dark gray
    gl.clearDepth(1.0);     // Clear everything
    gl.enable(gl.DEPTH_TEST); // Enable depth testing
    gl.depthFunc(gl.LEQUAL);  // Near things obscure far things

    return gl;

}

// Compile a shader from source code
function compileShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error('Could not compile shader:\n' + info);
    
    }
    return shader;
}

// Initialize Shader Program
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = compileShader(gl, vsSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fsSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        throw new Error('Could not link program:\n' + info);

    }

    return program;

}

// Vertex Shader Source Code
const vsSource = `
    attribute vec3 aPosition;
    uniform mat4 uModel;
    void main(void) {
        gl_Position = uModel * vec4(aPosition, 1.0);
    }
`;



// Fragemnt Shader Source code
const fsSource = `
    precision mediump float;
    uniform vec4 uColor;
    void main (void) {
        gl_FragColor = uColor;
    
}
`;

// Main function to set up Webgl and draw the square
function main() {
    const canvas = document.querySelector('#glCanvas');
    if (!canvas) {
        throw new Error('Canvas element with id "glCanvas" not found');
    }

    const gl = initWebGL(canvas);
    
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    gl.useProgram(shaderProgram);

    // Collect all the info needed to use the shader program
    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            position: gl.getAttribLocation(shaderProgram, 'aPosition'),
        },
        uniformLocations: {
            uModel: gl.getUniformLocation(shaderProgram, 'uModel'), // Get location of uModel uniform
            uColor: gl.getUniformLocation(shaderProgram, 'uColor')  // Get location of uColor uniform

        }
    };
    if (programInfo.attribLocations.position === -1) {
        throw new Error('Attribute aPosition not found in shader program. Make sure the attribute name matches the shader.');
    }

    // Create the square
    const square = new Square(gl);

    // --- PART 2: multiple squares (static), two transform paths ---
    const USE_CPU_PATH = false; // false = GPU uniform path; true = CPU pre-transform path

    const instances = [
        { x:-0.6, y: 0.6, sx:0.20, sy:0.20, angle: 0.00,            r:1.0, g:0.2, b:0.2, vy: 0.35 },
        { x: 0.6, y: 0.6, sx:0.15, sy:0.15, angle: Math.PI*0.125,   r:0.2, g:0.8, b:0.3, vy: 0.50 },
        { x:-0.6, y:-0.6, sx:0.12, sy:0.20, angle: Math.PI*0.25,    r:0.2, g:0.5, b:1.0, vy: 0.40 },
        { x: 0.6, y:-0.6, sx:0.18, sy:0.10, angle: Math.PI*0.50,    r:1.0, g:0.8, b:0.2, vy: 0.60 },
    ];

    // Ensure the canvas and viewport match the display size (incl. HiDPI)
    function resizeCanvasToDisplaySize(gl) {
        const canvas = gl.canvas;
        const dpr = window.devicePixelRatio || 1;
        const displayWidth = Math.floor((canvas.clientWidth || canvas.width) * dpr);
        const displayHeight = Math.floor((canvas.clientHeight || canvas.height) * dpr);
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
            gl.viewport(0, 0, canvas.width, canvas.height);
        }
    }

    // Function to render the scene
    function render() {
        resizeCanvasToDisplaySize(gl);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (const s of instances) {
            // Build model = T * R * S
            const model = (function makeModelMatrix(tx, ty, angleRad, sx, sy) {
                function I4(){ return new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]); }
                function T(tx,ty,tz){ const m=I4(); m[12]=tx; m[13]=ty; m[14]=tz; return m; }
                function Rz(rad){ const c=Math.cos(rad),s=Math.sin(rad); return new Float32Array([ c, s,0,0, -s, c,0,0, 0,0,1,0, 0,0,0,1 ]); }
                function S(sx,sy,sz){ return new Float32Array([ sx,0,0,0, 0,sy,0,0, 0,0,sz,0, 0,0,0,1 ]); }
                function Mmul(a,b){ const o=new Float32Array(16); for(let r=0;r<4;r++) for(let c=0;c<4;c++) o[c*4+r]=a[0*4+r]*b[c*4+0]+a[1*4+r]*b[c*4+1]+a[2*4+r]*b[c*4+2]+a[3*4+r]*b[c*4+3]; return o; }
                return Mmul(Mmul(T(tx,ty,0), Rz(angleRad)), S(sx,sy,1));
            })(s.x, s.y, s.angle, s.sx, s.sy);

            // per-instance color
            gl.uniform4f(programInfo.uniformLocations.uColor, s.r, s.g, s.b, 1.0);

            if (USE_CPU_PATH) {
                // CPU path: shader sees identity, geometry is pre-transformed
                const I = new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]);
                gl.uniformMatrix4fv(programInfo.uniformLocations.uModel, false, I);
                square.drawCPU(programInfo, model);
            } else {
                // GPU path: send model matrix; draw the unit square
                gl.uniformMatrix4fv(programInfo.uniformLocations.uModel, false, model);
                square.draw(programInfo);
            }
        }
    }

    // --- Part 3: rain animation (update + RAF loop) ---
    let last = performance.now();
    function update(dt) {
        for (const s of instances) {
            s.y -= s.vy * dt;            // fall
            if (s.y < -1.2) {            // off bottom? respawn at the top
                s.y = 1.2;
                s.x = (Math.random() * 2 - 1) * 0.9;  // randomize x a bit
            }
        }
    }

    function loop(now) {
        const dt = Math.min(0.05, (now - last) / 1000); // seconds; clamp large jumps
        last = now;
        update(dt);
        render();
        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}
// --- Bootstrap after DOM is ready so #glCanvas exists ---
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('#glCanvas');
  if (!canvas) {
    throw new Error('Canvas element with id "glCanvas" not found. Add <canvas id="glCanvas"></canvas> to your HTML.');
  }
  main();
});