# LAMBDA Wärmepumpen – MODBUS Beschreibung und Protokoll [file:1]

Datum: 13.02.2025 [file:1]

---

## 1 Inhaltsverzeichnis [file:1]

2 Kommunikations-Eigenschaften  
3 Modbus Protokoll TCP & RTU  
3.1 Index  
3.2 Subindex  
3.3 Number  
4 Modbus Client als Datenquelle definieren  
5 Modbus TCP/IP Einstellungen  
5.1 Kommunikation Einstellungen  
5.2 Freigegebene Functioncodes  
6 Modbus RTU Einstellungen  
6.1 Kommunikationseinstellungen  
6.2 Freigegebene Functioncodes [file:1]

Abbildung 1: Konfiguration Module Seite 1  
Abbildung 2: Konfiguration Module Seite 2  
Abbildung 3: Modbusclient als Datenquelle für Außentemperatur definieren  
Abbildung 4: Modbus Client als Datenquelle für PV-Überschuss definieren  
Abbildung 5: Modbus Client als Datenquelle für Heizkreis definieren  
Abbildung 6: Netzwerkeinstellungen  
Abbildung 7: Darstellung Display und RS485 Anschluss  
Abbildung 8: Konfiguration Modbus RTU [file:1]

Tabelle 1: Beispiel für Index-Vergabe [file:1]

---

## 2 Kommunikations-Eigenschaften [file:1]

Es können eine Reihe von Parametern und Istwerten von der Steuerzentrale der Wärmepumpe ausgelesen bzw. beschrieben werden, die Steuerzentrale fungiert dabei als Server (Slave). [file:1]  
Die Zeit eines Kommunikationstimeouts beträgt 1 Minute, erfolgt in dieser Zeit kein Abruf, wird die Verbindung geschlossen und muss neu aufgebaut werden. [file:1]  
Lesefunktion: Modbus Funktionscode 0x03 (read multiple holding register). [file:1]  
Schreibfunktion: Modbus Funktionscode 0x10 (write multiple holding register). [file:1]  

ACHTUNG: Steuerzentrale kann nur als Server (Slave) agieren. [file:1]

---

## 3 Modbus Protokoll TCP & RTU [file:1]

Die Registeradresse ist wie folgt strukturiert: [file:1]

- X _ _ _ → erste Stelle: Index (vom Modultyp vorgegeben)  
- _ X _ _ → zweite Stelle: Subindex (von der Modulnummer vorgegeben)  
- _ _ X X → letzte 2 Stellen: Number (vom Datenpunkt vorgegeben) [file:1]

### 3.1 Index [file:1]

| Modultyp         | Index |
|------------------|-------|
| General          | 0     |
| Heatpump         | 1     |
| Boiler           | 2     |
| Buffer           | 3     |
| Solar            | 4     |
| Heating circuit  | 5     | [file:1]

### 3.2 Subindex – Tabelle 1: Beispiel für Index-Vergabe [file:1]

Die Modulnummer ergibt sich aus der Reihenfolge, wie gleichartige Modultypen im Konfigurationsmodul angelegt wurden; General ist davon ausgenommen (Subindex fix). [file:1]  
Module, die weiter oben gereiht sind (niedrigere Nr.), werden über den niedrigeren Subindex angesprochen. [file:1]

#### Tabelle 1 – Beispiel für Index-Vergabe

| Nr.  | Modulname           | Subindexname | Subindex |
|------|---------------------|--------------|----------|
| 1    | WP Heizen M         | Heat pump 1  | 0        |
| 9    | WP Heizen + WW S    | Heat pump 2  | 1        |
| 2    | Brauchwasser        | Boiler 1     | 0        |
| 3    | Puffer              | Buffer 1     | 0        |
| 10   | Pool                | Buffer 2     | 1        |
| 4    | Heizkreis 1         | Circuit 1    | 0        |
| 5    | Heizkreis 2         | Circuit 2    | 1        |
| 6    | Heizkreis 3         | Circuit 3    | 2        |
| 7    | Heizkreis 4         | Circuit 4    | 3        |
| 8    | Poolkreis           | Circuit 5    | 4        | [file:1]

