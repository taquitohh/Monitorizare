# Sistem de monitorizare GPS și management al incidentelor

## Despre proiect

Acest proiect implementează un sistem distribuit pentru monitorizarea în timp real a vehiculelor și pentru gestionarea operațională a incidentelor care necesită intervenția serviciilor de urgență.

Aplicația modelează trei categorii principale de vehicule și servicii:

- Poliție;
- Ambulanță;
- Pompieri.

Sistemul permite monitorizarea pozițiilor GPS ale vehiculelor, crearea incidentelor, selectarea resurselor necesare, recomandarea și asignarea vehiculelor, urmărirea traseelor către incidente, gestionarea cererilor de întăriri și păstrarea informațiilor colectate pe parcursul unei intervenții.

Proiectul nu reprezintă doar o hartă cu vehicule. El urmărește întregul ciclu operațional al unui incident, de la apariția evenimentului și selectarea locației până la deplasarea vehiculelor, intervenție și arhivarea incidentului.

---

## Scopul sistemului

Scopul principal al aplicației este simularea unei platforme de coordonare a vehiculelor de intervenție.

Din punct de vedere funcțional, sistemul urmărește următoarele obiective:

- afișarea în timp real a vehiculelor pe o hartă;
- stocarea pozițiilor GPS;
- păstrarea istoricului deplasărilor;
- autentificarea utilizatorilor;
- separarea accesului în funcție de rol;
- crearea și administrarea incidentelor;
- selectarea uneia sau mai multor categorii de incident;
- definirea resurselor necesare pentru fiecare incident;
- asignarea mai multor vehicule la aceeași intervenție;
- recomandarea vehiculelor disponibile;
- calcularea traseelor;
- urmărirea deplasării către incident;
- gestionarea cererilor de întăriri;
- colectarea informațiilor specializate;
- administrarea utilizatorilor și a bazei de date;
- generarea rapoartelor pentru incidente.

---

## Arhitectura generală

Aplicația este împărțită în mai multe componente independente:

```text
                         Browser
                            │
                            │ HTTP
                            ▼
                       ┌─────────┐
                       │ HAProxy │
                       └────┬────┘
                            │
                ┌───────────┴───────────┐
                │                       │
           cereri web               /api/*
                │                       │
                ▼                 ┌─────┴─────┐
          ┌──────────┐            │           │
          │ Frontend │          web1        web2
          │          │          Flask       Flask
          └──────────┘            │           │
                                  └─────┬─────┘
                                        │
                                        ▼
                                   ┌─────────┐
                                   │ MariaDB │
                                   └────▲────┘
                                        │
                                        │ poziții GPS
                                        │
                                  ┌───────────┐
                                  │ Raspberry │
                                  │ Simulator │
                                  └───────────┘
```

### Frontend

Frontend-ul reprezintă interfața vizibilă utilizatorului.

Este implementat în:

- HTML;
- CSS;
- JavaScript.

Interfața folosește Leaflet pentru afișarea hărții și comunică exclusiv prin API cu backend-ul.

### Backend

Backend-ul este implementat în Python folosind Flask.

El este responsabil pentru:

- autentificare;
- autorizare;
- validarea datelor;
- logica incidentelor;
- lucrul cu vehiculele;
- recomandarea resurselor;
- asignări;
- rute;
- cereri de întăriri;
- acces la baza de date;
- rapoarte.

În configurația Docker există două instanțe ale backend-ului:

```text
web1
web2
```

Acestea rulează aceeași aplicație Flask și pot primi cereri prin HAProxy.

### Database

MariaDB reprezintă stratul de persistență al sistemului.

Baza de date păstrează, printre altele:

- utilizatorii;
- vehiculele;
- ultima poziție GPS;
- istoricul pozițiilor;
- incidentele;
- tipurile de incident;
- resursele solicitate;
- asignările vehiculelor;
- cererile de întăriri;
- evenimentele incidentelor;
- datele specializate colectate în timpul intervențiilor.

### Raspberry / GPS Simulator

