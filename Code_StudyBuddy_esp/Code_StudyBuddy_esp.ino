#include <ESP8266WiFi.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <U8g2lib.h>
#include <SoftwareSerial.h>

// --- Firebase Libraries ---
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

// --- Wi-Fi Settings ---
const char* ssid     = "";
const char* password = "";

// --- Firebase Credentials ---
#define API_KEY "AIzaSyA_nQIKaQfMVcodfCIQRg6ouBlk-aZ2ydA"
#define DATABASE_URL "https://studybuddy-b4770-default-rtdb.europe-west1.firebasedatabase.app" 

// --- Time Settings ---
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 10800, 60000);

// --- Display Settings ---
U8G2_SSD1306_128X64_NONAME_1_HW_I2C display1(U8G2_R0, U8X8_PIN_NONE);
U8G2_SSD1306_128X64_NONAME_1_SW_I2C display2(U8G2_R0, /*clock*/ D6, /*data*/ D5, U8X8_PIN_NONE);

SoftwareSerial arduinoSerial(D7, D8);

// --- Firebase Objects & Timers ---
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;
unsigned long sendDataPrevMillis = 0;
const unsigned long timerDelay = 5000; 

// --- Logic Variables ---
enum State { IDLE, FOCUSED, PAUSED };
State currentState = IDLE;
unsigned long focusStartTime = 0;
unsigned long totalFocusTime = 0;
bool isOrange = false;

// --- Global Sensor Variables for Firebase ---
float currentDistance = 0.0;
int airQuality = 0;
int currentLight = 0;
int focusSeconds = 0;
int pauseSeconds = 0;
int sessionsCount = 0;
int breaksCount = 0;

// --- THE CHICKEN BITMAP ---
#define chicken_width 16
#define chicken_height 16
static const unsigned char chicken_bits[] U8X8_PROGMEM = {
   0x00, 0x00, 0x00, 0x00, 0x1C, 0x00, 0x3E, 0x00, 0x7A, 0x00, 0x3F, 0x00,
   0x1C, 0x0F, 0xFC, 0x1F, 0xFC, 0x3F, 0xF8, 0x1F, 0xF0, 0x0F, 0x40, 0x02,
   0x20, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
};

// --- HELPER FUNCTION: Convert seconds to "Xh Ym Zs" ---
String formatTime(int totalSeconds) {
  if (totalSeconds == 0) return "0s";
  int h = totalSeconds / 3600;
  int m = (totalSeconds % 3600) / 60;
  int s = totalSeconds % 60;
  
  String result = "";
  if (h > 0) result += String(h) + "h ";
  if (m > 0 || h > 0) result += String(m) + "m ";
  if (h == 0) result += String(s) + "s"; // Only show seconds if under an hour
  
  result.trim();
  return result;
}

