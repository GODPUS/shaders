var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var MOUSE = { x: 0, y: 0 };
var CLOCK = new THREE.Clock();
var BUFFER_STATE = 0;
var BLOOM = false;

var canvas, video, videoTextureCurrent, videoTexturePrevious, videoTextureStill, simUniforms, simScene, simBuffer, backBuffer, displayScene, camera, renderer, outQuad;

var shaders = {
    vertex: '',
    rgbshift: ''
};

function init(){
  camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
  renderer = new THREE.WebGLRenderer();
  canvas = renderer.domElement;
  document.body.appendChild(canvas);
  renderer.autoClear = false;

  simBuffer =  new THREE.WebGLRenderTarget( WIDTH, HEIGHT, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
  backBuffer = new THREE.WebGLRenderTarget( WIDTH, HEIGHT, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );

  simScene = new THREE.Scene();
  displayScene = new THREE.Scene();

  //init video texture
	videoTextureCurrent = new THREE.Texture( video );
	videoTextureCurrent.minFilter = THREE.LinearFilter;
	videoTextureCurrent.magFilter = THREE.LinearFilter;

	//init video texture
	videoTexturePrevious = videoTextureCurrent.clone();
	videoTextureStill = videoTextureCurrent.clone();

	simUniforms = { 
  	"currentFrame" : { type: "t",  value: videoTextureCurrent },
    "previousFrame" : { type: "t",  value: videoTexturePrevious },
    "backbuffer" : { type: "t",  value: videoTextureStill },
    "resolution" : { type: "v2", value: new THREE.Vector2(WIDTH, HEIGHT) }
  };

  var simQuad = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), new THREE.ShaderMaterial({ uniforms: simUniforms, vertexShader: shaders.vertex, fragmentShader: shaders.rgbshift }) );
  simScene.add(simQuad);
  simScene.add(camera);

  outQuad = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), new THREE.MeshBasicMaterial({ map: simBuffer }) );
  displayScene.add(outQuad);
  displayScene.add(camera);
}

var i = 0;

function render() {

	if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
	  if ( videoTextureCurrent ) videoTextureCurrent.needsUpdate = true;
	}

	if (!BUFFER_STATE) {
	  renderer.render(simScene, camera, backBuffer, false);
	  simUniforms.backbuffer.value = backBuffer;
	  BUFFER_STATE = 1;
	} else {
	  renderer.render(simScene, camera, simBuffer, false);
	  simUniforms.backbuffer.value = simBuffer;
	  BUFFER_STATE = 0;
	}

	renderer.render(displayScene, camera);
	requestAnimationFrame(render);


	if( i%10 === 0 && !BLOOM)
	{
		if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
		  if ( videoTexturePrevious ) videoTexturePrevious.needsUpdate = true;
		}
	}
	
	i++;
}

function resize() {
  WIDTH = window.innerWidth; if(WIDTH%2 != 0){ WIDTH -= 1; }
  HEIGHT = window.innerHeight;
  renderer.setSize(WIDTH, HEIGHT);
  simUniforms.resolution.value = new THREE.Vector2(WIDTH, HEIGHT);
}

window.onload = function(){ 
  loadShaders(function(){ 
  	getWebcamVideo(function(){
  		init();
    	resize();
    	requestAnimationFrame(render); 
  	});
  });
}

window.onresize = function(){ resize(); }

window.onkeypress = function(){

	console.log(window.event.keyCode);

	switch(window.event.keyCode) {
		case 32:
			if ( video.readyState === video.HAVE_ENOUGH_DATA ) {
			  if ( videoTextureStill ){
			  	videoTextureStill.needsUpdate = true;
			  	simUniforms.backbuffer.value = videoTextureStill;
			  }
			}
		break;

		case 98:
			BLOOM = true;
		break;  
	}  
}

window.onkeyup = function(){
	console.log(window.event.keyCode);

	switch(window.event.keyCode) {
		case 66:
			BLOOM = false;
		break;  
	}  
}

document.addEventListener('mousemove', function(e){ 
    MOUSE.x = e.clientX || e.pageX; 
    MOUSE.y = e.clientY || e.pageY;
}, false);

// Populates shader object with loaded GLSL code
function loadShaders( callback ) {

    var queue = 0;

    function loadHandler( name, req ) {

        return function() {
            shaders[ name ] = req.responseText;
            if ( --queue <= 0 ) callback();
        };
    }

    for ( var name in shaders ) {

        queue++;

        var req = new XMLHttpRequest();
        req.onload = loadHandler( name, req );
        req.open( 'get', 'glsl/' + name + '.glsl', true );
        req.send();
    }
}

function getWebcamVideo(callback){
	//Use webcam
	video = document.createElement('video');
	video.width = 320;
	video.height = 240;
	video.autoplay = true;
	video.loop = true;
	//Webcam video
	window.URL = window.URL || window.webkitURL;
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
	//get webcam
	navigator.getUserMedia({
		video: true
	}, function(stream) {
		//on webcam enabled
		video.src = window.URL.createObjectURL(stream);
		callback();
	}, function(error) {
		prompt.innerHTML = 'Unable to capture WebCam. Please reload the page.';
	});
}