Componenta `raspberry` simulează dispozitivele GPS asociate vehiculelor.

Aceasta:

- creează vehicule simulate;
- le poziționează pe o rețea rutieră;
- actualizează poziția și viteza;
- transmite datele către backend;
- verifică dacă un vehicul a primit un incident;
- calculează deplasarea către incident;
- notifică serverul atunci când vehiculul ajunge la destinație.

### HAProxy

HAProxy reprezintă punctul unic de intrare în sistem.

Cererile sunt separate în două categorii:

```text
/...
    → frontend

/api/...
    → web1 / web2
```

Astfel, browserul nu trebuie să cunoască adresele interne ale containerelor.

---

# Rolurile aplicației

Sistemul conține trei roluri principale.

## Administrator

Administratorul gestionează partea administrativă a sistemului.

Interfața sa permite:

- vizualizarea unei prezentări generale;
- consultarea statisticilor;
- administrarea utilizatorilor;
- activarea și dezactivarea conturilor;
- resetarea parolelor;
- consultarea vehiculelor;
- explorarea structurii bazei de date;
- vizualizarea rândurilor din tabele;
- executarea controlată a interogărilor SQL.

Administratorul poate accesa și pagina de dispecerat.

---

## Dispatcher

Dispecerul reprezintă utilizatorul care coordonează intervențiile.

Interfața de dispecerat permite:

- vizualizarea vehiculelor pe hartă;
- filtrarea vehiculelor;
- selectarea unui vehicul;
- consultarea poziției și stării vehiculului;
- vizualizarea incidentelor;
- filtrarea incidentelor;
- crearea unui incident;
- alegerea locației direct de pe hartă;
- definirea tipurilor incidentului;
- selectarea priorității;
- solicitarea resurselor de Poliție, Ambulanță și Pompieri;
- obținerea recomandărilor;
- asignarea mai multor vehicule;
- urmărirea rutelor active;
- consultarea cererilor de întăriri;
- aprobarea sau respingerea acestora;
- consultarea informațiilor incidentului;
- accesarea raportului după finalizarea incidentului.

Panoul lateral al dispecerului este împărțit în:

```text
Vehicule
Incidente
Cereri
```

---

## Driver

Rolul `driver` reprezintă echipajul asociat unui vehicul.

După autentificare, utilizatorul primește o interfață construită în jurul vehiculului său.

Driver-ul poate consulta:

- codul vehiculului;
- tipul vehiculului;
- starea operațională;
- viteza;
- coordonatele GPS;
- ultima actualizare;
- incidentul activ;
- prioritatea incidentului;
- locația destinației;
- traseul;
- alte vehicule relevante;
- starea unei cereri de întăriri.

Interfața își schimbă tema vizuală în funcție de serviciu:

- albastru pentru Poliție;
- roșu pentru Ambulanță;
- portocaliu pentru Pompieri.

---

# Fluxul principal al unui incident

Un scenariu complet poate fi reprezentat astfel:

```text
1. Vehiculele trimit poziții GPS
            │
            ▼
2. Dispatcher-ul vede vehiculele pe hartă
            │
            ▼
3. Este creat un incident
            │
            ▼
4. Se aleg tipurile incidentului
            │
            ▼
5. Se stabilesc resursele necesare
            │
            ▼
6. Se selectează locația
            │
            ▼
7. Backend-ul caută vehicule disponibile
            │
            ▼
8. Dispatcher-ul confirmă asignarea
            │
            ▼
9. Vehiculele primesc misiunea
            │
            ▼
10. Simulatorul calculează deplasarea
            │
            ▼
11. Vehiculele se deplasează spre incident
            │
            ▼
12. Pozițiile sunt actualizate pe hartă
            │
            ▼
13. Pot fi solicitate întăriri
            │
            ▼
14. Sunt colectate date operaționale
            │
            ▼
15. Incidentul este finalizat
            │
            ▼
16. Datele rămân disponibile pentru istoric și raportare
```

---

# Monitorizarea GPS

Fiecare vehicul are:

