# Frontend

## Rolul frontend-ului

Folderul `frontend` conține întreaga interfață web a sistemului de monitorizare GPS.

Frontend-ul este implementat fără un framework JavaScript complex. Aplicația folosește:

```text
HTML
CSS
JavaScript
Leaflet
```

Această abordare păstrează componentele vizibile și logica clientului ușor de urmărit direct din repository.

Frontend-ul este responsabil pentru:

- autentificarea utilizatorului;
- redirecționarea în funcție de rol;
- afișarea vehiculelor;
- afișarea hărții;
- crearea incidentelor;
- selectarea locațiilor;
- recomandarea vehiculelor;
- afișarea rutelor;
- cererile de întăriri;
- interfața driver;
- interfața administrator;
- prezentarea datelor primite de la backend.

Frontend-ul nu comunică direct cu MariaDB.

Fluxul este:

```text
Frontend
   │
   │ HTTP
   ▼
HAProxy
   │
   ▼
Backend
   │
   ▼
MariaDB
```

---

# Pagini

Sistemul are patru pagini principale.

```text
index.html
admin.html
dispatcher.html
driver.html
```

---

# `index.html` – Autentificare

`index.html` reprezintă punctul inițial pentru utilizator.

Pagina conține:

- nume de utilizator;
- parolă;
- buton pentru afișarea parolei;
- mesaj de eroare/succes;
- buton de autentificare.

Logica este implementată prin:

```text
js/auth.js
js/login.js
```

---

## Fluxul autentificării

```text
Utilizator
   │
   ▼
index.html
   │
   ▼
login.js
   │
   ▼
auth.js
   │
   ▼
POST /api/auth/login
   │
   ▼
Backend
```

După autentificare, token-ul este salvat în:

```text
sessionStorage
```

sub o cheie specifică aplicației.

Pentru request-urile protejate este adăugat:

```http
Authorization: Bearer <token>
```

---

# Redirecționarea după rol

După autentificare utilizatorul este direcționat către interfața corespunzătoare.

```text
administrator
    ↓
admin.html

dispatcher
    ↓
dispatcher.html

driver
    ↓
driver.html
```

Dacă un utilizator încearcă să acceseze o pagină nepotrivită rolului său, logica de autentificare îl poate redirecționa.

---

# `auth.js`

`auth.js` conține logica comună de autentificare.

Responsabilități:

- citirea token-ului;
- salvarea token-ului;
- ștergerea token-ului;
- construirea header-ului Authorization;
- login;
- logout;
- verificarea utilizatorului curent;
- verificarea rolurilor;
- redirecționarea.

Acest fișier este utilizat de mai multe pagini și evită duplicarea logicii de autentificare.

---

# `dispatcher.html`

Pagina de dispecerat reprezintă centrul operațional al sistemului.

Interfața este construită în jurul:

- unui topbar;
- unui panou lateral;
- unei hărți;
- panourilor de detalii;
- formularului pentru incidente;
- panourilor operaționale suplimentare.

---

# Panoul lateral al dispecerului

Dispecerul poate comuta între:

```text
Vehicule
Incidente
Cereri
```

Fiecare mod schimbă informațiile afișate.

---

## Vehicule

Modul `Vehicule` afișează flota.

Vehiculele pot fi filtrate după:

- tip;
- stare.

Tipurile sunt:

```text
Poliție
Ambulanță
Pompieri
```

Stările pot include:

```text
Disponibil
În misiune
Indisponibil
```

Selectarea unui vehicul actualizează:

- markerul;
- panoul de detalii;
- informațiile despre poziție;
- viteza;
- starea.

---

## Incidente

Tab-ul `Incidente` afișează incidentele salvate.

Filtrele permit separarea după:

- stare;
- tip;
- prioritate.

Un card de incident poate prezenta:

- cod;
- titlu;
- stare;
- prioritate;
- tipuri;
- vehicule asignate;
- momentul creării;
- momentul dispecerizării;
- momentul finalizării.

Pentru un incident activ poate fi afișată ruta live.

Pentru un incident arhivat poate deveni disponibil raportul.

---

## Cereri

Tab-ul `Cereri` este dedicat cererilor de întăriri.

Acesta permite dispecerului să:

- vadă cererile primite;
- filtreze cererile;
- selecteze o cerere;
- consulte incidentul;
- consulte vehiculul solicitant;
- vadă mesajul transmis;
- analizeze resursele;
- aprobe;
- respingă;
- introducă un mesaj de răspuns.

---

# `state.js`

`state.js` conține starea globală necesară interfeței de dispecerat.

Exemple:

```text
vehicles
filteredVehicles
selectedVehicleId

activeIncidentId
activeIncidentCode
activeIncidentLocation

allIncidents
filteredIncidents
activeRoutes

allReinforcementRequests
selectedReinforcementRequestId
```

Separarea stării permite modulelor JavaScript să lucreze cu aceleași informații.

