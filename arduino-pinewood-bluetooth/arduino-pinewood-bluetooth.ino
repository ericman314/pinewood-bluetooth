#include <ArduinoBLE.h>

BLEService ledService("ca3a80e0-c454-4fcb-b3cd-94070115afb2"); // create service

// Use BLEWrite so device can set these chars manually in debug mode
BLEUnsignedLongCharacteristic lane1Char("ca3a80e1-c454-4fcb-b3cd-94070115afb2", BLERead | BLENotify | BLEWrite);
BLEUnsignedLongCharacteristic lane2Char("ca3a80e2-c454-4fcb-b3cd-94070115afb2", BLERead | BLENotify | BLEWrite);
BLEUnsignedLongCharacteristic lane3Char("ca3a80e3-c454-4fcb-b3cd-94070115afb2", BLERead | BLENotify | BLEWrite);
BLEUnsignedLongCharacteristic lane4Char("ca3a80e4-c454-4fcb-b3cd-94070115afb2", BLERead | BLENotify | BLEWrite);
BLEByteCharacteristic statusChar("ca3a80e5-c454-4fcb-b3cd-94070115afb2", BLERead | BLENotify | BLEWrite);
BLEByteCharacteristic pinStateChar("ca3a80e6-c454-4fcb-b3cd-94070115afb2", BLERead | BLENotify | BLEWrite);

int pins[] = {3, 2, 4, 5};
int pinState[] = {0, 0, 0, 0};
int pinStateLast[] = {-1, -1, -1, -1};

int pinLED = 13;

const int ledRed = 22;
const int ledGreen = 23;
const int ledBlue = 24;

int pinStartSensor = 6;

const byte READY = 0;
const byte RUNNING = 1;

byte state = READY;

unsigned long tstart = 0;

int finished[] = {0, 0, 0, 0};
int nFinished = 0;

void setup() {
  Serial.begin(115200);

  for(int i=0; i<4; i++) {
    pinMode(pins[i], INPUT_PULLUP);
  }

  pinMode(pinStartSensor, INPUT_PULLUP);

  // begin initialization
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");

    while (1);
  }

   // set the local name peripheral advertises
  BLE.setLocalName("Pinewood Derby Track");
  // set the UUID for the service this peripheral advertises:
  BLE.setAdvertisedService(ledService);

  // add the characteristics to the service
  ledService.addCharacteristic(lane1Char);
  ledService.addCharacteristic(lane2Char);
  ledService.addCharacteristic(lane3Char);
  ledService.addCharacteristic(lane4Char);
  ledService.addCharacteristic(statusChar);  
  ledService.addCharacteristic(pinStateChar);

  // add the service
  BLE.addService(ledService);

  // Set initial values
  lane1Char.writeValue(0);
  lane2Char.writeValue(0);
  lane3Char.writeValue(0);
  lane4Char.writeValue(0);
  statusChar.writeValue(0);
  pinStateChar.writeValue(state);
    
  // start advertising
  BLE.advertise();

  Serial.println("Setup");
}

int startSensor = 1;
int startSensorHold = 1;
int startSensorLast = 1;
int startSensorHoldLast = 1;
unsigned long tStartSensor = 0;

