uniform sampler2D currentFrame;
uniform sampler2D previousFrame;
uniform sampler2D backbuffer;
uniform vec2 resolution;
uniform float threshold;
varying vec2 vUv;


float force = 5.0;
float offset = 3.0;
float lambda = 0.01;
float inverseX = -1.0;
float inverseY = -1.0;

void main(){
	vec2 st = vUv;

	vec2	off_x = vec2(offset, 0.0);
	vec2	off_y = vec2(0.0, offset);

	vec4	scr_dif;
	vec4	gradx;
	vec4	grady;
	vec4	gradmag;
	vec4	vx;
	vec4	vy;
	vec4	f4l = vec4(lambda);
	vec4	flow = vec4(0.0);

	//get the difference
	scr_dif = texture2D(currentFrame, st) - texture2D(previousFrame, st);

	//calculate the gradient
	gradx =	texture2D(previousFrame, st + off_x) - texture2D(previousFrame, st - off_x);
	gradx += texture2D(currentFrame, st + off_x) - texture2D(currentFrame, st - off_x);
	grady =	texture2D(previousFrame, st + off_y) - texture2D(previousFrame, st -off_y);
	grady += texture2D(currentFrame, st + off_y) - texture2D(currentFrame, st - off_y);

	gradmag = sqrt((gradx*gradx)+(grady*grady)+f4l);
	vx = scr_dif*(gradx/gradmag);
	vy = scr_dif*(grady/gradmag);

	flow.x = -(vx.x + vx.y + vx.z) / 3.0 * inverseX;
	flow.y = -(vy.x + vy.y + vy.z) / 3.0 * inverseY;

	flow *= vec4(force);
	flow.z = length(flow.xy);

	vec4 newColor = texture2D(currentFrame, vUv); //switch between currentFrame and backbuffer for different effects

	if (length(flow.xy) > threshold){
		newColor = texture2D(backbuffer, vec2((gl_FragCoord.x+clamp(flow.x, -1.0, 1.0))/resolution.x, (gl_FragCoord.y+clamp(flow.y, -1.0, 1.0))/resolution.y));
	}

	gl_FragColor = newColor;
}

