#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

float RADIUS = 50.;
const float SQRT3 = 1.73205080757;
vec2 MIDDLE     = vec2(resolution.x/2.,resolution.y/2.);
float THICKNESS = 1.;

void main( void ) {
	
	vec4 newColor = vec4(0.);

	int initialNum = 6;

	for(int j = 1; j <= 5; j++)
	{
		int numCircles = (initialNum*j);

		for(int i = 1; i <= 10000; i++)
		{	
			if(i <= numCircles)
			{
				float rotation = 30.;
				//rotation = time*10.; //spinning
				
				float angle = (((360./float(numCircles))*float(i))+rotation)*0.0174532925; //0.0174532925 degrees in a radian
				vec2 circleCenter = vec2(0., 0.);
				float SIZE = 0.;

				if(mod(float(i), float(j)) == 0.)
				{
					SIZE = RADIUS*2.;
					circleCenter = vec2(MIDDLE.x+(cos(angle)*(SIZE*float(j))), MIDDLE.y+(sin(angle)*(SIZE*float(j))));
				}else{
					SIZE = RADIUS*(SQRT3);
					circleCenter = vec2(MIDDLE.x+(cos(angle)*(SIZE*float(j))), MIDDLE.y+(sin(angle)*(SIZE*float(j))));
				}
				
				if(distance(gl_FragCoord.xy, circleCenter) < RADIUS && distance(gl_FragCoord.xy, circleCenter) > (RADIUS-THICKNESS) )
				{
					newColor.r = 1.;
				}
			}else{
				break;
			}
		}
	}
	
	//center circle
	if(distance(gl_FragCoord.xy, MIDDLE) < (RADIUS) && distance(gl_FragCoord.xy, MIDDLE) > ((RADIUS)-THICKNESS) ){ newColor.r = 1.; }
	
	
	gl_FragColor = newColor;
}