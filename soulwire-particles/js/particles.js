
/*
------------------------------------------------------------

Config

------------------------------------------------------------
*/

// Number of particles
var PARTICLE_COUNT = Math.pow( 2048, 2 );

// Particle count must be power of 2
var PARTICLE_COUNT_SQRT = Math.sqrt( PARTICLE_COUNT );

// How many texture slots each particle needs for it's data
var PARTICLE_DATA_SLOTS = 1;

// The required size of the FBO containing the particle data
var PARTICLE_TEXTURE_WIDTH = PARTICLE_COUNT_SQRT * PARTICLE_DATA_SLOTS;
var PARTICLE_TEXTURE_HEIGHT = PARTICLE_COUNT_SQRT;

// How many particles can be emitted at a given time
var PARTICLE_EMIT_RATE = 1000;

/*
------------------------------------------------------------

Variables

------------------------------------------------------------
*/

// Stats instance
var stats;

// Programs
var physicsProgram;
var renderProgram;
var debugProgram;

// Buffers and textures
var particleUVDataBuffer;
var particleDataTexture;
var particleFramebuffer;
var viewportQuadBuffer;
var particleData;

// Shaders
var shaders = {
    physics_vert: '',
    physics_frag: '',
    render_vert: '',
    render_frag: '',
    debug_vert: '',
    debug_frag: ''
};

var mouse = {
    x: 0,
    y: 0,
    prevX: 0,
    prevY: 0,
    forceX: 0,
    forceY: 0,
    angle: 0
}

var time = 0;

var debugToggle = document.querySelector( '.toggle-fbo .toggle' );

// Sketch instance (augmented WebGL context)
var gl = Sketch.create({
    type: Sketch.WEBGL,
    autostart: false
});

// TODO embed a video for non-WebGL enabled browsers
if ( !gl ) {
    alert( 'WebGL not detected' );
}

/*
------------------------------------------------------------

Helper methods

------------------------------------------------------------
*/

// Creates and compiles a shader from source
function createShader( source, type ) {

    var shader = gl.createShader( type );

    gl.shaderSource( shader, source );
    gl.compileShader( shader );

    if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) )
        throw gl.getShaderInfoLog( shader );

    return shader;
}

// Creates a shader program and creates / links shaders
function createProgram( vertexSource, fragmentSource ) {

    var vs = createShader( vertexSource, gl.VERTEX_SHADER );
    var fs = createShader( fragmentSource, gl.FRAGMENT_SHADER );

    var program = gl.createProgram();

    gl.attachShader( program, vs );
    gl.attachShader( program, fs );
    gl.linkProgram( program );

    if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) )
        throw gl.getProgramInfoLog( program );

    return program;
}

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

/*
------------------------------------------------------------

Demo

------------------------------------------------------------
*/

