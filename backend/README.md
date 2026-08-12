# Backend

## Rolul componentei

Folderul `backend` conține serviciul central al aplicației.

Backend-ul este implementat în Python folosind Flask și reprezintă legătura dintre:

```text
Frontend
   │
   ▼
Backend
   │
   ▼
MariaDB
```

și dintre:

```text
Simulator GPS
     │
     ▼
Backend
     │
     ▼
MariaDB
```

Frontend-ul nu modifică direct baza de date. Toate operațiile importante sunt realizate prin endpoint-uri HTTP expuse de aplicația Flask.

Backend-ul este responsabil pentru:

- autentificare;
- autorizare pe roluri;
- validarea datelor;
- stocarea pozițiilor GPS;
- administrarea vehiculelor;
- crearea incidentelor;
- gestionarea resurselor necesare;
- asignarea vehiculelor;
- calcularea rutelor;
- recomandarea vehiculelor;
- cererile de întăriri;
- datele operaționale;
- accesul administratorului;
- generarea rapoartelor PDF.

---

# Structura generală

Structura principală este:

```text
backend/
│
├── app.py
├── create_test_users.py
├── requirements.txt
├── Dockerfile
│
├── routes/
│   ├── auth.py
│   ├── admin.py
│   ├── driver.py
│   └── ...
│
├── services/
│   ├── auth_service.py
│   ├── incident_service.py
│   ├── route_service.py
│   ├── report_service.py
│   └── ...
│
├── config/
│   └── ...
│
└── utils/
    └── validation.py
```

Codul este separat conceptual în trei zone:

```text
routes
   ↓
HTTP / validare request

services
   ↓
logică de business

database
   ↓
persistență
```

---

# `app.py`

`app.py` reprezintă punctul principal de intrare al backend-ului.

La pornire:

1. este creat obiectul Flask;
2. este configurat CORS;
3. sunt încărcate variabilele pentru baza de date;
4. sunt înregistrate blueprint-urile;
5. sunt create serviciile de rutare și raportare;
6. aplicația începe să accepte request-uri.

În configurația Docker aplicația rulează pe portul intern:

```text
5000
```

Portul nu este accesat direct de browser. Cererile ajung prin HAProxy.

---

# Conexiunea la baza de date

Backend-ul folosește PyMySQL.

Parametrii principali sunt primiți prin variabile de mediu:

```text
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
```

În Docker, host-ul bazei este:

```text
database
```

deoarece acesta este numele serviciului MariaDB din `docker-compose.yml`.

Conexiunile utilizează:

```text
DictCursor
```

astfel încât rezultatele SQL sunt accesate sub forma unor dicționare Python.

---

# Autentificarea

Autentificarea este implementată prin:

```text
routes/auth.py
services/auth_service.py
```

Endpoint-urile principale sunt:

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Login

Fluxul este:

```text
username + password
        │
        ▼
AuthService.authenticate()
        │
        ▼
căutare utilizator
        │
        ▼
verificare is_active
        │
        ▼
check_password_hash()
        │
        ▼
access token
```

Parolele nu sunt comparate ca text simplu cu valoarea din baza de date.

Este utilizat mecanismul de hashing oferit de Werkzeug.

---

## Access token

După autentificare este generat un token de acces.

Token-ul este trimis ulterior de browser astfel:

```http
Authorization: Bearer <access_token>
```

Backend-ul extrage token-ul și determină utilizatorul asociat.

Token-ul poate fi revocat prin operația de logout.

---

# Rolurile

Sunt implementate trei roluri:

```text
administrator
dispatcher
driver
```

Accesul la anumite endpoint-uri este verificat în backend, nu doar ascuns în interfața frontend.

De exemplu, un utilizator cu rol `driver` nu poate utiliza endpoint-uri rezervate administratorului doar prin trimiterea manuală a unui request.

---

# `AuthService`

`AuthService` concentrează logica referitoare la utilizatori.

Principalele responsabilități sunt:

- conexiunea la baza de date;
- căutarea unui utilizator;
- autentificarea;
- crearea utilizatorilor;
- generarea token-urilor;
- verificarea token-urilor;
- revocarea autentificării;
- identificarea utilizatorului curent;
- operațiile necesare dashboard-ului șoferului.

Pentru conturile de tip driver se folosește convenția:

```text
sofer-001
sofer-002
sofer-003
...
```

Aceasta permite asocierea logică între utilizator și vehicul.

---

# `IncidentService`

`IncidentService` conține regulile de validare aplicate incidentelor.

Rolul acestuia este important deoarece frontend-ul nu este considerat o sursă de date sigură.

Chiar dacă formularul din browser limitează anumite valori, backend-ul verifică din nou informațiile.

---

## Tipurile de vehicul

Sunt acceptate:

```text
police
ambulance
fire
```

---

## Priorități

Prioritățile acceptate sunt:

```text
low
medium
high
critical
```

---

## Tipuri de incident

Sistemul conține mai multe categorii.

Exemple:

