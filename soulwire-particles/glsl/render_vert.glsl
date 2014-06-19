attribute vec2 aParticleUV;

uniform sampler2D uParticleData;
varying vec2 vParticleUV;

void main() {

    vec4 particle = texture2D( uParticleData, aParticleUV );
    vParticleUV = aParticleUV;

    gl_Position = vec4( particle.xyz, 1.0 );
}