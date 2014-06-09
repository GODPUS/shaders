var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var RESOLUTION = 1024;
var MOUSE = { x: 0, y: 0 };
var CLOCK = new THREE.Clock();

document.addEventListener('mousemove', function(e){ 
    MOUSE.x = e.clientX || e.pageX; 
    MOUSE.y = e.clientY || e.pageY 
}, false);

var basicVertexShader = document.getElementById('shader-vs').text;
var simFragmentShader = document.getElementById('shader-gol-fs').text;

var simBuffer =  new THREE.WebGLRenderTarget(RESOLUTION, RESOLUTION, { minFilter: THREE.NearestFilter, magFilter: THREE.LinearMipMapLinearFilter, format: THREE.RGBAFormat } );
var backBuffer = new THREE.WebGLRenderTarget(RESOLUTION, RESOLUTION, { minFilter: THREE.NearestFilter, magFilter: THREE.LinearMipMapLinearFilter, format: THREE.RGBAFormat } );

var simScene = new THREE.Scene();
var displayScene = new THREE.Scene();

var renderer = new THREE.WebGLRenderer();
renderer.setSize(RESOLUTION, RESOLUTION);
document.body.appendChild(renderer.domElement);
renderer.autoClear = false;


var simUniforms = { 
	"backbuffer" : { type: "t",  value: backBuffer },
	"resolution" : { type: "v2", value: new THREE.Vector2(RESOLUTION, RESOLUTION) },
	"iteration"  : { type: "i",  value: 0 },
	"time"       : { type: "f",  value: 0.0 },
	"mouse"      : { type: "v2", value: new THREE.Vector2(MOUSE.x, MOUSE.y) }
};

var simQuad = new THREE.Mesh(new THREE.PlaneGeometry(2,2,0), new THREE.ShaderMaterial({ uniforms: simUniforms, vertexShader: basicVertexShader, fragmentShader: simFragmentShader}));
simScene.add(simQuad);
simScene.add(camera);

var outQuad = new THREE.Mesh(new THREE.PlaneGeometry(2,2,0), new THREE.MeshBasicMaterial({ map: simBuffer }));
displayScene.add(outQuad);
displayScene.add(camera);

var camera = new THREE.Camera();
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
   simUniforms.mouse.value = new THREE.Vector2(MOUSE.x, MOUSE.y);

   renderer.render(displayScene, camera);
   requestAnimationFrame(render);
}

window.onload = function(){ requestAnimationFrame(render); }