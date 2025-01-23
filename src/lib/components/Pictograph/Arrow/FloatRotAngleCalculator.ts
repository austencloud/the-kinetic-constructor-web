import type { ArrowInterface } from "./ArrowInterface";
import type { Location } from "../Prop/PropInterface";
// Ensure Location does not include null

export default class DashRotAngleCalculator  {
    private noRotationMap: Record<Location, number> = {
        n: 90,
        s: 270,
        e: 180,
        w: 0,
        ne: 45,
        se: 135,
        sw: 225,
        nw: 315
    };

    private orientationRotationMapCW: Record<Location, number> = {
        n: 0,
        e: 90,
        s: 180,
        w: 270,
        ne: 45,
        se: 135,
        sw: 225,
        nw: 315
    };

    private orientationRotationMapCCW: Record<Location, number> = {
        n: 0,
        e: 270,
        s: 180,
        w: 90,
        ne: 315,
        se: 225,
        sw: 135,
        nw: 45
    };

    public calculate(arrowData: ArrowInterface): number {
        if (arrowData.motion.propRotDir === 'no_rot') {
            return this.noRotationMap[arrowData.loc as Location] ?? 0;
        }

        const orientationMap =
            arrowData.motion.propRotDir === 'cw'
                ? this.orientationRotationMapCW
                : this.orientationRotationMapCCW;

        return orientationMap[arrowData.loc as Location] ?? 0;
    }
}
