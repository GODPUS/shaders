precision mediump float;

uniform sampler2D uParticleData;
varying vec2 vParticleUV;

void main() {
    vec4 color = texture2D( uParticleData, vParticleUV );

    gl_FragColor = vec4(color.r, color.g, 0.0, 1.0);

}