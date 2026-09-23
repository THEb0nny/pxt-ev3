namespace pxsim {

    export class NXTTouchSensorNode extends AnalogSensorNode {
        private static readonly RAW_RELEASED = 4800;

        id = NodeType.NXTTouchSensor;

        private pressed: boolean[] = [false];

        constructor(port: number) {
            super(port);
        }

        public setPressed(pressed: boolean) {
            this.pressed.push(pressed);
            this.setChangedState();
        }

        public isPressed() {
            return this.pressed;
        }

        public getValue() {
            if (this.pressed.length) {
                if (this.pressed.pop()) return 0;
            }
            return NXTTouchSensorNode.RAW_RELEASED;
        }

        getDeviceType() {
            return DAL.DEVICE_TYPE_NXT_TOUCH;
        }

        public hasData() {
            return this.pressed.length > 0;
        }

        getAnalogReadPin() {
            return AnalogOff.InPin1;
        }

        isNXT() {
            return true;
        }
    }
}