---

# `api.js`

`api.js` reprezintă stratul de comunicare dintre dispecerat și backend.

Exemple de operații:

```text
getVehicles()
createIncident()
updateIncidentLocation()
getRecommendedVehicle()
assignVehicleToIncident()
getIncidentRoute()
getIncidents()
getReinforcementRequests()
```

Modulul nu decide cum arată interfața.

Rolul său este:

```text
UI
 ↓
api.js
 ↓
HTTP
 ↓
backend
```

---

# `map.js`

`map.js` controlează harta Leaflet.

Sunt utilizate markere diferite pentru:

```text
🚓 Poliție
🚑 Ambulanță
🚒 Pompieri
```

Incidentul are un marker separat.

Harta este responsabilă pentru:

- poziționarea vehiculelor;
- actualizarea markerelor;
- selectarea locației incidentului;
- afișarea markerului incidentului;
- afișarea rutelor;
- marcarea începutului și destinației traseului.

---

# Culorile rutelor

Traseele sunt diferențiate vizual.

Conceptual:

```text
Poliție    → albastru
Ambulanță  → roșu
Pompieri   → portocaliu
```

Acest lucru este important atunci când mai multe vehicule participă simultan la același incident.

---

# `incident-form.js`

Acest modul gestionează formularul de creare a incidentelor.

El controlează:

- titlul evenimentului;
- tipurile selectate;
- prioritatea;
- detaliile;
- resursele;
- cantitățile;
- resetarea formularului;
- validarea înainte de submit.

---

## Selectarea mai multor tipuri

Un incident poate aparține mai multor categorii.

Frontend-ul construiește o listă de tipuri selectate și o trimite backend-ului.

---

## Resurse

Formularul conține secțiuni separate pentru:

```text
Poliție
Ambulanță
Pompieri
```

Pentru fiecare categorie se poate selecta cantitatea.

Sunt disponibile controale pentru creșterea sau scăderea valorii.

Frontend-ul limitează valorile introduse, iar backend-ul le validează din nou.

---

# Selectarea locației

Locația incidentului poate fi aleasă direct pe hartă.

Flux:

```text
formular incident
      │
      ▼
activare selecție
      │
      ▼
click pe hartă
      │
      ▼
coordonate temporare
      │
      ▼
salvare locație
      │
      ▼
PATCH backend
```

După salvare, incidentul are coordonate geografice care pot fi folosite pentru recomandare și rutare.

---

# `recommendation.js`

Acest modul gestionează recomandarea vehiculelor.

După ce incidentul are:

- locație;
- resurse solicitate;

frontend-ul poate cere backend-ului vehiculele recomandate.

Procesul vizual este:

```text
Se caută...
    │
    ▼
Backend calculează
    │
    ▼
lista recomandată
    │
    ▼
carduri vehicule
    │
    ▼
confirmare asignare
```

Dacă resursele sunt insuficiente, interfața poate bloca confirmarea și poate informa dispecerul.

---

# `vehicles-ui.js`

Acest modul este responsabil pentru afișarea flotei.

Operații:

- încărcarea vehiculelor;
- sortarea după cod;
- aplicarea filtrelor;
- construirea cardurilor;
- selectarea unui vehicul;
- actualizarea informațiilor;
- sincronizarea markerelor.

Vehiculele sunt ordonate logic folosind numărul din cod:

```text
VEHICLE-001
VEHICLE-002
VEHICLE-003
...
```

---

# `incidents-ui.js`

Acest modul gestionează interfața incidentelor.

Responsabilități:

- încărcarea incidentelor;
- filtrarea;
- separarea incidentelor active;
- construirea cardurilor;
- selectarea unui incident;
- afișarea traseelor;
- afișarea locației;
- accesarea raportului.

Stările sunt grupate pentru UI în categorii precum:

```text
active
pending
archived
```

---

# Incident selectat

La selectarea unui incident, interfața poate afișa un panou operațional dedicat.

Acesta poate conține:

- titlul incidentului;
- codul;
- starea;
- prioritatea;
- tipurile;
- locația;
- resursele necesare;
- vehiculele participante;
- solicitările de întăriri;
- progresul informațiilor specializate.

Acest panou reprezintă un rezumat operațional și nu înlocuiește raportul final.

---

# `reinforcement-requests-ui.js`

Modulul controlează tab-ul pentru cereri de întăriri.

Cererile sunt identificate individual prin ID.

Acest lucru permite existența mai multor solicitări:

```text
același incident
+
același vehicul
+
momente diferite
```

fără ca acestea să fie combinate greșit într-o singură cerere.

---

# Chestionarele specializate

Interfața include chestionare adaptate tipului de serviciu.

Sunt tratate separat:

```text
Poliție
Ambulanță
Pompieri
```

Frontend-ul solicită rapoartele incidentului prin API și construiește dinamic câmpurile necesare.

