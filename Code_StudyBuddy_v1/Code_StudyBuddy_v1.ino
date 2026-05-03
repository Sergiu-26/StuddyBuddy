#include "DHT.h"             
#include <SoftwareSerial.h> 
#include <Adafruit_NeoPixel.h> 

// --- SENSOR PINS ---
#define DHTPIN 10             
#define DHTTYPE DHT11        
DHT dht(DHTPIN, DHTTYPE);    

SoftwareSerial espSerial(2, 3);

int trigPin = 11;    
int echoPin = 12;    
int buttonPin = 7;   
int lightPin = A1;   
int airQPin = A0;    
int airThreshold = 400; 

float duration_us, distance_cm;

// --- 1. LED STRIP SETTINGS (For Status) ---
#define STRIP_PIN 8            
#define NUM_LEDS 17            
Adafruit_NeoPixel strip(NUM_LEDS, STRIP_PIN, NEO_GRB + NEO_KHZ800);

// --- 2. RGB LED SETTINGS (For Ambient Lamp) ---
int redPin = 5;
int greenPin = 6;
int bluePin = 9;  

float brightness = 0.1; 

// --- TIMER VARIABLES ---
unsigned long focusStartTime = 0; 
unsigned long totalFocusTime = 0; 
unsigned long study_session_count = 0;

unsigned long pauseStartTime = 0;
unsigned long totalPauseTime = 0;
unsigned long break_session_count = 0;

enum State { IDLE, FOCUSED, PAUSED };
State currentState = IDLE; 

void setup() {
  Serial.begin(9600);      
  espSerial.begin(9600);   
  
  // Sensor Pins
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(buttonPin, INPUT_PULLUP);
  pinMode(lightPin, INPUT);          
  pinMode(airQPin, INPUT);           
  
  // RGB Lamp Pins
  pinMode(redPin, OUTPUT);             
  pinMode(greenPin, OUTPUT);
  pinMode(bluePin, OUTPUT);

  dht.begin();                       

  // Start the LED strip
  strip.begin();
  strip.show(); 

  // Set initial state
  setStripColor(0, 0, 255); // Blue Strip for IDLE
  Serial.println("--- System IDLE ---");
}

