# Database

## Rolul bazei de date

Aplicația utilizează MariaDB pentru păstrarea persistentă a informațiilor.

Baza de date nu stochează doar pozițiile vehiculelor, ci întregul context operațional al sistemului:

- utilizatori;
- autentificare;
- vehicule;
- poziții GPS;
- istoricul pozițiilor;
- incidente;
- categorii;
- resurse solicitate;
- asignări;
- cereri de întăriri;
- evenimente;
- date specializate.

Baza principală se numește:

```text
gps_tracking
```

---

# Containerul MariaDB

Serviciul Docker poartă numele:

```text
database
```

Datele sunt persistate în volumul:

```text
db_data
```

Acest volum permite păstrarea bazei chiar dacă un container este recreat.

---

# Inițializarea bazei

MariaDB execută automat fișierele montate în:

```text
/docker-entrypoint-initdb.d
```

În proiect acest director este alimentat din:

```text
database/init/
```

---

## Observație importantă

Scripturile din `database/init` sunt aplicate automat atunci când MariaDB inițializează un volum nou.

Dacă volumul:

```text
db_data
```

există deja, simpla modificare a unui fișier SQL din `init/` nu înseamnă că acesta va fi executat din nou.

Pentru recrearea completă:

```bash
docker compose down -v
docker compose up -d --build
```

> Atenție: această operație șterge datele existente.

---

# Scripturile SQL

În proiect există scripturi precum:

```text
01_schema.sql
02_seed_data.sql
05_auth_tokens.sql
06_incident_multi_vehicle.sql
07_incident_categories.sql
07_reinforcement_requests.sql
08_reinforcement_dispatch.sql
```

Există și fișiere auxiliare sau snapshot-uri, de exemplu:

```text
schema-overview.sql
database_actuala.sql
```

Numerotarea scripturilor ajută la păstrarea unei ordini logice de creare și extindere a schemei.

---

# Gruparea logică a bazei

Schema poate fi înțeleasă mai ușor dacă este împărțită în domenii.

```text
AUTENTIFICARE
    │
    ├── users
    └── auth tokens

GPS
    │
    ├── vehicles
    ├── current_positions
    └── position_history

INCIDENTE
    │
    ├── incidents
    ├── incident_categories
    ├── incident requirements
    └── incident_assignments

ÎNTĂRIRI
    │
    ├── reinforcement_requests
    └── reinforcement_request_resources

DATE OPERAȚIONALE
    │
    ├── incident_events
    ├── incident_specialist_reports
    ├── incident_specialist_answers
    └── incident_specialist_answer_history
```

---

# Utilizatori

Tabelul utilizatorilor reprezintă baza sistemului de autentificare.

Un utilizator conține informații precum:

- ID;
- username;
- password hash;
- display name;
- role;
- stare activă;
- momentele de creare și modificare.

Rolurile sunt:

```text
administrator
dispatcher
driver
```

---

# Parole

În baza de date nu trebuie stocată parola originală.

Backend-ul utilizează:

```text
password_hash
```

iar verificarea este realizată cu Werkzeug.

---

# Token-uri

Sistemul folosește token-uri de acces pentru autentificare.

Acestea permit separarea dintre:

```text
credentialele utilizatorului
```

și:

```text
sesiunea activă
```

Token-urile pot fi invalidate la logout.

---

# Vehicule

Tabelul `vehicles` reprezintă flota sistemului.

Un vehicul poate conține:

- ID intern;
- cod;
- nume;
- tip;
- stare.

Codurile utilizate de simulator sunt de forma:

```text
VEHICLE-001
VEHICLE-002
...
VEHICLE-015
```

---

# Tipuri de vehicul

Sunt definite:

```text
police
ambulance
fire
```

În interfață acestea sunt prezentate ca:

```text
Poliție
Ambulanță
Pompieri
```

---

# Stările vehiculului

Exemple de stări:

```text
active
busy
inactive
```

Conceptual:

```text
active
→ disponibil

busy
→ implicat într-o misiune

inactive
→ indisponibil
```

---

# `current_positions`

Acest tabel păstrează ultima poziție cunoscută a vehiculului.