gl.setup = function() {

    // Add Stats.js so we can monitor the FPS
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.right = '20px';
    stats.domElement.style.top = '50px';
    document.body.appendChild( stats.domElement );

    loadShaders( function() {

        // Set persistant states
        gl.clearColor( 0.0, 0.0, 0.0, 0.0 );

        // Store some extra data we'll need
        gl.particleIndex = 0;

        // Enable extensions - this won't work without floating point textures!
        if ( !gl.getExtension( 'OES_texture_float' ) ) alert( 'Float textures not supported' );

        // Create shader programs
        physicsProgram = createProgram( shaders.physics_vert, shaders.physics_frag );
        renderProgram = createProgram( shaders.render_vert, shaders.render_frag );
        debugProgram = createProgram( shaders.debug_vert, shaders.debug_frag );

        // Store physics program attribute and uniform locations
        physicsProgram.aVertexPositionLoc = gl.getAttribLocation( physicsProgram, 'aVertexPosition' );
        physicsProgram.uParticleDataLoc = gl.getUniformLocation( physicsProgram, 'uParticleData' );
        physicsProgram.uViewportLoc = gl.getUniformLocation( physicsProgram, 'uViewport' );
        physicsProgram.uMouseLoc = gl.getUniformLocation( physicsProgram, 'uMouse' );

        // Store render program attribute and uniform locations
        renderProgram.uTimeLoc = gl.getUniformLocation( renderProgram, 'uTime' );
        renderProgram.uParticleTextureLoc = gl.getUniformLocation( renderProgram, 'uParticleTexture' );
        renderProgram.uParticleDataLoc = gl.getUniformLocation( renderProgram, 'uParticleData' );
        renderProgram.aParticleUVLoc = gl.getAttribLocation( renderProgram, 'aParticleUV' );

        // Store debug program attribute and uniform locations
        debugProgram.aVertexPositionLoc = gl.getAttribLocation( debugProgram, 'aVertexPosition' );
        debugProgram.uParticleDataLoc = gl.getUniformLocation( debugProgram, 'uParticleData' );

        // Enable array attribute slots in programs
        gl.enableVertexAttribArray( physicsProgram.aVertexPositionLoc );
        gl.enableVertexAttribArray( renderProgram.aParticleUVLoc );
        gl.enableVertexAttribArray( debugProgram.aVertexPositionLoc );

        // Setup the initial particle data (4 components per particle slot, all zeros)
        particleData = new Float32Array( 4 * PARTICLE_COUNT * PARTICLE_DATA_SLOTS );
        
        var iterateBy = 4 * PARTICLE_DATA_SLOTS;

        for (var i = 0; i < particleData.length; i += iterateBy) {
            particleData[i] = 0; //x
            particleData[i+1] = 0; //y
            particleData[i+2] = Math.cos(i)*(i*.000005); //velocityX
            particleData[i+3] = Math.sin(i)*(i*.000005); //velocityY
        }
        

        // Create a texture to hold the particle data
        particleDataTexture = gl.createTexture();
        particleDataTexture.unit = 0;

        // Activate the correct texture unit and bind the texture to it
        gl.activeTexture( gl.TEXTURE0 + particleDataTexture.unit );
        gl.bindTexture( gl.TEXTURE_2D, particleDataTexture );

        // Fill the texture with the initial particle data
        gl.texImage2D(
            // target, level, internal format, width, height 
            gl.TEXTURE_2D, 0, gl.RGBA, PARTICLE_TEXTURE_WIDTH, PARTICLE_TEXTURE_HEIGHT,
            // border, data format, data type, pixels
            0, gl.RGBA, gl.FLOAT, particleData
        );

        // Disable bilinear filtering when minifying / magnifying texture
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

        // Clamp the texture to the edge (don't repeat)
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );

        // Create a framebuffer for the physics simulations to render updated particle data to and 
        // populate it with the initial particle data stored inside `particleDataTexture`
        particleFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer( gl.FRAMEBUFFER, particleFramebuffer );
        gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, particleDataTexture, 0 );

        // Create UV coordinates for each particle (0 -> 1). This will tell the physics shader where
        // to find each particle's data inside the particle texture
        var particleUVData = new Float32Array( PARTICLE_COUNT * 2 );
        var interval = 1.0 / PARTICLE_COUNT_SQRT;

        for ( var i = 0, u = 0, v = 1; i < PARTICLE_COUNT; i++, u = i * 2, v = u + 1 ) {
            particleUVData[ u ] = interval * ~~( i % PARTICLE_COUNT_SQRT ); // u
            particleUVData[ v ] = interval * ~~( i / PARTICLE_COUNT_SQRT ); // v
        }

        // Buffer in the particle UV data for the render program
        particleUVDataBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, particleUVDataBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, particleUVData, gl.STATIC_DRAW );
        gl.enableVertexAttribArray( renderProgram.aParticleUVLoc );

        // Create geometry for a fullscreen clipspace quad
        var viewportQuadVertices = new Float32Array([
            -1.0, -1.0, // 2----3
             1.0, -1.0, // | \  |
            -1.0,  1.0, // |  \ |
             1.0,  1.0  // 0----1
        ]);

        // Buffer in the geometry, used to fill FBOs at the full size of the viewport
        viewportQuadBuffer = gl.createBuffer();
        gl.bindBuffer( gl.ARRAY_BUFFER, viewportQuadBuffer );
        gl.bufferData( gl.ARRAY_BUFFER, viewportQuadVertices, gl.STATIC_DRAW );

        // Create a texture for the particle image asset
        var particleTexture = gl.createTexture();
        particleTexture.unit = 1;

        // Load the particle asset into the texture
        var particleTextureImage = new Image();
        particleTextureImage.src = 'img/particle.png';
        particleTextureImage.onload = function() {

            // Activate the correct texture unit and bind the texture to it
            gl.activeTexture( gl.TEXTURE0 + particleTexture.unit );
            gl.bindTexture( gl.TEXTURE_2D, particleTexture );
            gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST );
            gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
            gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
            gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
            gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, particleTextureImage );
            gl.generateMipmap( gl.TEXTURE_2D );
        };

        // Set physics program uniform values
        gl.useProgram( physicsProgram );
        gl.uniform1i( physicsProgram.uParticleDataLoc, 0 );
        gl.uniform2f( physicsProgram.uViewportLoc, PARTICLE_TEXTURE_WIDTH, PARTICLE_TEXTURE_HEIGHT );
        gl.uniform4f( physicsProgram.uMouseLoc, mouse.x, mouse.y, mouse.prevX, mouse.prevY );

        // Set render program uniform values
        gl.useProgram( renderProgram );
        gl.uniform1f( renderProgram.uTimeLoc, 0.0 );
        gl.uniform1i( renderProgram.uParticleDataLoc, particleDataTexture.unit );
        gl.uniform1i( renderProgram.uParticleTextureLoc, particleTexture.unit );

        // Set debug program uniform values
        gl.useProgram( debugProgram );
        gl.uniform1i( debugProgram.uParticleDataLoc, 0 );

        // Kick it off!
        gl.start();
    });
};