```text
traffic-accident
theft
assault
public-disturbance
missing-person

medical-emergency
unconscious-person
injured-person
cardiac-emergency
urgent-medical-transport

building-fire
vehicle-fire
vegetation-fire
gas-leak
explosion
```

Un incident poate avea mai multe categorii simultan.

---

## Resurse necesare

În forma extinsă, un incident poate solicita mai multe categorii de resurse.

Exemplu:

```json
{
    "required_resources": [
        {
            "vehicle_type": "police",
            "quantity": 2
        },
        {
            "vehicle_type": "ambulance",
            "quantity": 1
        }
    ]
}
```

Backend-ul verifică:

- existența tipului;
- validitatea tipului;
- cantitatea;
- duplicatele;
- limitele configurate.

---

# Vehicule și poziții GPS

Simulatorul trimite periodic date către:

```text
POST /api/vehicles
```

Payload-ul conține informații de forma:

```json
{
    "vehicle_id": "VEHICLE-001",
    "vehicle_type": "police",
    "latitude": 44.4,
    "longitude": 26.1,
    "speed": 45.5,
    "status": "active"
}
```

Backend-ul validează:

- identificatorul;
- coordonatele;
- viteza;
- tipul;
- starea.

După validare sunt actualizate informațiile vehiculului și pozițiile asociate.

---

# Poziția curentă și istoricul GPS

Sistemul separă:

```text
current_positions
```

de:

```text
position_history
```

`current_positions` este utilizat pentru afișarea rapidă a poziției curente.

`position_history` păstrează punctele istorice și poate fi folosit pentru:

- reconstruirea traseului;
- calcularea informațiilor istorice;
- raportare;
- analizarea intervenției.

---

# Incidente

Endpoint-urile de incidente gestionează întregul ciclu al unei intervenții.

Un incident poate trece prin stări precum:

```text
draft
pending_location
pending_dispatch
assigned
in_progress
resolved
cancelled
```

Fluxul depinde de operațiile efectuate de dispecer și de vehicule.

---

# Asignarea mai multor vehicule

Versiunea inițială a modelului conține și:

```text
assigned_vehicle_id
```

în tabelul incidentelor.

Pentru suportul multi-vehicle există însă:

```text
incident_assignments
```

O asignare conține informații precum:

- incident;
- vehicul;
- tipul asignării;
- starea;
- momentul asignării;
- momentul sosirii;
- momentul eliberării.

Astfel:

```text
Incident
   │
   ├── Vehicle 1
   ├── Vehicle 2
   ├── Vehicle 3
   └── Vehicle N
```

Backend-ul grupează asignările după `incident_id` atunci când construiește răspunsurile pentru frontend.

---

# Recomandarea vehiculelor

Recomandarea reprezintă etapa dintre definirea incidentului și confirmarea asignării.

Procesul general este:

```text
incident
   │
   ▼
resurse necesare
   │
   ▼
vehicule disponibile
   │
   ▼
poziții GPS
   │
   ▼
distanțe
   │
   ▼
vehicule recomandate
```

Backend-ul furnizează rezultatul, iar frontend-ul îl prezintă dispecerului.

Decizia finală rămâne la utilizator.

---

# `RouteService`

`RouteService` gestionează calculele rutiere.

Fișierul grafului este configurat prin:

```text
ROAD_GRAPH_FILE
```

În Docker acesta este montat în backend la:

```text
/app/data/road_network.graphml
```

---

## Încărcarea grafului

Graful este încărcat cu:

```python
networkx.read_graphml(...)
```

Muchiile conțin informații despre lungimea drumurilor.

Înainte de rutare valorile sunt normalizate pentru a putea fi utilizate ca ponderi.

---

## Nodul cel mai apropiat

Poziția GPS a unui vehicul nu coincide obligatoriu cu un nod al grafului.

Din acest motiv se caută:

```text
nodul cel mai apropiat de vehicul
```

și:

```text
nodul cel mai apropiat de incident
```

---

## Calcularea traseului

După identificarea nodurilor este calculat un drum minim.

Conceptual:

```text
vehicle coordinates
       │
       ▼
nearest start node
       │
       ▼
NetworkX shortest path
       │
       ▼
nearest destination node
       │
       ▼
incident coordinates
```

Costul traseului este bazat pe lungimea drumurilor.

---

# Distanța Haversine

Pentru distanța geografică dintre două coordonate este implementat și calculul Haversine.

Acesta este utilizat atunci când este necesară estimarea distanței directe dintre două puncte geografice.

Validarea coordonatelor verifică:

```text
-90 <= latitude <= 90
-180 <= longitude <= 180
```

---

# Driver API

Rutele pentru șofer sunt separate în:

```text
routes/driver.py
```

Un utilizator poate accesa aceste funcții numai dacă are rol:

```text
driver
```

Endpoint-ul dashboard oferă informațiile relevante pentru:

- utilizator;
- vehicul;
- incidentul activ;
- contextul operațional.

---

# Cererile de întăriri

Un driver aflat într-o misiune poate trimite o cerere către dispecerat.

Exemplu de flux:

