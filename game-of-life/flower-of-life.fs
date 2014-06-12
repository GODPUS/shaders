/*
from: http://gmc.yoyogames.com/index.php?showtopic=583967

// Constants:
//   (cx, cy) = center position
//   r = size of hexagon
// Arguments:
//   argument0 = tier number (1, 2, 3, ...)
//   argument1 = side number (0 to 5)
//   argument2 = index of the hexagon on the side (0 to argument0-1)
// The result is set to two variables, xx and yy.
var angle;
angle = argument1 * 60; // angle from the center to the start position of the side
xx = cx + lengthdir_x(r * argument0, angle) + lengthdir_x(r, angle + 120) * argument2;
yy = cy + lengthdir_y(r * argument0, angle) + lengthdir_y(r, angle + 120) * argument2;

*/


#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;


float RADIUS = 20.;
const float SQRT3 = 1.73205080757;
vec2 MIDDLE     = vec2(resolution.x/2.,resolution.y/2.);
float THICKNESS = 1.;

const float NUM_FLOWER_LAYERS = 10.;
float FLOWER_CIRCLE_RADIUS = RADIUS; //do RADIUS/2. for metatron

void main( void ) {
	
	vec4 newColor = vec4(0.);
	vec2 position = vec2(0.);
	
	for(float i = 1.; i <= NUM_FLOWER_LAYERS; i++)
	{		
		for(float j = 1.; j <= 6.; j++){
			
			for(float k = 1.; k <= NUM_FLOWER_LAYERS; k++){
				if(k <= i)
				{
					float angle = (float(j)*60.)+30.;
					float angle2 = angle+120.;
					angle *= 0.0174532925; //degrees to radians
					angle2 *= 0.0174532925; //degrees to radians
					
					
					position.x = MIDDLE.x+(cos(angle)*(RADIUS*i));
					position.x += (cos(angle2)*RADIUS)*k;
					position.y = MIDDLE.y+(sin(angle)*(RADIUS*i));
					position.y += (sin(angle2)*RADIUS)*k;
					
					if(distance(gl_FragCoord.xy, position) < FLOWER_CIRCLE_RADIUS && distance(gl_FragCoord.xy, position) > (FLOWER_CIRCLE_RADIUS-THICKNESS) )
					{
						newColor.r = 1.;
					}
					
				}else{
					break;
				}
			}
		}
			
	}
	
	//center circle
	if(distance(gl_FragCoord.xy, MIDDLE) < FLOWER_CIRCLE_RADIUS && distance(gl_FragCoord.xy, MIDDLE) > (FLOWER_CIRCLE_RADIUS-THICKNESS) ){ newColor.r = 1.; }
	
	
	gl_FragColor = newColor;
}