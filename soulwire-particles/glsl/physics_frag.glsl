
precision mediump float;

const vec3 TARGET = vec3( 0, 0, 0.01 );
const float RADIUS = 150.0;

uniform sampler2D uParticleData;
uniform vec2 uViewport;
uniform vec4 uMouse;

// Retrieves the texel at a given offset from the current pixel
vec4 texelAtOffet( vec2 offset ) {
    return texture2D( uParticleData, ( gl_FragCoord.xy + offset ) / uViewport );
}

void main() {

    // Determine which data slot we're at (position or velocity)
    int slot = int( mod( gl_FragCoord.x, 2.0 ) );

    if ( slot == 0 ) { // position

        // Retrieve data at current and adjacent slots
        vec4 dataA = texelAtOffet( vec2( 0, 0 ) );
        vec4 dataB = texelAtOffet( vec2( 1, 0 ) );

        // Extract position and velocity data
        vec3 pos = dataA.xyz;
        vec3 vel = dataB.xyz;

        pos += vel * (0.005);

        // Write out the new position data
        gl_FragColor = vec4( pos, 0 );

    } else if ( slot == 1 ) { // velocity

        // Retrieve data at current and previous slots
        vec4 dataA = texelAtOffet( vec2( -1, 0 ) );
        vec4 dataB = texelAtOffet( vec2( 0, 0 ) );

        // Extract position and velocity data
        vec3 pos = dataA.xyz;
        vec3 vel = dataB.xyz;

        float proximity = distance(pos.xy*uViewport, uMouse.xy*uViewport);

        if( RADIUS > proximity ){
            float angle = atan(uMouse.y-uMouse.w, uMouse.x-uMouse.z);
            float forceX = abs(uMouse.x-uMouse.z)*(RADIUS-proximity);
            float forceY = abs(uMouse.y-uMouse.w)*(RADIUS-proximity);

            vel.x += cos(angle)*forceX; 
            vel.y += sin(angle)*forceY; 
        }

        if(pos.x > 1.0 || pos.x < -1.0){ vel.x = vel.x*-1.0; }
        if(pos.y > 1.0 || pos.y < -1.0){ vel.y = vel.y*-1.0; }

        // Add a drag force
        vel *= 0.991;

        // Write out the velocity data
        gl_FragColor = vec4( vel, 1.0 );
    }
}