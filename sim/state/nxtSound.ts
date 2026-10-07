/// <reference path="./sensor.ts"/>

namespace pxsim {

    export enum NXTSoundSensorMode {
        None = -1,
        Db = 0,
        DbA = 1,
        RawDb = 2,
        RawDbA = 3
    }

    export class NXTSoundSensorNode extends AnalogSensorNode {

        id = NodeType.NXTSoundSensor;

        private value: number = 3900;
        public silentDb: number = 3900;
        public loudDb: number = 385;
        public silentDbA: number = 3900;
        public loudDbA: number = 385;

        constructor(port: number) {
            super(port);
        }

        getDeviceType() {
            return DAL.DEVICE_TYPE_NXT_SOUND;
        }

        getFamily() {
            return DeviceFamily.NXT;
        }

        getAnalogPin() {
            return AnalogOff.InPin1;
        }

        setMode(m: number) {
            super.setMode(m);
        }

        setValue(val: number) {
            if (this.value !== val) {
                this.value = val;
                this.changed = true;
                this.valueChanged = true;
            }
        }

        getValue() {
            return this.value;
        }
    }
}