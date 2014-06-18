precision mediump float;

uniform float uTime;
uniform sampler2D uParticleData;
varying vec2 vParticleUV;

vec3 hueToRGB(float hue) {
    return clamp( 
        abs(mod(hue * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 
        0.0, 1.0);
}

void main() {
    vec4 color = texture2D( uParticleData, vParticleUV );

    gl_FragColor = vec4(hueToRGB(mod((color.b)+(uTime*.1), 1.0)), 1.0); //rainbow
    //gl_FragColor = vec4(1.0-abs(color.b*2.), 1.0-abs(color.a*2.), 1.0, 1.0); //blue and pink

}