gl.draw = function() {
    stats.begin();

    time += 0.1;

    // 1. Physics step

    // Set the viewport to the size of the particle data texture since we're rendering to that
    gl.viewport( 0, 0, PARTICLE_TEXTURE_WIDTH, PARTICLE_TEXTURE_HEIGHT );

    // Prepare the physics program to execute per fragment of the particle data texture
    gl.useProgram( physicsProgram );
    gl.uniform4f( physicsProgram.uMouseLoc, mouse.x, mouse.y, mouse.prevX, mouse.prevY ); //send in mouse data
    gl.bindBuffer( gl.ARRAY_BUFFER, viewportQuadBuffer );
    gl.vertexAttribPointer( physicsProgram.aVertexPositionLoc, 2, gl.FLOAT, gl.FALSE, 0, 0 );

    // Tell WebGL to use the particle FBO, not the front buffer for (offscreen) rendering
    gl.bindFramebuffer( gl.FRAMEBUFFER, particleFramebuffer );
    gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );

    // Unbind the FBO, WebGL will now use the default buffer for rendering
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );

    // 2. Render step

    // Clear the front buffer (if we had called clear when the particle FBO was bound, it
    // would have nixed the particle position and velocity data)
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // Set the viewport size to the full canvas
    gl.viewport( 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight );

    // For each particle, pull out the position and render it as a point to the screen
    gl.useProgram( renderProgram );
    gl.uniform1f( renderProgram.uTimeLoc, time );
    gl.bindBuffer( gl.ARRAY_BUFFER, particleUVDataBuffer );
    gl.vertexAttribPointer( renderProgram.aParticleUVLoc, 2, gl.FLOAT, gl.FALSE, 0, 0 );

    // Draw with additive blending
    //gl.enable( gl.BLEND );
    //gl.blendFunc( gl.SRC_ALPHA, gl.ONE );
    gl.drawArrays( gl.POINTS, 0, PARTICLE_COUNT );

    // 3. Debug step

    if ( debugToggle.checked ) {

        gl.viewport( 20, 20, 600, 300 );
        gl.useProgram( debugProgram );
        gl.bindBuffer( gl.ARRAY_BUFFER, viewportQuadBuffer );
        gl.vertexAttribPointer( debugProgram.aVertexPositionLoc, 2, gl.FLOAT, gl.FALSE, 0, 0 );

        // Draw with interpolative blending
        gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
        gl.drawArrays( gl.TRIANGLE_STRIP, 0, 4 );
    }

    gl.disable( gl.BLEND );

    stats.end();
};

gl.mousemove = function(evt) {
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;

    mouse.x = map( evt.clientX, 0, gl.width, -1, 1 );
    mouse.y = map( evt.clientY, 0, gl.height, 1, -1 );

    if(mouse.prevX != 0 && mouse.prevY != 0)
    {
        mouse.forceX = mouse.x - mouse.prevX;
        mouse.forceY = mouse.y - mouse.prevY;
        mouse.angle = Math.atan2((mouse.prevY - mouse.y), (mouse.prevX - mouse.x));
    }
};