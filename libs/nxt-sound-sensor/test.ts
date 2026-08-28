forever(function () {
    let level = sensors.nxtSound1.soundLevel(NXTSoundSensorMode.DbA);
    
    let raw = sensors.nxtSound1.rawValue(NXTSoundSensorMode.Db);
    
    brick.showString("Sound Sensor", 1);
    brick.showValue("Level (dBA)", level, 3);
    brick.showValue("Raw (dB)", raw, 4);
    
    pause(50);
})