```text
driver
   │
   ▼
POST /api/driver/reinforcement-requests
   │
   ▼
backend
   │
   ▼
reinforcement_requests
   │
   ▼
dispatcher
```

Cererea poate conține și un mesaj operațional.

Dispecerul poate analiza cererea și poate asigna resurse suplimentare.

---

# Chestionare și date specializate

Sistemul include colectarea de informații specifice serviciului de intervenție.

Sunt diferențiate date pentru:

```text
Poliție
Ambulanță
Pompieri
```

Informațiile sunt asociate incidentului și pot avea stări precum:

```text
pending
in_progress
confirmed
```

Răspunsurile sunt persistate separat de definiția raportului și există suport pentru păstrarea istoricului modificărilor.

Acest model permite diferențierea dintre:

```text
date aflate în lucru
```

și:

```text
date confirmate
```

---

# Evenimentele incidentului

Pe parcursul unui incident pot fi păstrate evenimente operaționale.

Acestea pot descrie:

- crearea incidentului;
- asignarea vehiculelor;
- sosirea;
- solicitarea întăririlor;
- deciziile dispecerului;
- modificarea datelor specializate;
- finalizarea incidentului.

Evenimentele permit construirea unei cronologii mai clare a intervenției.

---

# `IncidentReportService`

Serviciul de raportare generează documente PDF folosind ReportLab.

Raportul poate conține informații precum:

- identificarea incidentului;
- titlul;
- prioritatea;
- descrierea;
- locația;
- cronologia;
- durata;
- informații despre rută;
- hartă statică;
- concluzie.

Pentru reprezentarea statică a traseului este utilizată biblioteca:

```text
staticmap
```

Raportul este construit în memorie și este returnat sub formă de bytes către endpoint-ul HTTP.

---

# Administrator API

Rutele administrative permit accesul numai utilizatorilor cu rol:

```text
administrator
```

Funcționalitățile includ:

- dashboard statistic;
- listarea utilizatorilor;
- crearea utilizatorilor;
- activarea/dezactivarea conturilor;
- resetarea parolelor;
- consultarea vehiculelor;
- listarea tabelelor bazei de date;
- inspectarea structurii;
- citirea rândurilor;
- executarea controlată a SQL-ului.

---

# Consola SQL

Backend-ul admin diferențiază:

```text
read-only SQL
```

de:

```text
write SQL
```

și conține o listă de comenzi blocate.

Sunt limitate și:

- numărul maxim de rânduri;
- numărul de instrucțiuni;
- identificatorii SQL.

Scopul este reducerea riscului executării accidentale a unor operații necontrolate.

Această consolă este destinată administrării și testării, nu expunerii publice.

---

# `create_test_users.py`

Scriptul creează utilizatori pentru dezvoltare.

Include:

- administrator;
- dispecer;
- conturi driver construite din vehicule.

Pentru vehiculele:

```text
VEHICLE-001
VEHICLE-002
...
```

sunt generate conturi de forma:

```text
sofer-001
sofer-002
...
```

Rulare în container:

```bash
docker compose exec web1 python create_test_users.py
```

---

# Dependencies

`requirements.txt` conține:

```text
Flask
flask-cors
PyMySQL
networkx
reportlab
staticmap
```

Instalare locală:

```bash
pip install -r requirements.txt
```

---

# Docker

Imaginea backend este construită pornind de la:

```text
python:3.11-slim
```

Directorul de lucru este:

```text
/app
```

Aplicația este pornită cu:

```bash
python3 app.py
```

---

# Verificarea sintaxei

Înainte de rebuild este recomandat:

```bash
python -m compileall backend
```

Pentru un singur fișier:

```bash
python -m py_compile backend/services/report_service.py
```

Dacă această comandă nu afișează nimic, sintaxa Python este validă.

---

# Reconstruirea backend-ului

Din directorul principal:

```bash
docker compose build web1 web2
docker compose up -d web1 web2
```

Verificare:

```bash
docker ps
```

---

# Depanare

## Backend-ul intră în Restarting

```bash
docker logs web1 --tail 150
docker logs web2 --tail 150
```

Erori frecvente:

```text
SyntaxError
IndentationError
ImportError
Database connection error
```

---

## 503 prin HAProxy

Dacă ambele instanțe backend sunt oprite sau repornesc continuu, HAProxy nu are un server API sănătos și poate returna:

```text
503 Service Unavailable
```

Problema trebuie căutată mai întâi în logurile `web1` și `web2`.

---

# Securitate

Configurația actuală este destinată dezvoltării locale.

Pentru producție trebuie:

- eliminate parolele hardcodate;
- utilizat un fișier `.env`;
- schimbat `SECRET_KEY`;
- activat HTTPS;
- limitat accesul extern la MariaDB;
- revizuit CORS;
- dezactivată sau restricționată consola SQL;
- folosite credențiale diferite pentru producție.

---

# Legături

Documentația generală:

```text
../README.md
```

Frontend:

```text
../frontend/README.md
```

Database:

```text
../database/README.md
```

Simulator:

```text
../raspberry/README.md
```