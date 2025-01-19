import { Motion } from './Motion';
import type { PropType, Orientation } from '../Prop/PropTypes';
import type { PropRotDir } from './MotionInterface';

export function createMotion(
	data: any,
	pictograph: any,
	color: 'red' | 'blue',
	startOri: Orientation,
	propRotDir: PropRotDir
): Motion {
	const motion = new Motion({
		pictograph,
		motionType: data?.motion?.type ,
		startLoc: data?.motion?.startLoc,
		endLoc: data?.motion?.endLoc ,
		startOri: data?.motion?.startOri ,
		endOri: data?.motion?.endOri ,
		propRotDir,
		color,
		turns: 0,
		leadState: color === 'red' ? 'leading' : 'trailing',
		prefloatMotionType: null,
		prefloatPropRotDir: null,
		handRotDir: propRotDir === 'cw' ? 'cw_handpath' : 'ccw_handpath'
	});

	// Arrow and Prop will be instantiated declaratively in the markup
	motion.arrow = null;
	motion.prop = null;

	return motion;
}
