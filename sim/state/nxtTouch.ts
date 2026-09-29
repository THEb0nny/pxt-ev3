namespace pxsim {

    export class NXTTouchSensorNode extends AnalogSensorNode {

        private static readonly RAW_RELEASED = 4800;

        id = NodeType.NXTTouchSensor;

        private pressed: boolean[] = [false];

        constructor(port: number) {
            super(port);
        }

        getDeviceType() {
            return DAL.DEVICE_TYPE_NXT_TOUCH;
        }

        isNXT() {
            return true;
        }

        getAnalogPin() {
            return AnalogOff.InPin1;
        }

        public getValue() {
            if (this.pressed.length) {
                if (this.pressed.pop()) return 0;
            }
            return NXTTouchSensorNode.RAW_RELEASED;
        }

        public setPressed(pressed: boolean) {
            this.pressed.push(pressed);
            this.setChangedState();
        }

        public isPressed() {
            return this.pressed;
        }

        public hasData() {
            return this.pressed.length > 0;
        }
    }
}