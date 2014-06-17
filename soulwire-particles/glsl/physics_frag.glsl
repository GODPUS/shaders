
precision mediump float;

const vec3 TARGET = vec3( 0, 0, 0.01 );
const float RADIUS = 150.0;

uniform sampler2D uParticleData;
uniform vec2 uViewport;
uniform vec4 uMouse;

void main() {
    // Retrieve data at current and adjacent slots
    vec4 data = texture2D( uParticleData, ( gl_FragCoord.xy ) / uViewport );

    vec2 pos = data.xy;
    vec2 vel = data.zw;

    pos += vel * (0.005);

    //mouse check
    float proximity = distance(pos.xy*uViewport, uMouse.xy*uViewport);

    if( RADIUS > proximity ){
        float angle = atan(uMouse.y-uMouse.w, uMouse.x-uMouse.z);
        float forceX = abs(uMouse.x-uMouse.z)*(RADIUS-proximity);
        float forceY = abs(uMouse.y-uMouse.w)*(RADIUS-proximity);

        vel.x += cos(angle)*forceX; 
        vel.y += sin(angle)*forceY; 
    }

    // Add a drag force
    vel *= 0.991;

    // Write out the velocity data
    gl_FragColor = vec4( vec2(pos), vec2(vel) );
}