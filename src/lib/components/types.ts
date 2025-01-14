export interface PictographAttributes {
    start_loc: string;
    end_loc: string;
    start_ori: string;
    end_ori: string;
    motion_type: string;
  }
  
  export interface PictographData {
    beat: number;
    sequence_start_position: string;
    letter: string;
    end_pos: string;
    blue_attributes: PictographAttributes;
    red_attributes: PictographAttributes;
  }
  