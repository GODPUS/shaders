// Conway's Game of Life, by Michael Parisi
// we store the state of the pixel in the alpha channel

#ifdef GL_ES
precision highp float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D backbuffer;

const mat3 rgb2yiq = mat3( 0.299, 0.595716, 0.211456, 0.587, -0.274453, -0.522591, 0.114, -0.321263, 0.311135 );
const mat3 yiq2rgb = mat3( 1.0, 1.0, 1.0, 0.9563, -0.2721, -1.1070, 0.6210, -0.6474, 1.7046 );
const float PI = 3.14159265359;

const float COLOR_SPEED = 10.;

vec3 hueShift(vec3 color, float degree){
	
	vec3 yiq = rgb2yiq * color;  // convert rgb to yiq 
	float h = (degree*0.0174532925) + atan( yiq.b, yiq.g ); // calculate new hue
	float chroma = sqrt( yiq.b * yiq.b + yiq.g * yiq.g ); // convert yiq to rgb
	vec3 rgb = yiq2rgb * vec3( yiq.r, chroma * cos(h), chroma * sin(h) );
	
	return rgb;
}

float countNeighbours() {
	
	vec2 left      = vec2(gl_FragCoord.x-1., gl_FragCoord.y)/resolution;
	vec2 right     = vec2(gl_FragCoord.x+1., gl_FragCoord.y)/resolution;
	vec2 up        = vec2(gl_FragCoord.x, gl_FragCoord.y+1.)/resolution;
	vec2 down      = vec2(gl_FragCoord.x, gl_FragCoord.y-1.)/resolution;	
	vec2 upleft    = vec2(gl_FragCoord.x-1., gl_FragCoord.y+1.)/resolution;
	vec2 upright   = vec2(gl_FragCoord.x+1., gl_FragCoord.y+1.)/resolution;
	vec2 downleft  = vec2(gl_FragCoord.x-1., gl_FragCoord.y-1.)/resolution;
	vec2 downright = vec2(gl_FragCoord.x+1., gl_FragCoord.y-1.)/resolution;	
	
	float oldLeft  = texture2D(backbuffer, left).a;
	float oldRight = texture2D(backbuffer, right).a;
	float oldUp  = texture2D(backbuffer, up).a;
	float oldDown    = texture2D(backbuffer, down).a;	
	float oldul    = texture2D(backbuffer, upleft).a;
	float oldur    = texture2D(backbuffer, upright).a;
	float olddl    = texture2D(backbuffer, downleft).a;
	float olddr    = texture2D(backbuffer, downright).a;		

	return oldLeft + oldRight + oldDown + oldUp + oldul + oldur + olddl + olddr;
}

void main(void) {
	vec4 outColor = vec4(0.);
	vec4 oldColor = texture2D(backbuffer, gl_FragCoord.xy/resolution);
	
	//hue shift the old color
	oldColor.rgb = hueShift(oldColor.rgb, COLOR_SPEED);
	
	float n = countNeighbours();		
	
	if(n == 2.)
	{
		//if neighbor count is 2 then keep the same and keep old color
		outColor = oldColor;
	}else if(n == 3.){
		//if neightbor count is 3 then turn on and update color
		outColor.a = 1.;
		outColor.rgb = hueShift(vec3(1., 0., 0.), time*COLOR_SPEED); 
	}else{
		//otherwise turn off and keep old color
		outColor = oldColor;
		outColor.a = 0.;
	}
	
	float radius = 200.; 
	//growing and shrinking 
	//radius = abs(cos(time/2.)*150.);
	
	float thickness = 1.;
	vec2 mousePos = mouse * resolution;
	vec2 middle   = vec2(resolution.x/2.,resolution.y/2.);
	
	//seed of life check
	for(int i = 1; i <= 6; i++)
	{	
		float rotation = 30.;
		//spinning
		//rotation = time*10.;
		
		float angle = (((360./6.)*float(i))+rotation)*0.0174532925;
		vec2 circleCenter = vec2(middle.x+(cos(angle)*radius), middle.y+(sin(angle)*radius));
		
		if(distance(gl_FragCoord.xy, circleCenter) < (radius) && distance(gl_FragCoord.xy, circleCenter) > ((radius)-thickness) )
		{
			outColor.a = 1.;
		}
	}
	
	//middle check
	if(distance(gl_FragCoord.xy, middle) < radius && distance(gl_FragCoord.xy, middle) > (radius-thickness) ){ outColor.a = 1.; }
	
	//mouse check
	//if(distance( gl_FragCoord.xy, mousePos) < (radius/2.) ){ outColor.a = 1.; }
	
	gl_FragColor = outColor;
}
