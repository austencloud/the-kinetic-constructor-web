import type { ArrowInterface } from "./ArrowInterface";

export default class ProRotAngleCalculator {
    private directionMapCW = {
        n: 315,
        e: 45,
        s: 135,
        w: 225,
        ne: 0,
        se: 90,
        sw: 180,
        nw: 270
    };

    private directionMapCCW = {
        n: 315,
        e: 225,
        s: 135,
        w: 45,
        ne: 270,
        se: 180,
        sw: 90,
        nw: 0
    };

    public calculate(arrowData: ArrowInterface): number {
        const directionMap =
            arrowData.motion.propRotDir === 'cw' ? this.directionMapCW : this.directionMapCCW;
        return directionMap[arrowData.loc as keyof typeof directionMap] ?? 0;
    }
}
