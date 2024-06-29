const enum NXTTempSensorMode {
    //% block="сelsius"
    Celsius = 0,
    //% block="fahrenheit"
    Fahrenheit = 1,
}

namespace sensors {

    const MODE_SWITCH_DELAY = 100;

    //% fixedInstances
    export class NXTTemperatureSensor extends internal.IICSensor {

        // https://github.com/mindboards/ev3sources-xtended/blob/master/ev3sources/lms2012/lms2012/Linux_AM1808/sys/settings/typedata.rcf
        // https://github.com/ev3dev/lego-linux-drivers/blob/ev3dev-buster/sensors/nxt_i2c_sensor_defs.c
        
        constructor(port: number) {
            super(port);
            this.setMode(NXTTempSensorMode.Celsius);
        }

        _deviceType() {
            return DAL.DEVICE_TYPE_NXT_TEMPERATURE;
        }

        setMode(m: NXTTempSensorMode) {
            this._setMode(m);
        }

        _setMode(m: number) {
            let v = m | 0;
            this.mode = v;
            if (!this.isActive()) return;
            if (this.realmode != this.mode) {
                this.realmode = v;
                if (m == NXTTempSensorMode.Celsius) {
                    this.transaction(1, [76, NXTTempSensorMode.Celsius], 0);
                } else if (m == NXTTempSensorMode.Fahrenheit) {
                    this.transaction(1, [76, NXTTempSensorMode.Fahrenheit], 0);
                }
                pause(MODE_SWITCH_DELAY);
            }
        }

        /**
         * Gets the current temp mode
         */
        tempMode() {
            return <NXTTempSensorMode>this.mode;
        }

        _IICId() {
            return 'LEGOTemp.';
        }

        _query() {
            this.transaction(1, [76], 1);
            if (this.mode == NXTTempSensorMode.Celsius) {
                return [this.getBytes()[0]];
            } else if (this.mode == NXTTempSensorMode.Fahrenheit) {
                return [this.getBytes()[1]];
            }
            return [0];
        }

        _info() {
            if (this.mode == NXTTempSensorMode.Celsius) {
                return [`${this._query()[0].toString()}°C`];
            } else if (this.mode == NXTTempSensorMode.Fahrenheit) {
                return [`${this._query()[0].toString()}°F`];
            }
            return [this._query()[0].toString()];
            
        }

        /**
         * Measure the ambient or reflected light value from 0 (darkest) to 100 (brightest). For raw reflection values, the range can be from 0 to 4095.
         * @param sensor the color sensor port
         */
        //% help=sensors/nxt-temperature-sensor/temperature
        //% block="**nxt temperature sensor** $this|$mode"
        //% blockId=nxttemperature
        //% parts=nxttemperaturesensor
        //% blockNamespace=sensors
        //% this.fieldEditor="ports"
        //% weight=99 blockGap=8
        //% subcategory="NXT"
        //% group="Temperature Sensor"
        temperature(mode: NXTTempSensorMode) {
            this.setMode(mode);
            this.poke();
            switch (mode) {
                case NXTTempSensorMode.Celsius:
                    return this._query()[0];
                case NXTTempSensorMode.Fahrenheit:
                    return this._query()[1];
                default:
                    return -1;
            }
        }

    }

    //% whenUsed block="1" weight=95 fixedInstance jres=icons.port1
    export const nxtTemp1: NXTTemperatureSensor = new NXTTemperatureSensor(1);

    //% whenUsed block="2" weight=90 fixedInstance jres=icons.port2
    export const nxtTemp2: NXTTemperatureSensor = new NXTTemperatureSensor(2);

    //% whenUsed block="3" weight=90 fixedInstance jres=icons.port3
    export const nxtTemp3: NXTTemperatureSensor = new NXTTemperatureSensor(3);
    
    //% whenUsed block="4" weight=90 fixedInstance jres=icons.port4
    export const nxtTemp4: NXTTemperatureSensor = new NXTTemperatureSensor(4);
}
