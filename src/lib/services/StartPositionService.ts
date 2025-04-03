// src/lib/services/StartPositionService.ts
import { sequenceDataService } from './SequenceDataService';
import type { PictographData } from '$lib/types/PictographData';
import type { SequenceBeat } from './SequenceDataService';

export class StartPositionService {
  convertPictographToStartPosition(pictograph: PictographData): SequenceBeat {
    return {
      beat: 0,
      start_pos: pictograph.startPos ?? undefined,
      end_pos: pictograph.endPos ?? undefined,
      blue_attributes: {
        motion_type: pictograph.blueMotionData?.motionType || 'static',
        start_ori: pictograph.blueMotionData?.startOri || 'in',
        prop_rot_dir: pictograph.blueMotionData?.propRotDir || 'no_rot',
        start_loc: pictograph.blueMotionData?.startLoc || 's',
        end_loc: pictograph.blueMotionData?.endLoc || 's',
        turns: pictograph.blueMotionData?.turns || 0,
        end_ori: pictograph.blueMotionData?.endOri || 'in'
      },
      red_attributes: {
        motion_type: pictograph.redMotionData?.motionType || 'static',
        start_ori: pictograph.redMotionData?.startOri || 'in',
        prop_rot_dir: pictograph.redMotionData?.propRotDir || 'no_rot',
        start_loc: pictograph.redMotionData?.startLoc || 'e',
        end_loc: pictograph.redMotionData?.endLoc || 'e',
        turns: pictograph.redMotionData?.turns || 0,
        end_ori: pictograph.redMotionData?.endOri || 'in'
      },
      timing: 'none',
      direction: 'none'
    };
  }

  async addStartPosition(pictograph: PictographData) {
    const startPositionBeat = this.convertPictographToStartPosition(pictograph);
    await sequenceDataService.addStartPosition(startPositionBeat);
  }
}

export const startPositionService = new StartPositionService();
export default startPositionService;