void loop() {
  
  // poll for BLE events
  BLE.poll();

  unsigned long t = micros();

  unsigned long telapsed = t - tstart;  
  unsigned long tStartSensorElapsed = t - tStartSensor;

  // Create on/off delay for start sensor
  startSensorLast = startSensor;
  startSensor = digitalRead(pinStartSensor);
  startSensorHoldLast = startSensorHold;
  
  if(startSensor != startSensorLast) {
    tStartSensor = t;
  }
  else if(tStartSensorElapsed > 500000 && startSensorHold && (!startSensor)) {  // 0.5 sec delay
    startSensorHold = startSensor;
  }
  else if(tStartSensorElapsed > 10000 && (!startSensorHold) && startSensor) {  // 10 ms delay
    startSensorHold = startSensor;
  }

  // Read current pin states
  for(int i=0; i<4; i++) {
    pinState[i] = digitalRead(pins[i]);
  }

  if(state == READY)
  {

    // Report pin state changes
    byte newPinState = 0;
    byte oldPinState = 0;
    for(int i=0; i<4; i++) {
      newPinState += pinState[i] << i;
      oldPinState += pinStateLast[i] << i;
      if (pinStateLast[i] != pinState[i]) {
        Serial.print("Pin state change,");
        Serial.print(i);
        Serial.print(",");
        Serial.println(pinState[i]);
      }
    }
    if (newPinState != oldPinState) {
      pinStateChar.writeValue(newPinState);
    }
    
    if(startSensorHold && !startSensorHoldLast) // Gate released
    {
      // Verify all sensors are OK
      int allSensorsOk = 1;
      for(int i=0; i<4; i++) {
        if (!pinState[i]) {
          Serial.print("Error: Sensor ");
          Serial.print(i);
          Serial.println(" is occluded at start");
          allSensorsOk = 0;
        }
      }

      if (allSensorsOk) {
        state = RUNNING;
        tstart = micros();
        Serial.println("Start");
        statusChar.writeValue(RUNNING);
        for(int i=0; i<4; i++) {
          finished[i] = 0;
        }
        nFinished = 0;
      }
    }
  }
  else if(state == RUNNING)
  {   
    for(int i=0; i<4; i++) {
      if(!pinState[i] && !finished[i])
      {
        finished[i] = 1;
        nFinished++;
        Serial.print("Trigger,");
        Serial.print(i);
        Serial.print(",");
        Serial.println(telapsed);
        if (i == 0) {
          lane1Char.writeValue(telapsed);
        } else if (i == 1) {
          lane2Char.writeValue(telapsed);
        } else if (i == 2) {
          lane3Char.writeValue(telapsed);
        } else if (i == 3) {
          lane4Char.writeValue(telapsed);
        }
      }
    }
   
    if(!startSensorHold && telapsed > 6000000)
    {
      state = READY;
      Serial.println("Ready");
      lane1Char.writeValue(0);
      lane2Char.writeValue(0);
      lane3Char.writeValue(0);
      lane4Char.writeValue(0);
      statusChar.writeValue(READY);
      // Report all pin states
      byte newPinState = 0;
      for(int i=0; i<4; i++) {
        newPinState += pinState[i] << i;
        if (pinStateLast[i] != pinState[i]) {
          Serial.print("Pin state change,");
          Serial.print(i);
          Serial.print(",");
          Serial.println(pinState[i]);
        }
      }
      pinStateChar.writeValue(newPinState);
    }
  }

  // Remember last pin states
  for(int i=0; i<4; i++) {
    pinStateLast[i] = pinState[i];
  }

  // Show connected status
  if (BLE.connected()) {
    // Color RGB LED depending on our state
    if (statusChar.value() == 1 && lane1Char.value() > 0 && lane2Char.value() > 0 && lane3Char.value() > 0 && lane4Char.value() > 0) {
      // Race finished (blue)
      digitalWrite(ledRed, HIGH);
      digitalWrite(ledGreen, HIGH);
      digitalWrite(ledBlue, LOW);
    } else if (statusChar.value() == 1) {
      // Race in progress (off)
      digitalWrite(ledRed, HIGH);
      digitalWrite(ledGreen, HIGH);
      digitalWrite(ledBlue, HIGH);
    } else if (pinStateChar.value() != 15) {
      // Ready, but a sensor is blocked (yellow)
      digitalWrite(ledRed, LOW);
      digitalWrite(ledGreen, LOW);
      digitalWrite(ledBlue, HIGH);
    } else {
      // Ready (green)
      digitalWrite(ledRed, HIGH);
      digitalWrite(ledBlue, HIGH);
      digitalWrite(ledGreen, LOW);
    }
  } else {
    // Not connected (red)
    digitalWrite(ledRed, LOW);
    digitalWrite(ledGreen, HIGH);
    digitalWrite(ledBlue, HIGH);
  }

}