- cod unic;
- tip;
- stare;
- poziție;
- viteză.

Simulatorul transmite periodic aceste informații către:

```text
POST /api/vehicles
```

Backend-ul actualizează poziția curentă și păstrează istoricul pozițiilor.

Frontend-ul solicită lista vehiculelor și reconstruiește periodic starea hărții.

---

# Incidente

Un incident conține informații precum:

- cod unic;
- titlu;
- prioritate;
- detalii;
- coordonate;
- stare;
- momente importante ale intervenției.

Un incident poate avea mai multe tipuri simultan.

Exemple de categorii implementate în sistem:

### Poliție

- accident rutier;
- furt;
- agresiune;
- tulburarea ordinii publice;
- persoană dispărută.

### Medical

- urgență medicală;
- persoană inconștientă;
- persoană rănită;
- urgență cardiacă;
- transport medical urgent.

### Pompieri

- incendiu clădire;
- incendiu vehicul;
- incendiu vegetație;
- scurgere de gaz;
- explozie.

---

# Resurse multiple

Un incident nu este limitat la un singur vehicul.

Dispecerul poate solicita, de exemplu:

```text
2 x Poliție
1 x Ambulanță
1 x Pompieri
```

Asignările efective sunt păstrate separat de incident, ceea ce permite unui incident să aibă mai multe vehicule participante.

---

# Recomandarea vehiculelor

După salvarea locației incidentului, sistemul poate analiza vehiculele disponibile.

Recomandarea ia în considerare:

- tipul vehiculului;
- disponibilitatea;
- poziția curentă;
- distanța față de incident;
- resursele solicitate.

Frontend-ul afișează vehiculele recomandate, iar decizia finală de asignare aparține dispecerului.

---

# Rutarea

Pentru calcularea rutelor se utilizează o rețea rutieră salvată în:

```text
raspberry/data/road_network.graphml
```

NetworkX este utilizat pentru operațiile pe graf.

Procesul general este:

```text
poziție vehicul
      │
      ▼
cel mai apropiat nod
      │
      ▼
shortest path
      │
      ▼
nod destinație
      │
      ▼
poziție incident
```

Distanțele geografice sunt calculate și prin formula Haversine atunci când este necesar.

---

# Cereri de întăriri

Un echipaj aflat într-o intervenție poate solicita resurse suplimentare.

Fluxul este:

```text
Driver
   │
   ▼
Cerere de întăriri
   │
   ▼
Backend
   │
   ▼
MariaDB
   │
   ▼
Dispatcher
   │
   ├── Aprobare
   │
   └── Respingere
```

La aprobare pot fi asignate alte vehicule incidentului existent.

---

# Autentificare

Autentificarea este bazată pe token-uri.

După login:

```text
username + password
        │
        ▼
POST /api/auth/login
        │
        ▼
verificare backend
        │
        ▼
access token
        │
        ▼
sessionStorage
        │
        ▼
Authorization: Bearer <token>
```

Token-ul este trimis automat de frontend pentru operațiile protejate.

---

# Structura proiectului

```text
Monitorizare/
│
├── backend/
│   ├── app.py
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── README.md
│
├── database/
│   ├── init/
│   ├── docs/
│   └── README.md
│
├── frontend/
│   ├── css/
│   ├── js/
│   ├── index.html
│   ├── admin.html
│   ├── dispatcher.html
│   ├── driver.html
│   ├── Dockerfile
│   └── README.md
│
├── haproxy/
│   ├── haproxy.cfg
│   ├── Dockerfile
│   └── README.md
│
├── raspberry/
│   ├── data/
│   ├── api_client.py
│   ├── config.py
│   ├── main.py
│   ├── movement.py
│   ├── routes.py
│   ├── vehicles.py
│   ├── Dockerfile
│   └── README.md
│
├── docs/
│   └── README.md
│
├── docker-compose.yml
└── README.md
```

---

# Tehnologii

## Backend

- Python 3.11
- Flask
- Flask-CORS
- PyMySQL
- NetworkX
- ReportLab
- StaticMap