void loop() {
  // --- LIGHT SENSOR & BRIGHTNESS LOGIC ---
  int lightLevel = analogRead(lightPin);
  
  // Map the analog value to a brightness multiplier (0.05 to 1.00)
  brightness = map(lightLevel, 0, 500, 100, 5) / 100.0; 

  // 1. UPDATE THE RGB LAMP (Warm Yellow: 255 Red, 180 Green, 0 Blue)
  analogWrite(redPin, 255 * brightness);
  analogWrite(greenPin, 255 * brightness);
  analogWrite(bluePin, 255 * brightness);

  // 2. UPDATE THE STRIP BRIGHTNESS (0-255 scale)
  strip.setBrightness(255);

  // Re-apply the current strip color so its brightness updates immediately
  if (currentState == IDLE) {
    setStripColor(0, 0, 255); // Blue
  } else if (currentState == FOCUSED) {
    setStripColor(0, 255, 0); // Green
  } else if (currentState == PAUSED) {
    setStripColor(255, 0, 0); // Red
  }


  // --- BUTTON RESET LOGIC ---
  if (digitalRead(buttonPin) == LOW) { 
    if (currentState == FOCUSED) {
      totalFocusTime += (millis() - focusStartTime);
    } else if (currentState == PAUSED) {
      totalPauseTime += (millis() - pauseStartTime);
    }

    if (currentState != IDLE) {
      study_session_count += 1;
      Serial.println("\n=== SESSION SUMMARY ===");
      Serial.print("Total Focused Time: ");
      Serial.print(totalFocusTime / 1000);
      Serial.println(" seconds");
      Serial.print("Total Break Time: ");
      Serial.print(totalPauseTime / 1000);
      Serial.println(" seconds");
      Serial.println("=======================\n");
    }

    totalFocusTime = 0; 
    totalPauseTime = 0;
    break_session_count = 0;
    currentState = IDLE;       
    setStripColor(0, 0, 255); // Blue Strip
    Serial.println(">>> TIMER RESET TO 0. System IDLE. <<<");
    delay(200); 
  }

  // ULTRASONIC SENSOR LOGIC
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  duration_us = pulseIn(echoPin, HIGH);
  distance_cm = 0.017 * duration_us;

  if (distance_cm < 10) {
    if (currentState != FOCUSED) {
      if (currentState == PAUSED) {
        totalPauseTime += (millis() - pauseStartTime);
      }
      
      // Figure out what color we are fading from (Red if Paused, Blue if Idle)
      int startRed = (currentState == PAUSED) ? 255 : 0;
      int startBlue = (currentState == IDLE) ? 255 : 0;

      // Smoothly fade out the current color to black
      for (int i = 100; i >= 0; i -= 2) {
        setStripColor((startRed * i) / 100, 0, (startBlue * i) / 100);
        delay(10);
      }
      
      // Smoothly fade the new Green color in
      for (int i = 0; i <= 100; i += 2) {
        setStripColor(0, (255 * i) / 100, 0);
        delay(15);
      }
      
      // Lock it exactly to full green at the end
      setStripColor(0, 255, 0); 
      // -------------------------------------

      currentState = FOCUSED;
      focusStartTime = millis();
      Serial.println("--- Focus mode ON ---");
    }
    
    unsigned long currentSessionTime = millis() - focusStartTime;
    unsigned long currentTotalTime = totalFocusTime + currentSessionTime;

    if (currentTotalTime/1000 == 15) { // Time for a break warning
      Serial.println("Time for a break!");
      for(int j=0; j<3; j++) {
        setStripColor(128, 0, 128); delay(1000); // Purple Strip
        setStripColor(0, 0, 0);     delay(1000); // Off
      }
      setStripColor(0, 255, 0); // Back to Green
    }
    
  } else {
    if (currentState == FOCUSED) {
      currentState = PAUSED;
      totalFocusTime += (millis() - focusStartTime);
      pauseStartTime = millis();
      Serial.println("--- Focus mode OFF (Phone Removed) ---");
      setStripColor(255, 0, 0); // Red Strip
      break_session_count += 1;
    }
  }

  // --- AIR QUALITY WARNING ---
  int airValue = analogRead(airQPin);
  if (airValue > airThreshold) {
    Serial.println("!!! WARNING: Poor Air Quality! !!!");
    setStripColor(255, 0, 255); delay(1000); // Purple Strip
    setStripColor(0, 0, 0);     delay(1000);
    setStripColor(255, 0, 255); delay(1000);
  }
  
  // --- DHT SENSOR ---
  static unsigned long lastDHTRead = 0;
  if (millis() - lastDHTRead >= 2000) { 
    lastDHTRead = millis();
    float h = dht.readHumidity();
    float t = dht.readTemperature();
  }
  
  // --- CALCULATE LIVE SESSION TIMES FOR FIREBASE ---
  unsigned long currentTotalFocus = totalFocusTime;
  if (currentState == FOCUSED) {
    currentTotalFocus += (millis() - focusStartTime);
  }
  
  unsigned long currentTotalPause = totalPauseTime;
  if (currentState == PAUSED) {
    currentTotalPause += (millis() - pauseStartTime);
  }

  // --- SEND EXPANDED DATA TO ESP8266 ---
  espSerial.print("<"); 
  espSerial.print(currentState); 
  espSerial.print(",");
  espSerial.print(distance_cm);
  espSerial.print(",");
  espSerial.print(airValue);
  espSerial.print(",");
  espSerial.print(lightLevel); 
  espSerial.print(",");
  espSerial.print(currentTotalFocus / 1000); 
  espSerial.print(",");
  espSerial.print(currentTotalPause / 1000); 
  espSerial.print(",");
  espSerial.print(study_session_count);
  espSerial.print(",");
  espSerial.println(break_session_count);
  
  delay(500);
}

// --- HELPER FUNCTION: Apply color to the LED Strip ---
void setStripColor(int redValue, int greenValue, int blueValue) {
  for(int i = 0; i < NUM_LEDS; i++) {
    strip.setPixelColor(i, strip.Color(redValue, greenValue, blueValue));
  }
  strip.show(); 
}