Beispiel: Register zum Auslesen der Vorlauftemperatur (flowline temperature) der Wärmepumpe „Heizen+WW S“: 1 1 04 → 1104, dabei ist 1 der Index, 1 der Subindex und 04 die Number. [file:1]

### 3.3 Number [file:1]

Die Number ist dem spezifischen Datenpunkt zugeordnet, der ausgelesen oder beschrieben werden soll. [file:1]  
Datenpunkte 00–49: Wenn sie beschrieben werden, muss der Wert regelmäßig aktualisiert werden (Timeout 5 Minuten); sonst wird ein Defaultwert zugewiesen. [file:1]  
Datenpunkte ≥ 50: können einmalig beschrieben werden, der Wert wird dauerhaft gespeichert. [file:1]

---

## 4 Modbus Client als Datenquelle definieren [file:1]

Folgende Datenpunkte, die separat in der Bedienoberfläche aktiviert werden müssen, definieren den Modbus Client als Datenquelle: [file:1]

- Außentemperatur [file:1]  
- Überschussenergie (PV-Überschuss) [file:1]  
- Raumfühler [file:1]

(Visuale Konfiguration siehe Abbildungen 3–5 im Originaldokument.) [file:1]

---

## 5 Modbus TCP/IP Einstellungen [file:1]

Die Kommunikation erfolgt über den Netzwerkanschluss des Displays. [file:1]  
Das Gerät wird im Menü „Netzwerkeinstellungen“ entweder per DHCP oder mit manueller IP-Adresse ins Netzwerk eingebunden. [file:1]

### 5.1 Kommunikation Einstellungen [file:1]

- Unit ID: 1 [file:1]  
- TCP-Port: 502 [file:1]  
- Bis zu 16 Kommunikationskanäle (16 Master) möglich [file:1]  
- Server-IP-Adresse wird in der Steuerung auf der Seite „Netzwerkeinstellungen“ angezeigt [file:1]  
- ACHTUNG: Die Verbindung darf nicht bei jeder Modbusanforderung neu aufgebaut und wieder geschlossen werden, sonst kann es zu schweren Störungen kommen. [file:1]

### 5.2 Freigegebene Functioncodes [file:1]

- Read: Functionscode 0x03 (read multiple holding register) [file:1]  
- Write: Functionscode 0x10 (write multiple holding registers) [file:1]

---

## 6 Modbus RTU Einstellungen [file:1]

Die Kommunikation erfolgt über den RS485-Anschluss auf der Rückseite des Bedienteils. [file:1]  
Es müssen zwei Abschlusswiderstände mit je 120 Ohm an den Enden des Bussystems vorhanden sein. [file:1]

### 6.1 Kommunikationseinstellungen [file:1]

Die grafische Konfiguration ist in Abbildung 8 dargestellt (RS485/RTU-Einstellungen im Originaldokument). [file:1]

### 6.2 Freigegebene Functioncodes [file:1]

- Read: Functionscode 0x03 (read multiple holding register) [file:1]  
- Write: Functionscode 0x10 (write multiple holding registers) [file:1]

---

## Holding Register – General Ambient (Modul „General Ambient“, Index 0, Subindex 0) [file:1]

Holding Register – Lesen mit Funktionscode 0x03, Schreiben mit Funktionscode 0x10. [file:1]

