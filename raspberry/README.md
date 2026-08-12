# Raspberry / GPS Vehicle Simulator

## Rolul componentei

Folderul `raspberry` reprezintă sursa datelor GPS utilizate de sistem.

În configurația actuală nu este necesar un dispozitiv Raspberry Pi fizic. Componenta rulează ca simulator software și reproduce comportamentul unor dispozitive GPS instalate pe vehicule.

Arhitectura este intenționat separată de backend.

Conceptual:

```text
Vehicul / dispozitiv GPS
          │
          ▼
       Raspberry
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

Această separare permite înlocuirea simulatorului, în viitor, cu hardware real fără schimbarea fundamentală a backend-ului.

---

# Funcționalități

Simulatorul este responsabil pentru:

- încărcarea rețelei rutiere;
- crearea vehiculelor;
- alegerea pozițiilor inițiale;
- simularea vitezei;
- deplasarea aleatorie;
- transmiterea poziției către server;
- verificarea asignărilor;
- calcularea traseului către incident;
- urmărirea traseului;
- detectarea sosirii;
- notificarea backend-ului;
- revenirea la deplasarea normală.

---

# Structură

```text
raspberry/
│
├── main.py
├── api_client.py
├── config.py
├── movement.py
├── routes.py
├── vehicles.py
├── requirements.txt
├── Dockerfile
│
└── data/
    └── road_network.graphml
```

---

# `config.py`

Acest fișier conține configurația principală a simulatorului.

Valori importante:

```text
API_URL
NUMBER_OF_VEHICLES
UPDATE_INTERVAL
MIN_SPEED
MAX_SPEED
MAX_SPEED_CHANGE
```

Configurația implicită utilizează:

```text
NUMBER_OF_VEHICLES = 15
UPDATE_INTERVAL = 1
```

Aceasta înseamnă că sunt create 15 vehicule și bucla principală rulează aproximativ o dată pe secundă.

---

# API URL

În Docker:

```text
API_URL=http://haproxy/api/vehicles
```

Simulatorul comunică prin HAProxy, exact ca alte componente ale sistemului.

Nu comunică direct cu:

```text
web1
```

sau:

```text
web2
```

---

# `vehicles.py`

Acest modul definește obiectul `Vehicle`.

Fiecare vehicul are:

- cod;
- tip;
- nod curent;
- nod anterior;
- nod următor;
- latitudine;
- longitudine;
- viteză;
- stare;
- incident asignat;
- destinație;
- traseu.

---

# Codurile vehiculelor

Vehiculele sunt create folosind convenția:

```text
VEHICLE-001
VEHICLE-002
VEHICLE-003
...
VEHICLE-015
```

Această convenție este utilizată și în alte componente ale sistemului.

---

# Tipurile vehiculelor

Simulatorul poate crea:

```text
police
ambulance
fire
```

Tipul este transmis backend-ului împreună cu poziția.

---

# Datele transmise

Metoda `get_data()` construiește payload-ul pentru server.

Exemplu:

```json
{
    "vehicle_id": "VEHICLE-005",
    "vehicle_type": "fire",
    "latitude": 44.421,
    "longitude": 26.103,
    "speed": 52.4,
    "status": "active"
}
```

---

# `api_client.py`

Acest fișier conține request-urile HTTP către sistem.

Funcții principale:

```text
send_vehicle_data()
get_active_assignment()
notify_incident_arrived()
```

---

# `send_vehicle_data()`

Această funcție trimite poziția și starea vehiculului.

Conceptual:

```text
Vehicle
   │
   ▼
get_data()
   │
   ▼
POST /api/vehicles
   │
   ▼
Backend
```

Este folosit un timeout pentru a evita blocarea simulatorului la infinit dacă serverul nu răspunde.

---

# Verificarea asignării

Înainte de deplasare, simulatorul poate cere backend-ului informații despre misiunea activă.

Flux:

```text
VEHICLE-007
     │
     ▼
GET active assignment
     │
     ▼
assigned = true?
     │
 ┌───┴───┐
 │       │
NU       DA
 │       │
 ▼       ▼
random  incident
```

---

# `main.py`

`main.py` este punctul de intrare al simulatorului.

La pornire:

```text
RoadNetwork()
     │
     ▼
create_vehicles()
     │
     ▼
MovementEngine()
     │
     ▼
bucla principală
```

---

# Bucla principală

Pentru fiecare vehicul sunt efectuate aproximativ următoarele operații:

```text
1. verifică incidentul activ
2. sincronizează asignarea
3. deplasează vehiculul
4. verifică sosirea
5. trimite poziția către backend
6. afișează informații în log
```

Apoi simulatorul așteaptă:

```text
UPDATE_INTERVAL
```

și repetă.

---

# Modurile de deplasare

Există conceptual două moduri:

```text
RANDOM
INCIDENT
```

---

# RANDOM

Dacă vehiculul nu are o misiune, acesta se deplasează aleator pe rețeaua rutieră.

În loc să modifice pur și simplu coordonatele fără restricții, simulatorul lucrează cu nodurile și vecinii grafului.

Astfel mișcarea urmărește structura drumurilor.

---

# INCIDENT

Dacă backend-ul raportează o asignare activă, vehiculul primește:

- incidentul;
- latitudinea destinației;
- longitudinea destinației.

Simulatorul pregătește apoi un traseu dedicat.

---

# `routes.py`

Acest modul conține clasa:

```text
RoadNetwork
```

Rețeaua este încărcată din:

```text
data/road_network.graphml
```

folosind:

```python
networkx.read_graphml()
```

---

# Ce este GraphML

GraphML este un format pentru reprezentarea grafurilor.

În proiect:

```text
nod
→ punct al rețelei rutiere