Separarea lui de istoricul GPS permite frontend-ului să încarce rapid:

- latitudine;
- longitudine;
- viteză;
- momentul ultimei actualizări.

Conceptual:

```text
vehicle
   │
   └── o singură poziție curentă
```

---

# `position_history`

Acest tabel păstrează pozițiile succesive primite de la simulator.

Conceptual:

```text
vehicle
   │
   ├── position 1
   ├── position 2
   ├── position 3
   ├── ...
   └── position N
```

Istoricul poate fi utilizat pentru:

- reconstruirea traseelor;
- raportare;
- verificarea deplasărilor;
- calcularea unor informații operaționale.

---

# `incidents`

Tabelul `incidents` reprezintă elementul central al unei intervenții.

Câmpurile importante includ:

- identificator;
- cod incident;
- titlu;
- prioritate;
- detalii;
- latitudine;
- longitudine;
- stare;
- data creării;
- data dispecerizării;
- data rezolvării.

---

# Codul incidentului

Backend-ul generează coduri de forma:

```text
INCIDENT-XXXXXXXXXXXX
```

Acestea permit identificarea incidentelor în interfață și în rapoarte fără utilizarea directă a ID-ului numeric.

---

# Stările incidentului

Un incident poate trece prin mai multe etape.

Exemple:

```text
draft
pending_location
pending_dispatch
assigned
in_progress
resolved
cancelled
```

Aceste stări permit frontend-ului să diferențieze:

```text
incidente în pregătire
incidente active
incidente arhivate
```

---

# `incident_categories`

Versiunea extinsă a sistemului permite unui incident să conțină mai multe categorii.

Exemplu:

```text
Accident rutier
+
Persoană rănită
+
Incendiu vehicul
```

Relația conceptuală este:

```text
incidents
    │
    ├── category 1
    ├── category 2
    └── category N
```

Acest model este mai flexibil decât stocarea unei singure categorii direct în `incidents`.

---

# Resursele necesare

Un incident poate solicita mai multe tipuri de vehicule.

Exemplu:

```text
2 Poliție
1 Ambulanță
1 Pompieri
```

Resursele necesare reprezintă cerința operațională.

Ele nu trebuie confundate cu vehiculele efectiv asignate.

```text
required resources
       ≠
actual assignments
```

---

# Modelul inițial de asignare

Versiunea inițială a proiectului folosea:

```text
incidents.assigned_vehicle_id
```

Această relație permitea practic un singur vehicul principal.

---

# Modelul multi-vehicle

Pentru suportul intervențiilor reale a fost introdus:

```text
incident_assignments
```

Relația este:

```text
Incident 1
   │
   ├── Assignment 1 → Vehicle 3
   ├── Assignment 2 → Vehicle 7
   └── Assignment 3 → Vehicle 12
```

---

# `incident_assignments`

O asignare păstrează mai mult decât legătura incident-vehicul.

Poate conține:

- `incident_id`;
- `vehicle_id`;
- `assignment_type`;
- status;
- `assigned_at`;
- `arrived_at`;
- `released_at`.

Aceste momente permit reconstruirea cronologiei fiecărui echipaj.

---

# Tipul asignării

Asignarea poate diferenția între:

```text
resursă inițială
```

și:

```text
întărire
```

Astfel, la final poate fi determinat de ce a ajuns fiecare vehicul la incident.

---

# Cererile de întăriri

Tabelul:

```text
reinforcement_requests
```

păstrează solicitările transmise de echipaje.

O cerere poate conține:

- incident;
- vehicul solicitant;
- mesaj;
- stare;
- momentul creării;
- momentul verificării;
- utilizatorul care a analizat cererea;
- mesajul dispecerului.

---

# Resursele unei cereri

Pentru solicitări care conțin mai multe tipuri de resurse este utilizată o structură separată.

Conceptual:

```text
reinforcement_request
        │
        ├── 1 x police
        ├── 2 x ambulance
        └── 1 x fire
```

Această structură permite urmărirea cantității:

```text
requested
approved
assigned
```

---

# De ce cererile sunt păstrate separat