| Number | Register name            | Read/Write | Datentyp | Einheit  | Beschreibung                                                                                     |
|--------|--------------------------|-----------|----------|----------|--------------------------------------------------------------------------------------------------|
| 00     | Error number             | RO        | INT16    | [Nr]     | 0 = No Error                                                                                     |
| 01     | Operating state          | RO        | UINT16   | [Nr]     | 0 = OFF, 1 = AUTOMATIK, 2 = MANUAL, 3 = ERROR                                                   |
| 02     | Actual ambient temp.     | RW        | INT16    | [0.1°C]  | Aktuelle Außentemperatur (min = -50.0°C; max = 80.0°C)                                          |
| 03     | Average ambient temp. 1h | RO        | INT16    | [0.1°C]  | Arithmetischer Mittelwert der letzten 60 Minuten                                                 |
| 04     | Calculated ambient temp. | RO        | INT16    | [0.1°C]  | Temperatur für Berechnungen in Heizkreis-/Verteilmodulen                                        | [file:1]

---

## Holding Register – General E-Manager (Modul „General E-Manager“, Index 0, Subindex 1) [file:1]

| Number | Register name                     | Read/Write | Datentyp         | Einheit | Beschreibung                                                                                                                                              |
|--------|-----------------------------------|-----------|------------------|--------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| 00     | Error number                      | RO        | INT16            | [Nr]   | 0 = No Error                                                                                                                                              |
| 01     | Operating state                   | RO        | UINT16           | [Nr]   | 0 = OFF, 1 = AUTOMATIK, 2 = MANUAL, 3 = ERROR, 4 = OFFLINE                                                                                               |
| 02     | Actual power (input or excess)    | RW        | UINT16 oder INT16| [Watt] | Aktuelle Eingangsleistung [UINT16, 0–65535 W] oder aktueller Überschuss [INT16, -32768–32767 W], abhängig von den Moduleinstellungen                      |
| 03     | Actual power consumption          | RO        | INT16            | [Watt] | Aktueller Gesamtleistungsbedarf aller konfigurierten Wärmepumpen                                                                                          |
| 04     | Power consumption setpoint        | RO        | INT16            | [Watt] | Leistungs-Sollwert als Summe für alle Wärmepumpen                                                                                                         | [file:1]

---

## Holding Register – Heat pump (ModulNr. 1–3, Index 1, Subindex je nach Modul) [file:1]

Zuordnung: heat pump 1 = Subindex 0, heat pump 2 = Subindex 1, heat pump 3 = Subindex 2. [file:1]