muchie
→ segment de drum
```

Nodurile conțin coordonate geografice.

Muchiile pot conține lungimea segmentelor.

---

# Alegerea unui nod aleator

La crearea vehiculului, simulatorul poate selecta un nod din graf.

Acesta devine poziția inițială.

Ulterior este ales un vecin pentru continuarea deplasării.

---

# Haversine

`RoadNetwork` conține și calculul distanței Haversine.

Această metodă determină distanța aproximativă pe suprafața Pământului dintre două perechi:

```text
latitudine
longitudine
```

Este utilă pentru:

- găsirea nodului apropiat;
- detectarea apropierii de incident;
- comparații geografice.

---

# Cel mai apropiat nod

Coordonatele incidentului pot fi oriunde pe hartă și nu trebuie să coincidă exact cu un nod GraphML.

Din acest motiv:

```text
incident coordinates
        │
        ▼
find_nearest_node()
        │
        ▼
road graph node
```

Aceeași operație este realizată pentru poziția vehiculului.

---

# Calcularea traseului

După găsirea nodurilor:

```text
start node
     │
     ▼
NetworkX shortest_path
     │
     ▼
destination node
```

Funcția utilizează lungimea muchiilor drept cost.

Dacă nu există traseu în orientarea originală a grafului, implementarea poate încerca și o versiune neorientată.

---

# `MovementEngine`

`movement.py` conține motorul de deplasare.

Acesta nu se ocupă de HTTP.

Responsabilitatea sa este exclusiv mișcarea vehiculului.

---

# Pregătirea traseului incidentului

Când un vehicul primește o misiune:

```text
vehicle.destination
       │
       ▼
calculate_route()
       │
       ▼
route_nodes
       │
       ▼
vehicle.route
```

Vehiculul trece în:

```text
follow_route = True
```

---

# Urmărirea nodurilor

În modul INCIDENT, vehiculul se apropie succesiv de nodurile traseului.

Conceptual:

```text
current_node
     │
     ▼
next_node
     │
     ▼
next_node
     │
     ▼
...
     │
     ▼
incident
```

---

# Detectarea sosirii

Motorul calculează distanța față de destinație.

Pragul curent este aproximativ:

```text
0.03 km
```

adică aproximativ câteva zeci de metri.

Dacă vehiculul intră în această rază, incidentul este considerat atins.

---

# Notificarea sosirii

După detectarea sosirii:

```text
MovementEngine
      │
      ▼
main.py
      │
      ▼
notify_incident_arrived()
      │
      ▼
PATCH backend
```

Backend-ul poate actualiza starea operațională a asignării/incidentului.

---

# Revenirea la RANDOM

După închiderea misiunii, vehiculul:

- șterge incidentul;
- șterge destinația;
- resetează traseul;
- găsește cel mai apropiat nod;
- selectează un vecin;
- reia deplasarea normală.

---

# Efectul asupra site-ului

Această componentă este responsabilă pentru mișcarea vizibilă pe hartă.

Flux complet:

```text
MovementEngine
      │
      ▼
Vehicle coordinates
      │
      ▼
POST /api/vehicles
      │
      ▼
Backend
      │
      ▼
current_positions
      │
      ▼
GET /api/vehicles
      │
      ▼
Frontend
      │
      ▼
Leaflet marker
```

Prin urmare, deplasarea markerelor observată în browser provine din această componentă.

---

# Requirements

Bibliotecile includ:

```text
requests
networkx
osmnx
numpy
```

Instalare locală:

```bash
pip install -r requirements.txt
```

---

# Docker

Containerul pornește:

```bash
python3 main.py
```

Reconstruire:

```bash
docker compose build raspberry
docker compose up -d raspberry
```

---

# Loguri

```bash
docker logs raspberry --tail 150
```

Exemple de informații:

```text
VEHICLE-001 (police) -> HTTP 200
VEHICLE-007 [INCIDENT] incident=INCIDENT-...
VEHICLE-010 [RANDOM] incident=-
```

Aceste loguri sunt foarte utile pentru verificarea fluxului dintre simulator și backend.

---

# Înlocuirea cu hardware real

Simulatorul poate fi înlocuit conceptual cu un Raspberry Pi sau alt dispozitiv GPS.

Dispozitivul real ar trebui să trimită același tip de payload către API.

```text
hardware GPS
    │
    ▼
latitude
longitude
speed
vehicle id
    │
    ▼
POST /api/vehicles
```

Aceasta este una dintre principalele motivații pentru separarea componentei de backend.