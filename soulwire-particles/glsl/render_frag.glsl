precision mediump float;

uniform sampler2D uParticleData;
varying vec2 vParticleUV;

void main() {
    vec4 color = texture2D( uParticleData, vParticleUV );

    gl_FragColor = vec4(1.0-abs(color.b*2.), 1.0-abs(color.a*2.), 1.0, 1.0);

}