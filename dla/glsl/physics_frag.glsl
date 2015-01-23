
precision mediump float;

const vec3 TARGET = vec3( 0, 0, 0.01 );
const float RADIUS = 0.1; //% of viewport
const float PI = 3.14159265359;
const float STRENGTH = 0.5;

uniform sampler2D uParticleData;
uniform vec2 uViewport;
uniform vec4 uMouse;
uniform float uTime;

// Retrieves the texel at a given offset from the current pixel
vec4 texelAtOffet( vec2 offset ) {
    return texture2D( uParticleData, ( gl_FragCoord.xy + offset ) / uViewport );
}

float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    // Retrieve data at current and adjacent slots
    vec4 data = texelAtOffet( vec2( 0, 0 ) );
    
    if(gl_FragCoord.x > 0.0 && gl_FragCoord.y > 0.0){
        vec4 dataPrev = texelAtOffet( vec2( 0, 0 ) );
    }

    vec2 pos = data.xy;
    vec2 vel = data.zw;

    pos += vel;

    vel.x = cos(uTime)*0.005;
    vel.y = sin(uTime)*0.005;
    
    if( pos.x > 1.0 || pos.x < -1.0 ){ 
        vel.x *= -1.0;
        //pos = vec2(0.0);
    }
    if( pos.y > 1.0 || pos.y < -1.0 ){ 
        vel.y *= -1.0; 
        //pos = vec2(0.0);
    }


    // Add a drag force
    vel *= 0.99;

    // Write out the velocity data
    gl_FragColor = vec4( pos, vel );
}