/// <reference path="./moduleView.ts" />

namespace pxsim.visuals {

    export class MediumMotorView extends MotorView implements LayoutElement {

        constructor(port: number) {
            super(MEDIUM_MOTOR_SVG, "medium-motor", NodeType.MediumMotor, port, "medmotor_Hole");
        }

        protected optimizeForLightMode() {
            (this.content.getElementById(this.normalizeId('medmotor_box_wgradient')) as SVGElement).style.fill = '#a8aaa8';
        }

        public getPaddingRatio() {
            return 1 / 8;
        }

        getWiringRatio() {
            return 0.5;
        }

        protected renderMotorAngle(holeEl: Element, angle: number) {
            const width = 44.45;
            const height = 44.45;
            const transform = `translate(2 1.84) rotate(${angle} ${width / 2} ${height / 2})`;
            holeEl.setAttribute("transform", transform);
        }

        protected positionMotorLabel(reverse: boolean) {
            this.motorLabelGroup.setAttribute('transform', 'translate(25 25)');
            this.motorLabel.style.fontSize = '11px';
            if (reverse) {
                this.motorReverseLabelGroup.setAttribute('transform', `translate(25 12)`);
                this.motorReverseLabel.style.fontSize = '9px';
            }
        }
    }
}