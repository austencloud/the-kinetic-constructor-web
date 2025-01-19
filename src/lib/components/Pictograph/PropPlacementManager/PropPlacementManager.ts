import type { PropInterface } from '../Prop/PropInterface';
import { BetaPropPositioner } from './BetaPropPositioner';
import { DefaultPropPositioner } from './DefaultPropPositioner';

export class PropPlacementManager {
    private betaPositioner: BetaPropPositioner;
    private defaultPositioner: DefaultPropPositioner;

    constructor() {
        this.betaPositioner = new BetaPropPositioner();
        this.defaultPositioner = new DefaultPropPositioner();
    }

    public updatePropPositions(props: PropInterface[]): void {
        const betaProps: PropInterface[] = [];
        const defaultProps: PropInterface[] = [];

        props.forEach((prop) => {
            if (prop.motion && prop.motion.pictographData.gridMode === 'diamond') {
                betaProps.push(prop);
            } else {
                defaultProps.push(prop);
            }
        });

        if (betaProps.length > 0) {
            this.betaPositioner.reposition(betaProps);
        }
        defaultProps.forEach((prop) => {
            this.defaultPositioner.setToDefaultPosition(prop);
        });
    }
}
