var RESOLUTION = 1024; //power of 2
var MOUSE = { x: 0, y: 0 };
var CLOCK = new THREE.Clock();
var BUFFER_STATE = 0;
var USE_MIC = false;

var canvas, video, videoTextureCurrent, videoTextureStill, simUniforms, simScene, simBuffer, backBuffer, displayScene, camera, renderer, outQuad;
var mic = null;

var shaders = {
    vertex: '',
    datamosh: ''
};

function init(){
	camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
	renderer = new THREE.WebGLRenderer();
	canvas = renderer.domElement;
	document.body.appendChild(canvas);
	renderer.autoClear = false;

	simBuffer =  new THREE.WebGLRenderTarget( RESOLUTION, RESOLUTION, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );
	backBuffer = new THREE.WebGLRenderTarget( RESOLUTION, RESOLUTION, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat } );

	simScene = new THREE.Scene();
	displayScene = new THREE.Scene();

	//init video texture
	videoTextureCurrent = new THREE.Texture( video );
	videoTextureCurrent.minFilter = THREE.LinearFilter;
	videoTextureCurrent.magFilter = THREE.LinearFilter;

	//init video texture
	videoTextureStill = videoTextureCurrent.clone();

	simUniforms = { 
		"currentFrame" : { type: "t",  value: videoTextureCurrent },
		"backbuffer"   : { type: "t",  value: backBuffer },
		"resolution"   : { type: "v2", value: new THREE.Vector2(RESOLUTION, RESOLUTION) },
		"threshold"    : { type: "f", value: window.THRESHOLD },
		"time"         : { type: "f", value: 0 },
		"shift"         : { type: "f", value: window.SHIFT }
	};

	var simQuad = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), new THREE.ShaderMaterial({ uniforms: simUniforms, vertexShader: shaders.vertex, fragmentShader: shaders.datamosh }) );
	simScene.add(simQuad);
	simScene.add(camera);

	outQuad = new THREE.Mesh( new THREE.PlaneGeometry( 2, 2 ), new THREE.MeshBasicMaterial({ map: simBuffer }) );
	displayScene.add(outQuad);
	displayScene.add(camera);
}

var i = 0;

function render() {

	if(USE_MIC && mic && mic.isInitialized()){ 
		window.THRESHOLD = (1-(Math.abs(mic.getMaxInputAmplitude())/120))/2;
	}

	simUniforms.threshold.value = window.THRESHOLD;
	simUniforms.shift.value = window.SHIFT;
	simUniforms.time.value += 1;

	if ( video.readyState === video.HAVE_ENOUGH_DATA ) { if ( videoTextureCurrent ) videoTextureCurrent.needsUpdate = true; }

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

	i++;
}

function takeStill() {
	videoTextureStill.needsUpdate = true;
	simUniforms.backbuffer.value = videoTextureStill;
}

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.onload = function(){ 
  loadShaders(function(){ 
  	getWebcamVideo(function(){
  		init();
		resize();
		takeStill();
		requestAnimationFrame(render);

		if(USE_MIC){
			mic = new Microphone();
	  		mic.initialize();

	  		var waitForMic = setInterval(function(){
	  			if(mic.isInitialized()){
	  				clearInterval(waitForMic);
	    			mic.startListening();
	  			}
	  		}, 300);
		}
  		
  	});
  });
}

window.onresize = function(){ resize(); }

window.onkeypress = function(){

	console.log(window.event.keyCode);

	switch(window.event.keyCode) {
		case 32:
			if (video.readyState === video.HAVE_ENOUGH_DATA && videoTextureStill){ takeStill(); }
		break; 
	}  
}

window.onkeyup = function(){
	console.log(window.event.keyCode);

	switch(window.event.keyCode) {
		case 66:
			
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
	video.height = 320;
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