Răspunsurile pot fi:

- completate;
- modificate;
- salvate;
- confirmate.

După confirmare, datele pot deveni parte din istoricul operațional al incidentului.

---

# `ui-controller.js`

Acest fișier coordonează schimbările majore de stare ale interfeței.

De exemplu, la schimbarea tab-ului:

```text
Vehicule → Incidente
```

sunt resetate elemente care nu mai sunt relevante:

- selecții;
- rute;
- markere;
- panouri.

Scopul este evitarea afișării simultane a informațiilor aparținând unor contexte diferite.

---

# Refresh automat

Interfața utilizează polling.

Sunt definite intervale pentru:

- vehicule;
- incidente;
- trasee;
- cereri.

Prin polling, browserul solicită periodic date noi fără reîncărcarea completă a paginii.

Acest mecanism face posibilă simularea unei interfețe aproape real-time fără WebSockets.

---

# `admin.html`

Interfața administratorului este separată vizual și logic de dispecerat.

Secțiuni principale:

```text
Prezentare generală
Utilizatori
Vehicule
Bază de date
SQL Console
```

---

# `admin.js`

`admin.js` controlează interfața administratorului.

Responsabilități:

- verificarea sesiunii;
- navigarea între secțiuni;
- încărcarea statisticilor;
- administrarea utilizatorilor;
- afișarea vehiculelor;
- navigarea bazei de date;
- consola SQL.

---

# `admin-api.js`

Acesta implementează request-urile către:

```text
/api/admin/*
```

Exemple:

```text
GET  /api/admin/dashboard
GET  /api/admin/users
POST /api/admin/users
PATCH /api/admin/users/:id/active
PATCH /api/admin/users/:id/password
GET  /api/admin/vehicles
GET  /api/admin/database/tables
POST /api/admin/database/query
```

---

# `driver.html`

Pagina driver prezintă doar informațiile utile unui echipaj.

Nu este o versiune redusă a dispeceratului, ci o interfață separată.

Conține:

- identitatea vehiculului;
- starea sistemului;
- stare operațională;
- viteză;
- coordonate;
- ultima actualizare;
- incident activ;
- hartă;
- traseu;
- cerere de întăriri;
- vehicule relevante.

---

# Temele driver

În funcție de serviciu:

```text
police
ambulance
fire
```

sunt modificate variabile CSS.

Astfel un utilizator poate identifica rapid categoria operațională.

---

# `driver-api.js`

Acest fișier comunică cu endpoint-urile dedicate șoferului.

Operații principale:

```text
getDashboard()
getMissionRoute()
createReinforcementRequest()
getLatestReinforcementRequest()
```

---

# `driver.js`

`driver.js` conține logica principală a dashboard-ului de șofer.

Sunt păstrate informații precum:

```text
driverCurrentUser
driverVehicle
driverMission
driverMap
driverRouteData
driverReinforcementRequest
```

Pagina se actualizează periodic.

---

# CSS

Stilurile sunt împărțite pe responsabilități.

```text
base.css
```

reguli generale.

```text
layout.css
```

structura principală.

```text
components.css
```

componentele reutilizabile ale dispeceratului.

```text
map.css
```

elementele hărții.

```text
login.css
```

pagina de login.

```text
admin.css
```

interfața administratorului.

```text
driver.css
```

interfața șoferului.

---

# Cache busting

Unele fișiere sunt încărcate astfel:

```html
<script src="js/api.js?v=18"></script>
```

sau:

```html
<link rel="stylesheet" href="css/components.css?v=21">
```

Parametrul `v` ajută la forțarea browserului să încarce o versiune nouă după modificări.

---

# Servirea frontend-ului

Containerul frontend folosește serverul HTTP inclus în Python.

Conceptual:

```bash
python3 -m http.server 8000
```

HAProxy comunică intern cu frontend-ul pe portul:

```text
8000
```

Browserul nu accesează direct acest port.

---

# Relația cu HAProxy

Pentru frontend:

```text
GET /dispatcher.html
        │
        ▼
HAProxy
        │
        ▼
frontend:8000
```

Pentru API:

```text
GET /api/vehicles
        │
        ▼
HAProxy
        │
        ▼
web1 sau web2
```

Din acest motiv JavaScript folosește URL-uri relative:

```javascript
fetch("/api/vehicles")
```

și nu trebuie să cunoască adresele containerelor.

---

# Depanare frontend

## Datele nu se încarcă

Verifică:

```text
DevTools
→ Network
→ request /api/...
```

Dacă apare 401:

```text
problemă de autentificare
```

Dacă apare 503:

```text
backend indisponibil
```

Dacă request-ul este 200, dar UI-ul nu se actualizează:

```text
verifică JavaScript Console
```

---

# Documentație asociată

Backend:

```text
../backend/README.md
```

Database:

```text
../database/README.md
```

Simulator:

```text
../raspberry/README.md
```