| Number | Register name                      | Read/Write | Datentyp | Einheit     | Beschreibung                                                                                                                                 |
|--------|------------------------------------|-----------|----------|------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| 00     | Hp Error state                     | RO        | UINT16   | [Nr]       | 0 = NONE, 1 = MESSAGE, 2 = WARNING, 3 = ALARM, 4 = FAULT                                                                                    |
| 01     | Hp Error number                    | RO        | INT16    | [Nr]       | Durchlauf durch alle aktiven Fehlernummern (Nr. 1–99)                                                                                        |
| 02     | Hp State                           | RO        | UINT16   | [Nr]       | 0 = INIT, 1 = REFERENCE, 2 = RESTART-BLOCK, 3 = READY, 4 = START PUMPS, 5 = START COMPRESSOR, 6 = PRE-REGULATION, 7 = REGULATION, 8 = Not Used, 9 = COOLING, 10 = DEFROSTING, 20 = STOPPING, 30 = FAULT-LOCK, 31 = ALARM-BLOCK, 40 = ERROR-RESET |
| 03     | Operating state                    | RO        | UINT16   | [Nr]       | 0 = STBY, 1 = CH, 2 = DHW, 3 = CC, 4 = CIRCULATE, 5 = DEFROST, 6 = OFF, 7 = FROST, 8 = STBY-FROST, 9 = Not used, 10 = SUMMER, 11 = HOLIDAY, 12 = ERROR, 13 = WARNING, 14 = INFO-MESSAGE, 15 = TIME-BLOCK, 16 = RELEASE-BLOCK, 17 = MINTEMP-BLOCK, 18 = FIRMWARE-DOWNLOAD |
| 04     | T-flow                             | RO        | INT16    | [0.01°C]   | Vorlauftemperatur                                                                                                                             |
| 05     | T-return                           | RO        | INT16    | [0.01°C]   | Rücklauftemperatur                                                                                                                           |
| 06     | Vol. sink                          | RO        | INT16    | [0.01 l/min] | Volumenstrom Wärmesenke                                                                                                                      |
| 07     | T-EQin                             | RO        | INT16    | [0.01°C]   | Quellentemperatur Eintritt                                                                                                                   |
| 08     | T-EQout                            | RO        | INT16    | [0.01°C]   | Quellentemperatur Austritt                                                                                                                   |
| 09     | Vol. source                        | RO        | INT16    | [0.01 l/min] | Volumenstrom Wärmequelle                                                                                                                     |
| 10     | Compressor-Rating                  | RO        | UINT16   | [0.01%]   | Verdichtereinheits-Leistungsgrad                                                                                                             |
| 11     | Qp heating                         | RO        | INT16    | [0.1 kW]  | Aktuelle Heizleistung                                                                                                                        |
| 12     | FI power consumption               | RO        | INT16    | [Watt]    | Aktuelle Leistungsaufnahme des Frequenzumrichters                                                                                            |
| 13     | COP                                | RO        | INT16    | [0.01%]   | Leistungszahl (Coefficient of Performance) der Verdichtereinheit                                                                            |
| 14     | Modbus request release password    | RW        | UINT16   | [Nr]      | Passwort-Register zum Freigeben der Request-Register (maximal 10 Versuche)                                                                  |
| 15     | Request type                       | RW        | INT16    | [Nr]      | 0 = NO REQUEST, 1 = FLOW PUMP CIRCULATION, 2 = CENTRAL HEATING, 3 = CENTRAL COOLING, 4 = DOMESTIC HOT WATER                                |
| 16     | Request flow line temp             | RW        | INT16    | [0.1°C]   | Gewünschte Vorlauftemperatur (min = 0.0°C, max = 70.0°C)                                                                                    |
| 17     | Request return line temp           | RW        | INT16    | [0.1°C]   | Gewünschte Rücklauftemperatur (min = 0.0°C, max = 65.0°C)                                                                                   |
| 18     | Request heat sink temp. diff       | RW        | INT16    | [0.1 K]   | Gewünschte Spreizung zwischen Vorlauf und Rücklauf (min = 0.0 K, max = 35.0 K)                                                              |
| 19     | Relais state for 2nd heating stage | RO        | INT16    | 0/1       | 1 = NO-Relais für 2. Heizstufe aktiviert                                                                                                     |
| 20     | Statistic VdA E since last reset   | RO        | INT32    | [Wh]     | Aufsummierter Stromverbrauch der Verdichtereinheit seit letztem Statistik-Reset                                                              |
| 21     | Statistic VdA Q since last reset   | RO        | INT32    | [Wh]     | Aufsummierte Wärmeabgabe der Verdichtereinheit seit letztem Statistik-Reset                                                                  | [file:1]

---

## Holding Register – Boiler (ModulNr. 1–5, Index 2) [file:1]

Zuordnung: boiler 1 = 0, boiler 2 = 1, boiler 3 = 2, boiler 4 = 3, boiler 5 = 4. [file:1]

| Number | Register name                | Read/Write | Datentyp | Einheit  | Beschreibung                                                                                       |
|--------|------------------------------|-----------|----------|---------|----------------------------------------------------------------------------------------------------|
| 00     | Error number                 | RO        | INT16    | [Nr]    | 0 = No Error                                                                                       |
| 01     | Operating state              | RO        | UINT16   | [Nr]    | 0 = STBY, 1 = DHW, 2 = LEGIO, 3 = SUMMER, 4 = FROST, 5 = HOLIDAY, 6 = PRIO-STOP, 7 = ERROR, 8 = OFF, 9 = PROMPT-DHW, 10 = TRAILING-STOP, 11 = TEMP-LOCK, 12 = STBY-FROST |
| 02     | Actual high temp.            | RO        | INT16    | [0.1°C] | Aktuelle Temperatur Sensors „Boiler high“                                                          |
| 03     | Actual low temp.             | RO        | INT16    | [0.1°C] | Aktuelle Temperatur Sensors „Boiler low“                                                           |
| 50     | Set.: Maximum boiler temp.   | RW        | INT16    | [0.1°C] | Maximaltemperatur Boiler (min = 25.0°C; max = 65.0°C)                                              | [file:1]

