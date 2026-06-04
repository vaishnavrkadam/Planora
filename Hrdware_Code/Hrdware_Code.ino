#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <ESP32Servo.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h> 

// 1. HARDWARE PIN DEFINITIONS
#define SERVO_PIN 18
#define LDR_PIN    4
#define BUZZER_PIN 23

// 2. NETWORK & FIREBASE ENVIRONMENT SETUP
#define WIFI_SSID "Kaveri block 2st floor B3_2.4Gh"
#define WIFI_PASSWORD "Omsai@123"
#define FIREBASE_API_KEY "AIzaSyBuNWz-u1hoqOWhe_Ia9LhkwWbul73mB2w"
#define FIREBASE_PROJECT_ID "planora-16eda"

Servo parkingBarrier;
WiFiClientSecure client;
LiquidCrystal_I2C lcd(0x27, 16, 2); 

// Safety tuning parameters
bool vehicleIsSafetyBlocked = false;
String currentPhysicalState = "UNKNOWN"; 
bool wasSafetyBlocked;
// --- AUDIO FEEDBACK FUNCTIONS ---
void successChime() {
  digitalWrite(BUZZER_PIN, HIGH); delay(100); 
  digitalWrite(BUZZER_PIN, LOW); delay(50);
  digitalWrite(BUZZER_PIN, HIGH); delay(150); 
  digitalWrite(BUZZER_PIN, LOW);
}

void warningBeep() {
  for(int i=0; i<3; i++) {
    digitalWrite(BUZZER_PIN, HIGH); delay(150); 
    digitalWrite(BUZZER_PIN, LOW); delay(100);
  }
}

// --- CLOUD CONNECTION FUNCTION ---
String sendRawRESTRequest(String method, String urlPath, String payload) {
  String response = "";
  client.setInsecure(); 
  
  if (client.connect("firestore.googleapis.com", 443)) {
    client.println(method + " " + urlPath + " HTTP/1.1");
    client.println("Host: firestore.googleapis.com");
    client.println("Connection: close");
    if (payload.length() > 0) {
      client.println("Content-Type: application/json");
      client.println("Content-Length: " + String(payload.length()));
      client.println();
      client.print(payload);
    } else {
      client.println();
    }
    while (client.connected() || client.available()) {
      if (client.available()) {
        char c = client.read();
        response += c;
      }
    }
    client.stop();
  }
  return response;
}

void setup() {
  Serial.begin(115200);
  
  pinMode(LDR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Initialize Gate
  parkingBarrier.attach(SERVO_PIN);
  parkingBarrier.write(0); 
  currentPhysicalState = "HORIZONTAL";
  String currentPhysicalState = "UNKNOWN"; 
  bool wasSafetyBlocked = false; // Remembers if the screen is stuck on a warning

  // Initialize Screen UI
  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Planora IoT Gate");
  lcd.setCursor(0, 1);
  lcd.print("Booting up...");
  delay(1500);

  // Connect to Wi-Fi
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting to");
  lcd.setCursor(0, 1);
  lcd.print("Wi-Fi Network...");
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  successChime();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("System Online!");
  lcd.setCursor(0, 1);
  lcd.print("Awaiting Cloud");
  delay(2000);
}

void loop() {
  // Read local safety sensor DIGITALLY
  int ldrValue = digitalRead(LDR_PIN);

  // Log sensor state to monitor calibration
  Serial.print("LDR (Digital): "); Serial.println(ldrValue);

  // Evaluate Safety Constraints (If car breaks light beam)
  if (ldrValue == HIGH) {
    vehicleIsSafetyBlocked = true;
  } else {
    vehicleIsSafetyBlocked = false;
  }

  String basePath = "/v1/projects/" + String(FIREBASE_PROJECT_ID) + "/databases/(default)/documents/Parking_Slots/Cubbon_Park_Slot_01";
  
  // 1. REPORT CURRENT VEHICLE OCCUPANCY UP TO FIRESTORE
  String patchPath = basePath + "?updateMask.fieldPaths=isVehiclePresent&key=" + String(FIREBASE_API_KEY);
  String patchPayload = "{\"fields\":{\"isVehiclePresent\":{\"booleanValue\":" + String(vehicleIsSafetyBlocked ? "true" : "false") + "}}}";
  sendRawRESTRequest("PATCH", patchPath, patchPayload);
  delay(200); 

  // 2. READ TARGET COMMAND STATE FROM CLOUD
  String getPath = basePath + "?key=" + String(FIREBASE_API_KEY);
  String serverResponse = sendRawRESTRequest("GET", getPath, "");

  if (serverResponse.length() > 0) {
    int jsonBodyIndex = serverResponse.indexOf("\r\n\r\n");
    if (jsonBodyIndex != -1) {
      String jsonBody = serverResponse.substring(jsonBodyIndex + 4);

      // --- COMMAND RECEIVED: MOVE GATE UP (VERTICAL / BOOKED) ---
      if (jsonBody.indexOf("\"VERTICAL\"") != -1 || jsonBody.indexOf("VERTICAL") != -1) {
        
        if (vehicleIsSafetyBlocked) {
          Serial.println("WARNING: Car blocking gate UP movement!");
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("  SAFETY LOCK!  ");
          lcd.setCursor(0, 1);
          lcd.print("Vehicle On Gate!");
          wasSafetyBlocked = true; // Remember that the screen is showing a warning
          
          digitalWrite(BUZZER_PIN, HIGH); delay(80); digitalWrite(BUZZER_PIN, LOW);
        }
        // Move gate OR redraw the screen if the safety lock just cleared
        else if (currentPhysicalState != "VERTICAL" || wasSafetyBlocked) {
          
          // Only move the motor if it's not already vertical
          if (currentPhysicalState != "VERTICAL") {
            Serial.println("Command: VERTICAL -> Opening Gate");
            warningBeep(); 
            parkingBarrier.write(90); 
            currentPhysicalState = "VERTICAL";
          }

          // Always redraw the correct text
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Slot Booked");
          lcd.setCursor(0, 1);
          lcd.print("Scan QR to Enter");
          
          wasSafetyBlocked = false; // Reset the memory flag
        }
      } 
      
      // --- COMMAND RECEIVED: MOVE GATE DOWN (HORIZONTAL / AVAILABLE) ---
      else if (jsonBody.indexOf("\"HORIZONTAL\"") != -1 || jsonBody.indexOf("HORIZONTAL") != -1) {
        
        if (vehicleIsSafetyBlocked) {
          Serial.println("WARNING: Car blocking gate DOWN movement!");
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("  SAFETY LOCK!  ");
          lcd.setCursor(0, 1);
          lcd.print("Obstacle In Way");
          wasSafetyBlocked = true; // Remember that the screen is showing a warning
          
          digitalWrite(BUZZER_PIN, HIGH); delay(80); digitalWrite(BUZZER_PIN, LOW);
        } 
        // Move gate OR redraw the screen if the safety lock just cleared
        else if (currentPhysicalState != "HORIZONTAL" || wasSafetyBlocked) {
          
          // Only move the motor if it's not already horizontal
          if (currentPhysicalState != "HORIZONTAL") {
            Serial.println("Command: HORIZONTAL -> Closing Gate");
            parkingBarrier.write(0); 
            currentPhysicalState = "HORIZONTAL";
            successChime(); 
          }

          // Always redraw the correct text
          lcd.clear();
          lcd.setCursor(0, 0);
          lcd.print("Slot Available");
          lcd.setCursor(0, 1);
          lcd.print("Planora Parking");
          
          wasSafetyBlocked = false; // Reset the memory flag
        }
      }
    }
  }

  delay(2000); 
}