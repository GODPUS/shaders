var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var MOUSE = { x: 0, y: 0 };
var CLOCK = new THREE.Clock();

var basicVertexShader = document.getElementById('shader-vs').text;
var simFragmentShader = document.getElementById('shader-gol-fs').text;

var simBuffer =  new THREE.WebGLRenderTarget(WIDTH, HEIGHT, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
var backBuffer = new THREE.WebGLRenderTarget(WIDTH, HEIGHT, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );

var simUniforms = { 
	"backbuffer" : { type: "t",  value: backBuffer },
	"resolution" : { type: "v2", value: new THREE.Vector2(WIDTH, HEIGHT) },
	"iteration"  : { type: "i",  value: 0 },
	"time"       : { type: "f",  value: 0.0 },
	"mouse"      : { type: "v2", value: new THREE.Vector2(MOUSE.x, MOUSE.y) }
};


var simScene = new THREE.Scene();
var displayScene = new THREE.Scene();

var simQuad = new THREE.Mesh(new THREE.PlaneGeometry(2,2,0), new THREE.ShaderMaterial({ uniforms: simUniforms, vertexShader: basicVertexShader, fragmentShader: simFragmentShader}));
simScene.add(simQuad);
simScene.add(camera);

var outQuad = new THREE.Mesh(new THREE.PlaneGeometry(2,2,0), new THREE.MeshBasicMaterial({ map: simBuffer }));
displayScene.add(outQuad);
displayScene.add(camera);

var camera = new THREE.Camera();
var renderer = new THREE.WebGLRenderer();
renderer.setSize(WIDTH, HEIGHT);
document.body.appendChild(renderer.domElement);
renderer.autoClear = false;
var bufferState = 0;

function render() {
   if (!bufferState) {
      renderer.render(simScene, camera, backBuffer, false);
      simUniforms.backbuffer.value = backBuffer;
      bufferState = 1;
   } else {
      renderer.render(simScene, camera, simBuffer, false);
      simUniforms.backbuffer.value = simBuffer;
      bufferState = 0;
   } 

   simUniforms.iteration.value += 1;
   simUniforms.time.value += CLOCK.getDelta();
   simUniforms.mouse.value = new THREE.Vector2(MOUSE.x/WIDTH, (HEIGHT-MOUSE.y)/HEIGHT);

   renderer.render(displayScene, camera);
   requestAnimationFrame(render);
}

window.onload = function(){ requestAnimationFrame(render); }
window.onresize = function(){ 
	WIDTH = window.innerWidth;
	HEIGHT = window.innerHeight;
	renderer.setSize(WIDTH, HEIGHT);
	renderer.setViewport(0, 0, WIDTH, HEIGHT);
	renderer.clear(false);
}

document.addEventListener('mousemove', function(e){ 
    MOUSE.x = e.clientX || e.pageX; 
    MOUSE.y = e.clientY || e.pageY;
}, false);