---

## Holding Register – Buffer (ModulNr. 1–5, Index 3) [file:1]

Zuordnung: buffer 1 = 0, buffer 2 = 1, buffer 3 = 2, buffer 4 = 3, buffer 5 = 4. [file:1]

| Number | Register name                          | Read/Write | Datentyp | Einheit  | Beschreibung                                                                                                                                                          |
|--------|----------------------------------------|-----------|----------|---------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 00     | Error number                           | RO        | INT16    | [Nr]    | 0 = No Error                                                                                                                                                          |
| 01     | Operating state                        | RO        | UINT16   | [Nr]    | 0 = STBY, 1 = HEATING, 2 = COOLING, 3 = SUMMER, 4 = FROST, 5 = HOLIDAY, 6 = PRIO-STOP, 7 = ERROR, 8 = OFF, 9 = STBY-FROST                                           |
| 02     | Actual high temp.                      | RO        | INT16    | [0.1°C] | Aktuelle Temperatur Sensors „Buffer high“                                                                                                                             |
| 03     | Actual low temp.                       | RO        | INT16    | [0.1°C] | Aktuelle Temperatur Sensors „Buffer low“                                                                                                                              |
| 04     | Modbus buffer temp. High               | RW        | INT16    | [0.1°C] | Buffer-Temperatur über Modbus gesetzt (min = 0°C; max = 90°C)                                                                                                         |
| 05     | Request type                           | RW        | INT16    | [Enum]  | -1 = INVALID REQUEST (deaktiviert Modbus Request), 0 = NO REQUEST, 1 = FLOW PUMP CIRCULATION (entspricht NO_REQUEST für Buffer), 2 = CENTRAL HEATING, 3 = CENTRAL COOLING |
| 06     | Request flow line temp. setpoint       | RW        | INT16    | [0.1°C] | Gewünschter Vorlauftemperatur-Sollwert (min = 0.0°C; max = 65.0°C), gültiger Wert erforderlich                                                                        |
| 07     | Request return line temp. setpoint     | RW        | INT16    | [0.1°C] | Gewünschter Rücklauftemperatur-Sollwert (min = 0.0°C; max = 60.0°C), gültiger Wert erforderlich                                                                       |
| 08     | Request heat sink temp. diff setpoint  | RW        | INT16    | [0.1 K] | Gewünschte Spreizung zwischen Vorlauf und Rücklauf (min = 0.0 K; max = 35.0 K), gültiger Wert erforderlich                                                            |
| 09     | Modbus request heating capacity        | RW        | INT16    | [0.1 kW]| Gewünschte Leistung (min = 0.0 kW; max = 25.5 kW), optional                                                                     |
| 50     | Set.: Maximum buffer temp.             | RW        | INT16    | [0.1°C] | Maximaltemperatur Puffer (min = 25.0°C; max = 65.0°C)                                                                           | [file:1]

---

## Holding Register – Solar (ModulNr. 1–2, Index 4) [file:1]

Zuordnung: solar 1 = 0, solar 2 = 1. [file:1]

