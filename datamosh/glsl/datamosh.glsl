uniform sampler2D currentFrame;
uniform sampler2D backbuffer;
uniform vec2 resolution;
uniform float threshold;
uniform float offset;
uniform float time;
uniform float shift;
varying vec2 vUv;

uniform int USE_RGB_SHIFT;
uniform int USE_HUE_SHIFT;


const mat3 rgb2yiq = mat3( 0.299, 0.595716, 0.211456, 0.587, -0.274453, -0.522591, 0.114, -0.321263, 0.311135 );
const mat3 yiq2rgb = mat3( 1.0, 1.0, 1.0, 0.9563, -0.2721, -1.1070, 0.6210, -0.6474, 1.7046 );

float force = 5.0;
float lambda = 0.01;
float inverseX = -1.0;
float inverseY = -1.0;

vec3 hueShift(vec3 color, float degree){

	vec3 yiq = rgb2yiq * color;  // convert rgb to yiq 
	float h = (degree*0.0174532925) + atan( yiq.b, yiq.g ); // calculate new hue
	float chroma = sqrt( yiq.b * yiq.b + yiq.g * yiq.g ); // convert yiq to rgb
	vec3 rgb = yiq2rgb * vec3( yiq.r, chroma * cos(h), chroma * sin(h) );

	return rgb;
}

void main(){
	vec2 st = vUv;

	vec2	off_x = vec2(offset/resolution.x, 0.0);
	vec2	off_y = vec2(0.0, offset/resolution.y);

	vec4	scr_dif;
	vec4	gradx;
	vec4	grady;
	vec4	gradmag;
	vec4	vx;
	vec4	vy;
	vec4	f4l = vec4(lambda);
	vec4	flow = vec4(0.0);

	//get the difference
	scr_dif = texture2D(currentFrame, st) - texture2D(backbuffer, st);

	//calculate the gradient
	gradx =	texture2D(backbuffer, st + off_x) - texture2D(backbuffer, st - off_x);
	gradx += texture2D(currentFrame, st + off_x) - texture2D(currentFrame, st - off_x);
	grady =	texture2D(backbuffer, st + off_y) - texture2D(backbuffer, st -off_y);
	grady += texture2D(currentFrame, st + off_y) - texture2D(currentFrame, st - off_y);

	gradmag = sqrt((gradx*gradx)+(grady*grady)+f4l);
	vx = scr_dif*(gradx/gradmag);
	vy = scr_dif*(grady/gradmag);

	flow.x = -(vx.x + vx.y + vx.z) / 3.0 * inverseX;
	flow.y = -(vy.x + vy.y + vy.z) / 3.0 * inverseY;

	flow *= vec4(force);
	flow.z = length(flow.xy);

	vec4 newColor = vec4(1.0);

	if (length(flow.xy) > threshold){
		
		flow.x = clamp(flow.x, -1.0, 1.0);
		flow.y = clamp(flow.y, -1.0, 1.0);

		vec2 pos = vec2(0.);
		pos.x = gl_FragCoord.x+flow.x;
		pos.y = gl_FragCoord.y+flow.y;

		if(USE_RGB_SHIFT > 0){
			float r = texture2D(backbuffer, vec2((pos.x+cos(flow.x))/resolution.x, (pos.y+sin(flow.y))/resolution.y)).r;
			float g = texture2D(backbuffer, vec2(pos.x/resolution.x, pos.y/resolution.y)).g;
			float b = texture2D(backbuffer, vec2((pos.x-cos(flow.x))/resolution.x, (pos.y-sin(flow.y))/resolution.y)).b;

			newColor.rgb = vec3(r, g, b);
		}else{
			newColor = texture2D(backbuffer, vec2(pos.x/resolution.x, pos.y/resolution.y));
		}
		
		if(USE_HUE_SHIFT > 0){
			newColor.rgb = hueShift(newColor.rgb, length(flow.xy)*shift);
		}
		
	}else{
		newColor = texture2D(currentFrame, vUv);
	}

	gl_FragColor = newColor;
}