void setup() {
  Serial.begin(9600); 
  arduinoSerial.begin(9600); 

  display1.begin();
  display2.begin();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  
  timeClient.begin();

  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.signUp(&config, &auth, "", "");
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

void loop() {
  timeClient.update();
  
  // --- PARSING LOGIC ---
  if (arduinoSerial.available()) {
    String val = arduinoSerial.readStringUntil('\n'); 
    val.trim(); 

    if (val.startsWith("<")) {
      val.remove(0, 1); 
      
      // Find all the commas
      int c1 = val.indexOf(',');
      int c2 = val.indexOf(',', c1 + 1);
      int c3 = val.indexOf(',', c2 + 1);
      int c4 = val.indexOf(',', c3 + 1);
      int c5 = val.indexOf(',', c4 + 1);
      int c6 = val.indexOf(',', c5 + 1);
      int c7 = val.indexOf(',', c6 + 1);
      
      if (c7 > -1) {
        int stateFromUno = val.substring(0, c1).toInt();
        currentDistance  = val.substring(c1 + 1, c2).toFloat();
        airQuality       = val.substring(c2 + 1, c3).toInt();
        currentLight     = val.substring(c3 + 1, c4).toInt();
        focusSeconds     = val.substring(c4 + 1, c5).toInt();
        pauseSeconds     = val.substring(c5 + 1, c6).toInt();
        sessionsCount    = val.substring(c6 + 1, c7).toInt();
        breaksCount      = val.substring(c7 + 1).toInt();
        
        // Timer Sync Logic for local display
        if (currentState != (State)stateFromUno) {
          if ((State)stateFromUno == FOCUSED) {
            focusStartTime = millis(); 
          } else if ((State)stateFromUno == IDLE) {
            totalFocusTime = 0; 
          } else if (currentState == FOCUSED && (State)stateFromUno == PAUSED) {
            totalFocusTime += (millis() - focusStartTime); 
          }
          currentState = (State)stateFromUno; 
        }

        isOrange = (airQuality > 400);
      }
    }
  }

  // --- FIREBASE UPLOAD TIMER ---
  if (Firebase.ready() && (millis() - sendDataPrevMillis > timerDelay || sendDataPrevMillis == 0)) {
    sendDataPrevMillis = millis();

    // 1. Upload Status
    String stateString = (currentState == FOCUSED) ? "Study Mode" : (currentState == PAUSED) ? "Paused" : "Idle Mode";
    String colorString = (currentState == FOCUSED) ? "#48bb78" : (currentState == PAUSED) ? "#e53e3e" : "#3182ce";
    Firebase.RTDB.setString(&fbdo, "/systemStatus/mode", stateString);
    Firebase.RTDB.setString(&fbdo, "/systemStatus/color", colorString);

    // 2. Upload Environment Sensors<
    String phoneDetected = (currentDistance<10) ? "Yes" : "No";
    Firebase.RTDB.setString(&fbdo, "/environment/4/value",phoneDetected);
    Firebase.RTDB.setString(&fbdo, "/environment/2/value", (airQuality > 400) ? "Poor" : "Good");
    
    // Process Light Level string
    String lightString = "Optimal";
    if (currentLight < 150) lightString = "Too Bright"; // Lower number = brighter
    else if (currentLight > 600) lightString = "Too Dark";
    Firebase.RTDB.setString(&fbdo, "/environment/3/value", lightString);

    // Mock Temp/Humidity
    Firebase.RTDB.setString(&fbdo, "/environment/0/value", String(22.0 + random(0, 20) / 10.0));
    Firebase.RTDB.setString(&fbdo, "/environment/1/value", String(40 + random(0, 10)));

    // 3. Upload Analytics Analytics
    String focusStr = formatTime(focusSeconds);
    String deskStr = formatTime(focusSeconds + pauseSeconds);
    
    Firebase.RTDB.setString(&fbdo, "/dailyStats/focusTime", focusStr);
    Firebase.RTDB.setString(&fbdo, "/dailyStats/totalStudyTime", deskStr);
    Firebase.RTDB.setInt(&fbdo, "/dailyStats/numberOfSessions", sessionsCount);
    Firebase.RTDB.setInt(&fbdo, "/dailyStats/interruptions", breaksCount);

    // Calculate Focus Score (100% max)
    int score = 100;
    if ((focusSeconds + pauseSeconds) > 0) {
      score = (focusSeconds * 100) / (focusSeconds + pauseSeconds);
    }
    Firebase.RTDB.setInt(&fbdo, "/coolMetrics/focusScore", score);
    
    // Optional: Longest streak logic (just pushes current focus for now if it's highest)
    Firebase.RTDB.setString(&fbdo, "/coolMetrics/longestFocusSession", focusStr);
  }

  updateDisplays();
  delay(100);
}

void updateDisplays() {
  // DISPLAY 1
  display1.firstPage();
  do {
    display1.setFont(u8g2_font_6x10_tf);
    display1.drawStr(0, 12, "FOCUS SESSION:");
    
    unsigned long fSecs = (currentState == FOCUSED) ? (totalFocusTime + (millis() - focusStartTime)) / 1000 : totalFocusTime / 1000;
    display1.setCursor(0, 26);
    display1.print(fSecs); display1.print("s");

    display1.drawStr(0, 45, "TIME:");
    display1.setCursor(0, 58);
    display1.print(timeClient.getFormattedTime()); 
  } while (display1.nextPage());

  // DISPLAY 2
  display2.firstPage();
  do {
    display2.setFont(u8g2_font_ncenB14_tr);
    
    if (isOrange) {
      display2.drawStr(0, 40, "BAD AIR!");
    } else if (currentState == IDLE) {
      display2.drawStr(0, 40, "IDLE");
      display2.drawXBM(60, 26, chicken_width, chicken_height, chicken_bits); 
    } else if (currentState == FOCUSED) {
      display2.drawStr(0, 40, "FOCUSING");
    } else if (currentState == PAUSED) {
      display2.drawStr(0, 40, "PAUSED");
    }
  } while (display2.nextPage());
}