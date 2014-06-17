var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var MOUSE = { x: 0, y: 0 };
var CLOCK = new THREE.Clock();
var BUFFER_STATE = 0;

var canvas, simUniforms, simScene, simBuffer, backBuffer, displayScene, camera, renderer, outQuad;

function init(){
  var plotVertexShader = document.getElementById('vs-plot').text;
  var plotFragmentShader = document.getElementById('fs-plot').text;
  var updateVertexShader = document.getElementById('vs-update').text;
  var updateFragmentShader = document.getElementById('fs-update').text;

  camera = new THREE.Camera();
  renderer = new THREE.WebGLRenderer();
  canvas = renderer.domElement;
  document.body.appendChild(canvas);
  renderer.autoClear = false;

  createBuffers();

  simUniforms = { 
    "backbuffer" : { type: "t",  value: backBuffer },
    "resolution" : { type: "v2", value: new THREE.Vector2(WIDTH, HEIGHT) },
    "iteration"  : { type: "i",  value: 0 },
    "time"       : { type: "f",  value: 0.0 },
    "mouse"      : { type: "v2", value: new THREE.Vector2(MOUSE.x, MOUSE.y) }
  };

  simScene = new THREE.Scene();
  displayScene = new THREE.Scene();

  var simQuad = new THREE.Mesh(new THREE.PlaneGeometry(2,2,0), new THREE.ShaderMaterial({ uniforms: simUniforms, vertexShader: basicVertexShader, fragmentShader: simFragmentShader}));
  simScene.add(simQuad);
  simScene.add(camera);

  outQuad = new THREE.Mesh(new THREE.PlaneGeometry(2,2,0), new THREE.MeshBasicMaterial({ map: simBuffer }));
  displayScene.add(outQuad);
  displayScene.add(camera);
}

function render() {
   if (!BUFFER_STATE) {
      renderer.render(simScene, camera, backBuffer, false);
      simUniforms.backbuffer.value = backBuffer;
      BUFFER_STATE = 1;
   } else {
      renderer.render(simScene, camera, simBuffer, false);
      simUniforms.backbuffer.value = simBuffer;
      BUFFER_STATE = 0;
   } 

   simUniforms.iteration.value += 1;
   simUniforms.time.value += CLOCK.getDelta();
   simUniforms.mouse.value = new THREE.Vector2(MOUSE.x/WIDTH, (HEIGHT-MOUSE.y)/HEIGHT);

   renderer.render(displayScene, camera);
   requestAnimationFrame(render);
}

function resize() {
  WIDTH = window.innerWidth; if(WIDTH%2 != 0){ WIDTH -= 1; }
  HEIGHT = window.innerHeight;
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setViewport(0, 0, WIDTH, HEIGHT);
  canvas.style.width = WIDTH + 'px';
  canvas.style.height = HEIGHT + 'px';
  
  createBuffers();
  outQuad.material = new THREE.MeshBasicMaterial({ map: simBuffer });

  simUniforms.resolution.value = new THREE.Vector2(WIDTH, HEIGHT);
  renderer.clear();
}

function createBuffers(){
  simBuffer =  new THREE.WebGLRenderTarget(WIDTH, HEIGHT, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
  backBuffer = new THREE.WebGLRenderTarget(WIDTH, HEIGHT, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
}

window.onload = function(){ 
  init();
  resize();
  requestAnimationFrame(render); 
}

window.onresize = function(){ resize(); }

document.addEventListener('mousemove', function(e){ 
    MOUSE.x = e.clientX || e.pageX; 
    MOUSE.y = e.clientY || e.pageY;
}, false);