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
float RADIUS    = 200.; 
float THICKNESS = 1.;
vec2 MIDDLE     = vec2(resolution.x/2.,resolution.y/2.);

//#define check_square
#define check_seed_of_life
//#define check_mouse

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
	float oldUp    = texture2D(backbuffer, up).a;
	float oldDown  = texture2D(backbuffer, down).a;	
	float oldul    = texture2D(backbuffer, upleft).a;
	float oldur    = texture2D(backbuffer, upright).a;
	float olddl    = texture2D(backbuffer, downleft).a;
	float olddr    = texture2D(backbuffer, downright).a;		

	return oldLeft + oldRight + oldDown + oldUp + oldul + oldur + olddl + olddr;
}

float shapeCheck(float outColorAlpha) {
	#ifdef check_square
		if(gl_FragCoord.x > MIDDLE.x-RADIUS && gl_FragCoord.x < MIDDLE.x+RADIUS && gl_FragCoord.y > MIDDLE.y-RADIUS && gl_FragCoord.y < MIDDLE.y+RADIUS){
		  
			if(gl_FragCoord.x < MIDDLE.x-(RADIUS-THICKNESS) || gl_FragCoord.x > MIDDLE.x+(RADIUS-THICKNESS) || gl_FragCoord.y < MIDDLE.y-(RADIUS-THICKNESS) || gl_FragCoord.y > MIDDLE.y+(RADIUS-THICKNESS)){
				outColorAlpha = 1.;
			}
		}
	#endif
	
	#ifdef check_seed_of_life
		for(int i = 1; i <= 6; i++)
		{	
			float rotation = 30.;
			//rotation = time*10.; //spinning
			
			float angle = (((360./6.)*float(i))+rotation)*0.0174532925;
			vec2 circleCenter = vec2(MIDDLE.x+(cos(angle)*RADIUS), MIDDLE.y+(sin(angle)*RADIUS));
			
			if(distance(gl_FragCoord.xy, circleCenter) < (RADIUS) && distance(gl_FragCoord.xy, circleCenter) > ((RADIUS)-THICKNESS) )
			{
				outColorAlpha = 1.;
			}
		}
		
		if(distance(gl_FragCoord.xy, MIDDLE) < RADIUS && distance(gl_FragCoord.xy, MIDDLE) > (RADIUS-THICKNESS) ){ outColorAlpha = 1.; }
	#endif
	
	#ifdef check_mouse
		vec2 mousePos = mouse * resolution;
		if(distance( gl_FragCoord.xy, mousePos) < (RADIUS/2.) ){ outColorAlpha = 1.; }
	#endif
	
	return outColorAlpha;
}






void main(void) {
	vec4 outColor = vec4(0.);
	vec4 oldColor = texture2D(backbuffer, gl_FragCoord.xy/resolution);
	
	float n = countNeighbours();	

	if(oldColor.a == 1.){
		if(n < 2.){ outColor.a = 0.; }             //Any live cell with fewer than two live neighbours dies, as if caused by under-population.
		if(n == 2. || n == 3.){ outColor.a = 1.; } //Any live cell with two or three live neighbours lives on to the next generation.
		if(n > 3.){ outColor.a = 0.; }             //Any live cell with more than three live neighbours dies, as if by overcrowding.
	}else{
		if(n == 3.){ outColor.a = 1.; }            //Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
	}
	
	outColor.a = shapeCheck(outColor.a);
	
	oldColor.rgb = hueShift(oldColor.rgb, COLOR_SPEED); //hue shift the old color

	if(outColor.a == 0.){ outColor.rgb = oldColor.rgb; }                                  //if cell is dead use old color
	if(outColor.a == 1.){ outColor.rgb = hueShift(vec3(1., 0., 0.), time*COLOR_SPEED);  } //if cell is alive use new color
	
	
	gl_FragColor = outColor;
}