Același vehicul poate trimite mai multe cereri pentru același incident.

Exemplu:

```text
12:30 - solicitare ambulanță
12:35 - solicitare încă o ambulanță
12:42 - solicitare pompieri
```

Acestea trebuie păstrate ca evenimente independente și nu suprascrise.

---

# Chestionarele specializate

Sistemul permite colectarea datelor specifice intervenției.

Structura principală este:

```text
incident_specialist_reports
```

Un raport este asociat:

- unui incident;
- unui tip de serviciu.

Tipurile sunt corespunzătoare:

```text
Poliție
Ambulanță
Pompieri
```

---

# `incident_specialist_answers`

Răspunsurile efective sunt păstrate separat de raport.

Avantajul este flexibilitatea:

```text
report
   │
   ├── question 1 → answer
   ├── question 2 → answer
   └── question N → answer
```

---

# `incident_specialist_answer_history`

Istoricul păstrează modificările răspunsurilor.

Scop:

- audit;
- urmărirea editărilor;
- diferențierea valorilor intermediare;
- păstrarea istoricului înainte de confirmare.

---

# Confirmarea datelor

Un raport specializat poate trece prin stări precum:

```text
pending
in_progress
confirmed
```

`confirmed` indică faptul că datele au ajuns într-o stare finală pentru fluxul respectiv.

---

# Evenimentele incidentului

`incident_events` poate fi utilizat pentru păstrarea unei cronologii operaționale.

Un eveniment poate descrie:

```text
incident creat
vehicul asignat
vehicul sosit
întăriri solicitate
cerere aprobată
date confirmate
incident finalizat
```

Astfel raportarea nu trebuie să deducă întreaga cronologie doar din stările finale ale tabelelor.

---

# Relații importante

Conceptual, modelul poate fi reprezentat astfel:

```text
users
  │
  └── auth

vehicles
  │
  ├── current_positions
  ├── position_history
  └── incident_assignments
                 │
                 ▼
              incidents
                 │
                 ├── categories
                 ├── requirements
                 ├── reinforcement_requests
                 ├── specialist_reports
                 └── incident_events
```

---

# Accesarea bazei

Din directorul proiectului:

```bash
docker compose exec database mariadb -u gps_user -p gps_tracking
```

---

# Comenzi utile

Listarea tabelelor:

```sql
SHOW TABLES;
```

Structura unui tabel:

```sql
DESCRIBE vehicles;
```

Vehicule:

```sql
SELECT * FROM vehicles;
```

Poziții curente:

```sql
SELECT * FROM current_positions;
```

Numărul pozițiilor istorice:

```sql
SELECT COUNT(*) FROM position_history;
```

Incidente:

```sql
SELECT
    id,
    incident_code,
    title,
    priority,
    status
FROM incidents
ORDER BY created_at DESC;
```

Asignări:

```sql
SELECT *
FROM incident_assignments
ORDER BY incident_id, id;
```

---

# Backup

În repository poate exista un snapshot precum:

```text
database_actuala.sql
```

Acesta trebuie tratat separat de mecanismul standard de inițializare.

Scripturile din:

```text
database/init/
```

trebuie considerate sursa reproductibilă pentru construirea structurii.

---

# Resetarea bazei

```bash
docker compose down -v
docker compose up -d --build
```

Această comandă:

1. oprește containerele;
2. șterge volumul;
3. creează MariaDB de la zero;
4. execută din nou scripturile SQL.

---

# Atenție la datele existente

Nu utiliza:

```bash
docker compose down -v
```

dacă datele curente trebuie păstrate.

Pentru simpla repornire:

```bash
docker compose down
docker compose up -d
```

---

# Configurație de dezvoltare

Datele de acces prezente în configurația locală sunt destinate dezvoltării.

Pentru un sistem real trebuie:

- parole unice;
- `.env`;
- acces MariaDB limitat;
- backup;
- utilizator DB cu permisiuni minime;
- rotația secretelor.

---

# Documentație asociată

Backend:

```text
../backend/README.md
```

Frontend:

```text
../frontend/README.md
```

Documentație generală:

```text
../README.md
```