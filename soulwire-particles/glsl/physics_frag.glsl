
precision mediump float;

const vec3 TARGET = vec3( 0, 0, 0.01 );
const float RADIUS = 0.1; //% of viewport
const float PI = 3.14159265359;

uniform sampler2D uParticleData;
uniform vec2 uViewport;
uniform vec4 uMouse;

// Retrieves the texel at a given offset from the current pixel
vec4 texelAtOffet( vec2 offset ) {
    return texture2D( uParticleData, ( gl_FragCoord.xy + offset ) / uViewport );
}

void main() {
    // Retrieve data at current and adjacent slots
    vec4 data = texelAtOffet( vec2( 0, 0 ) );

    vec2 pos = data.xy;
    vec2 vel = data.zw;

    pos += vel * (0.005);

    //mouse check
    float proximity = distance(pos.xy, uMouse.xy);

    //if( RADIUS > proximity ){
        //float angle = atan(pos.y-uMouse.y, pos.x-uMouse.x); //repel
        float angle = atan(uMouse.y-pos.y, uMouse.x-pos.x); //attract
        float force = 1.-abs(proximity);
        //float force = 1.; //constant force

        vel.x += cos(angle)*force; 
        vel.y += sin(angle)*force; 
    //}

    
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