| Number | Register name                    | Read/Write | Datentyp | Einheit  | Beschreibung                                                                                      |
|--------|----------------------------------|-----------|----------|---------|---------------------------------------------------------------------------------------------------|
| 00     | Error number                     | RO        | INT16    | [Nr]    | 0 = No Error                                                                                      |
| 01     | Operating state                  | RO        | UINT16   | [Nr]    | 0 = STBY, 1 = HEATING, 2 = ERROR, 3 = OFF                                                         |
| 02     | Collector temp.                  | RO        | INT16    | [0.1°C] | Aktuelle Temperatur Kollektorsensor                                                                |
| 03     | Buffer 1 temp.                   | RO        | INT16    | [0.1°C] | Aktuelle Temperatur Puffer-1-Sensor                                                                |
| 04     | Buffer 2 temp.                   | RO        | INT16    | [0.1°C] | Aktuelle Temperatur Puffer-2-Sensor (im Text „buffer 1 sensor“; vermutlich Tippfehler)            |
| 50     | Set.: Maximum buffer temp.       | RW        | INT16    | [0.1°C] | Maximaltemperatur Puffer (min = 25.0°C; max = 90.0°C)                                             |
| 51     | Set.: Buffer changeover temp.    | RW        | INT16    | [0.1°C] | Umschalttemperatur Puffer (min = 25.0°C; max = 90.0°C)                                            | [file:1]

---

## Holding Register – Heating circuit (ModulNr. 1–12, Index 5) [file:1]

Zuordnung:  
circuit 1 = 0, circuit 2 = 1, circuit 3 = 2, circuit 4 = 3, circuit 5 = 4, circuit 6 = 5, circuit 7 = 6, circuit 8 = 7, circuit 9 = 8, circuit 10 = 9, circuit 11 = 10, circuit 12 = 11. [file:1]

| Number | Register name                      | Read/Write | Datentyp | Einheit  | Beschreibung                                                                                                                                                   |
|--------|------------------------------------|-----------|----------|---------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 00     | Error number                       | RO        | INT16    | [Nr]    | 0 = No Error                                                                                                                                                   |
| 01     | Operating state                    | RO        | UINT16   | [Nr]    | 0 = HEATING, 1 = ECO, 2 = COOLING, 3 = FLOORDRY, 4 = FROST, 5 = MAX-TEMP, 6 = ERROR, 7 = SERVICE, 8 = HOLIDAY, 9 = CH-SUMMER, 10 = CC-WINTER, 11 = PRIO-STOP, 12 = OFF, 13 = RELEASE-OFF, 14 = TIME-OFF, 15 = STBY, 16 = STBY-HEATING, 17 = STBY-ECO, 18 = STBY-COOLING, 19 = STBY-FROST, 20 = STBY-FLOORDRY |
| 02     | Flow line temp.                    | RO        | INT16    | [0.1°C] | Aktuelle Vorlauftemperatur des Heizkreises                                                                                                                    |
| 03     | Return line temp.                  | RO        | INT16    | [0.1°C] | Aktuelle Rücklauftemperatur des Heizkreises                                                                                                                   |
| 04     | Room device temp.                  | RW        | INT16    | [0.1°C] | Aktuelle Raumfühlertemperatur (min = -29.9°C; max = 99.9°C)                                                                                                   |
| 05     | Setpoint flow line temp.           | RW        | INT16    | [0.1°C] | Sollwert Vorlauftemperatur (min = 15.0°C; max = 65.0°C)                                                                                                       |
| 06     | Operating mode                     | RW        | INT16    | [Nr]    | 0 = OFF(RW), 1 = MANUAL(R), 2 = AUTOMATIK(RW), 3 = AUTO-HEATING(RW), 4 = AUTO-COOLING(RW), 5 = FROST(RW), 6 = SUMMER(RW), 7 = FLOOR-DRY(R)                    |
| 50     | Set.: Offset flow line temp. setpoint | RW     | INT16    | [0.1°C] | Offset zum Vorlauf-Sollwert (min = -10.0 K; max = 10.0 K)                                                                                                      |
| 51     | Set.: Setpoint room heating temp.  | RW        | INT16    | [0.1°C] | Raum-Solltemperatur im Heizbetrieb (min = 15.0°C; max = 40.0°C)                                                                                               |
| 52     | Set.: Setpoint room cooling temp.  | RW        | INT16    | [0.1°C] | Raum-Solltemperatur im Kühlbetrieb (min = 15.0°C; max = 40.0°C)                                                                                               | [file:1]
