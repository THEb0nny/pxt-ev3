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

        private sound: number = 3890;
        public silentDb: number = 4095;
        public loudDb: number = 0;
        public silentDbA: number = 4095;
        public loudDbA: number = 0;

        constructor(port: number) {
            super(port);
            this.mode = -1;
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

        setMode(mode: number) {
            this.mode = mode;
            if (this.mode == NXTSoundSensorMode.Db) this.sound = 3890;
            else if (this.mode == NXTSoundSensorMode.DbA) this.sound = 3890;
            else this.sound = 3890;
            this.changed = true;
            this.modeChanged = true;
        }

        setSound(sound: number) {
            if (this.sound !== sound) {
                this.sound = sound;
                this.setChangedState();
            }
        }

        getValue() {
            return this.sound;
        }
    }
}
