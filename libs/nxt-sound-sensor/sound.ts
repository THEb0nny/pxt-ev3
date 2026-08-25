export enum NxtSoundSensorMode {
    //% block="dB"
    Db = 0,
    //% block="dBA"
    DbA = 1
}

namespace sensors {

    //% fixedInstances
    export class NXTSoundSensor extends internal.AnalogSensor {

        // https://github.com/mindboards/ev3sources-xtended/blob/master/ev3sources/lms2012/lms2012/Linux_AM1808/sys/settings/typedata.rcf

        constructor(port: number) {
            super(port);
        }

        _query() {
            return [this.soundLevel()];
        }

        _info() {
            return [`${this.soundLevel()}%`];
        }

        _deviceType() {
            return DAL.DEVICE_TYPE_NXT_SOUND;
        }

        /**
         * Get the current sound level measured by the NXT sound sensor.
         * @returns a number between 0 and 100 representing the sound volume.
         */
        //% block="**nxt sound sensor** %this|sound level"
        //% blockId=nxtSoundSensorLevel
        //% parts="nxtsoundsensor"
        //% blockNamespace=sensors
        //% this.fieldEditor="images"
        //% this.fieldOptions.columns="4"
        //% this.fieldOptions.width="300"
        //% weight=50 blockGap=8
        //% subcategory="NXT"
        //% group="Sound Sensor"
        soundLevel(): number {
            this.poke();
            // Read the raw 12-bit ADC value (0-4095) from Pin 1
            let raw = this._readPin1();
            
            // Map the raw value to a percentage (0-100).
            // Assuming silence gives max voltage (~4095) and loud sound drops the voltage.
            let level = Math.round((4095 - raw) / 40.95);
            
            // Clamp the values to ensure they stay within 0-100%
            if (level < 0) return 0;
            if (level > 100) return 100;
            
            return level;
        }
    }

    //% whenUsed block="1" weight=95 fixedInstance jres=icons.port1
    export const nxtSound1 = new NXTSoundSensor(1);

    //% whenUsed block="2" weight=95 fixedInstance jres=icons.port2
    export const nxtSound2 = new NXTSoundSensor(2);

    //% whenUsed block="3" weight=95 fixedInstance jres=icons.port3
    export const nxtSound3 = new NXTSoundSensor(3);

    //% whenUsed block="4" weight=95 fixedInstance jres=icons.port4
    export const nxtSound4 = new NXTSoundSensor(4);
}