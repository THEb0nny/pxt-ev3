namespace pxsim {

    export class SensorNode extends BaseNode {

        protected mode: number;
        protected valueChanged: boolean;
        protected modeChanged: boolean;
        protected modeReturnsArray: boolean;

        constructor(port: number) {
            super(port);
        }

        getDeviceType() {
            return DAL.DEVICE_TYPE_NONE;
        }

        public isUart() {
            return true;
        }

        public isAnalog() {
            return false;
        }

        public isNXT() {
            return false;
        }

        public getAnalogPin() {
            return AnalogOff.InPin6; // Deflault for EV3 sensor
        }

        setMode(mode: number) {
            this.mode = mode;
            this.changed = true;
            this.modeChanged = true;
            this.modeReturnsArray = false;
        }

        getMode() {
            return this.mode;
        }

        public returnsArray() {
            return this.modeReturnsArray;
        }

        public getValue() {
            return 0;
        }

        public getValues() {
            return [this.getValue()];
        }

        public hasData() {
            return true;
        }

        valueChange() {
            const res = this.valueChanged;
            this.valueChanged = false;
            return res;
        }

        modeChange() {
            const res = this.modeChanged;
            this.modeChanged = false;
            return res;
        }

        setChangedState() {
            this.changed = true;
            this.valueChanged = false;
        }
    }

    export class AnalogSensorNode extends SensorNode {

        constructor(port: number) {
            super(port);
        }

        public isUart() {
            return false;
        }

        public isAnalog() {
            return true;
        }
    }

    export class UartSensorNode extends SensorNode {

        constructor(port: number) {
            super(port);
        }

        hasChanged() {
            return this.changed;
        }
    }
}