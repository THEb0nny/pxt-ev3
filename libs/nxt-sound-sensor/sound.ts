enum NXTSoundSensorMode {
    //% block="dB"
    Db = 0,
    //% block="dBA"
    DbA = 1
}

namespace sensors {

    const enum InternalSoundMode {
        Db = 0,
        DbA = 1,
        RawDb = 2,
        RawDbA = 3
    }

    const dcmModeDb = "0";
    const dcmModeDbA = "2";

    //% fixedInstances
    export class NXTSoundSensor extends internal.AnalogSensor {

        // https://github.com/mindboards/ev3sources-xtended/blob/master/ev3sources/lms2012/lms2012/Linux_AM1808/sys/settings/typedata.rcf

        constructor(port: number) {
            super(port);
            this.setMode(InternalSoundMode.DbA);
        }

        _query() {
            const raw = this._readPin1(); // Read the raw 12-bit ADC value (0-4095) from Pin 1

            if (this.mode === InternalSoundMode.RawDb || this.mode === InternalSoundMode.RawDbA) {
                return [raw];
            }

            let level = Math.map(raw, 4095, 0, 0, 100); // Map the raw value to a percentage (0-100)
            level = Math.round(Math.clamp(0, 100, level)); // Clamp the values and round to integer
            return [level];
        }

        _info() {
            if (this.mode === InternalSoundMode.RawDb || this.mode === InternalSoundMode.RawDbA) {
                return [`${this._query()[0]}`];
            }
            return [`${this._query()[0]}%`];
        }

        _update(prev: number, curr: number) {
            // Pass
        }

        _deviceType() {
            return DAL.DEVICE_TYPE_NXT_SOUND;
        }
        
        setMode(m: InternalSoundMode) {
            const modeChanged = this.isActive() && this.mode != m;
            this._setMode(m);
            if (modeChanged) {
                const useDbA = (m === InternalSoundMode.DbA || m === InternalSoundMode.RawDbA);
                this._writeDcm(useDbA ? dcmModeDbA : dcmModeDb);
            }
        }

        /**
         * Get the current sound level measured by the NXT sound sensor.
         * Returns a number between 0 and 100 representing the sound volume.
         * @param mode mode dB (raw volume, all frequencies) or dBA (human ear sensitivity), eg: NXTSoundSensorMode.dBA
         */
        //% block="**nxt sound sensor** %this|sound level $mode"
        //% blockId=nxtSoundSensorLevel
        //% parts="nxtsoundsensor"
        //% blockNamespace=sensors
        //% this.fieldEditor="images"
        //% this.fieldOptions.columns="4"
        //% this.fieldOptions.width="300"
        //% weight=99 blockGap=8
        //% subcategory="NXT"
        //% group="Sound Sensor"
        soundLevel(mode: NXTSoundSensorMode): number {
            if (!this.isActive()) return 0;
            const internalMode = mode === NXTSoundSensorMode.DbA ? InternalSoundMode.DbA : InternalSoundMode.Db;
            this.setMode(internalMode);
            this.poke();
            return this._query()[0];
        }

        /**
         * Get the raw ADC value from the NXT sound sensor.
         * Returns a number between 0 and 4095 (Note: 4095 = silence, 0 = very loud).
         * @param mode mode dB (raw volume, all frequencies) or dBA (human ear sensitivity), eg: NXTSoundSensorMode.dBA
         */
        //% block="**nxt sound sensor** %this|raw value $mode"
        //% blockId=nxtSoundSensorRawValue
        //% parts="nxtsoundsensor"
        //% blockNamespace=sensors
        //% this.fieldEditor="images"
        //% this.fieldOptions.columns="4"
        //% this.fieldOptions.width="300"
        //% weight=89 blockGap=8
        //% subcategory="NXT"
        //% group="Sound Sensor"
        rawValue(mode: NXTSoundSensorMode): number {
            if (!this.isActive()) return 0;
            const internalMode = mode === NXTSoundSensorMode.DbA ? InternalSoundMode.RawDbA : InternalSoundMode.RawDb;
            this.setMode(internalMode);
            this.poke();
            return this._query()[0]; // Returns the raw 12-bit value (0-4095)
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