## Frontend

- HTML5
- CSS3
- JavaScript
- Leaflet.js

## Infrastructură

- Docker
- Docker Compose
- HAProxy
- MariaDB

## Simulator

- Python
- Requests
- NetworkX
- NumPy / OSMnx, unde sunt necesare pentru datele rutiere

---

# Docker Compose

Aplicația este orchestrată cu Docker Compose.

Sunt definite următoarele servicii:

```text
web1
web2
frontend
haproxy
database
raspberry
```

Toate serviciile comunică prin:

```text
internal_net
```

Datele MariaDB sunt persistate în:

```text
db_data
```

---

# Pornirea aplicației

Din directorul principal:

```bash
docker compose up -d --build
```

Verificarea containerelor:

```bash
docker compose ps
```

sau:

```bash
docker ps
```

După pornire, aplicația este disponibilă la:

```text
http://localhost
```

HAProxy expune portul 80 al sistemului.

---

# Oprirea aplicației

```bash
docker compose down
```

Această comandă oprește containerele, dar păstrează volumul bazei de date.

Pentru ștergerea completă inclusiv a volumului:

```bash
docker compose down -v
```

> Atenție: opțiunea `-v` șterge datele persistente din MariaDB.

---

# Reconstruirea unei componente

Backend:

```bash
docker compose build web1 web2
docker compose up -d web1 web2
```

Frontend:

```bash
docker compose build frontend
docker compose up -d frontend
```

Simulator:

```bash
docker compose build raspberry
docker compose up -d raspberry
```

HAProxy:

```bash
docker compose build haproxy
docker compose up -d haproxy
```

---

# Verificarea logurilor

Backend:

```bash
docker logs web1 --tail 150
docker logs web2 --tail 150
```

Simulator:

```bash
docker logs raspberry --tail 150
```

HAProxy:

```bash
docker logs haproxy --tail 150
```

Database:

```bash
docker logs database --tail 150
```

---

# Accesarea bazei de date

Exemplu pentru configurația locală:

```bash
docker compose exec database mariadb -u gps_user -p gps_tracking
```

După conectare:

```sql
SHOW TABLES;
```

---

# Conturi de test

În proiect există scriptul:

```text
backend/create_test_users.py
```

Acesta poate crea utilizatorii de bază și conturile asociate vehiculelor.

Dacă este necesară inițializarea lor manuală:

```bash
docker compose exec web1 python create_test_users.py
```

Conturile și parolele incluse în proiect trebuie considerate exclusiv date de dezvoltare/test.

Pentru un deployment real, parolele și cheile secrete trebuie mutate în variabile de mediu și înlocuite.

---

# Depanare rapidă

## 503 Service Unavailable

Dacă browserul afișează:

```text
503 Service Unavailable
```

se verifică mai întâi:

```bash
docker ps
```

Dacă `web1` și `web2` apar cu starea `Restarting`, problema este în backend.

Se consultă:

```bash
docker logs web1 --tail 150
docker logs web2 --tail 150
```

---

## Verificare sintaxă Python

Înainte de rebuild:

```bash
python -m compileall backend
```

sau pentru un fișier individual:

```bash
python -m py_compile backend/services/report_service.py
```

---

## Modificările frontend nu apar

Browserul poate păstra resurse CSS și JavaScript în cache.

În proiect sunt utilizate și versiuni în URL:

```text
components.css?v=...
api.js?v=...
```

După modificări importante poate fi necesară actualizarea versiunii sau un hard refresh.

---

# Documentație suplimentară

Pentru explicații detaliate despre fiecare componentă:

```text
backend/README.md
frontend/README.md
database/README.md
raspberry/README.md
haproxy/README.md
docs/README.md
```

Documentația tehnică extinsă a proiectului este păstrată în folderul:

```text
docs/
```

---

# Notă

Proiectul este construit ca platformă educațională și de simulare.

Componenta GPS este în prezent simulată software, iar aplicația nu trebuie considerată un sistem certificat pentru coordonarea intervențiilor reale.