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

const float COLOR_SPEED = 0.006; //higher is faster //values between 0.1 and 0.004 work best
float RADIUS    = 250.; 
float THICKNESS = 1.;
vec2 MIDDLE     = vec2(resolution.x/2.,resolution.y/2.);

//the square requires a thickness of at least 2.
//#define check_square
#define check_seed_of_life
//#define check_mouse

vec3 hueToRGB(float hue) {
    return clamp( 
        abs(mod(hue * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 
        0.0, 1.0);
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
	if(oldLeft < 1.){ oldLeft = 0.; }
	float oldRight = texture2D(backbuffer, right).a;
	if(oldRight < 1.){ oldRight = 0.; }
	float oldUp    = texture2D(backbuffer, up).a;
	if(oldUp < 1.){ oldUp = 0.; }
	float oldDown  = texture2D(backbuffer, down).a;
	if(oldDown < 1.){ oldDown = 0.; }
	float oldul    = texture2D(backbuffer, upleft).a;
	if(oldul < 1.){ oldul = 0.; }
	float oldur    = texture2D(backbuffer, upright).a;
	if(oldur < 1.){ oldur = 0.; }
	float olddl    = texture2D(backbuffer, downleft).a;
	if(olddl < 1.){ olddl = 0.; }
	float olddr    = texture2D(backbuffer, downright).a;	
	if(olddr < 1.){ olddr = 0.; }
	
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
	
	float newColorHueShiftAmount = abs(time*(COLOR_SPEED*16.666));
	newColorHueShiftAmount = (newColorHueShiftAmount - floor(newColorHueShiftAmount));
	if(newColorHueShiftAmount >= 1.){ newColorHueShiftAmount = 0.; }
	
	if(oldColor.a == 1.){
		if(n < 2.){ outColor.a = newColorHueShiftAmount; }   //Any live cell with fewer than two live neighbours dies, as if caused by under-population.
		if(n == 2. || n == 3.){ outColor.a = 1.; }         //Any live cell with two or three live neighbours lives on to the next generation.
		if(n > 3.){ outColor.a = newColorHueShiftAmount; } //Any live cell with more than three live neighbours dies, as if by overcrowding.
	}else if(oldColor.rgb == vec3(0.)){
		if(n == 3.){ outColor.a = 1.; }           //Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
	}else{
		if(n == 3.){ 
			outColor.a = 1.; 
		}else{ 
			outColor.a = oldColor.a+COLOR_SPEED; //hue shift old color if not black
			if(outColor.a >= 1.){ outColor.a = 0.; } 
		}
	}
	
	outColor.a = shapeCheck(outColor.a); //check to see if we are within any of the shapes that keep a cell on

	float distanceToCenter = distance(gl_FragCoord.xy, MIDDLE.xy);
	
	if(outColor.a < 1. && oldColor.rgb != vec3(0.)){ outColor.rgb = hueToRGB(outColor.a); } //if cell is dead use old hue shift amount
	if(outColor.a == 1.){ outColor.rgb = hueToRGB(newColorHueShiftAmount);  } //if cell is alive use new hue shift amount
	
	
	gl_FragColor = outColor;
}