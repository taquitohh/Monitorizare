# Documentația proiectului

Folderul `docs` centralizează documentația extinsă a Sistemului de monitorizare GPS și management al incidentelor.

README-urile existente în directoarele aplicației explică fiecare componentă din perspectiva implementării.

Documentația din acest folder urmărește sistemul în ansamblu.

---

# Scopul documentației

Documentația trebuie să permită unei persoane care nu a participat la dezvoltarea proiectului să înțeleagă:

- problema rezolvată;
- arhitectura;
- rolul fiecărei componente;
- structura codului;
- structura bazei de date;
- autentificarea;
- fluxurile operaționale;
- simulatorul GPS;
- rutarea;
- instalarea;
- pornirea;
- testarea;
- depanarea.

Obiectivul este ca proiectul să poată fi reconstruit și înțeles fără explicații suplimentare din partea autorului.

---

# Documentul principal

Documentația tehnică principală va fi păstrată sub forma:

```text
Documentatie_Sistem_Monitorizare_GPS.docx
```

Aceasta va reprezenta documentul complet al proiectului.

---

# Structura recomandată

```text
docs/
│
├── README.md
│
├── Documentatie_Sistem_Monitorizare_GPS.docx
│
├── diagrams/
│   ├── architecture.png
│   ├── database-er.png
│   ├── authentication-flow.png
│   ├── incident-flow.png
│   ├── dispatch-flow.png
│   ├── reinforcement-flow.png
│   ├── questionnaire-flow.png
│   └── gps-simulator-flow.png
│
└── images/
    ├── login/
    ├── admin/
    ├── dispatcher/
    ├── driver/
    ├── questionnaires/
    └── reports/
```

---

# Diagrame

Folderul:

```text
docs/diagrams/
```

este destinat diagramelor tehnice.

---

## `architecture.png`

Trebuie să prezinte relația:

```text
Browser
  ↓
HAProxy
  ├── Frontend
  └── web1 / web2
           ↓
         MariaDB
           ↑
       Raspberry
```

---

## `database-er.png`

Va prezenta relațiile dintre:

```text
users
vehicles
positions
incidents
assignments
reinforcements
specialist reports
events
```

---

## `authentication-flow.png`

Flux:

```text
Login
  ↓
Backend
  ↓
Password verification
  ↓
Token
  ↓
sessionStorage
  ↓
Authorization header
```

---

## `incident-flow.png`

Fluxul complet al incidentului:

```text
Creare
  ↓
Locație
  ↓
Resurse
  ↓
Recomandare
  ↓
Asignare
  ↓
Deplasare
  ↓
Intervenție
  ↓
Finalizare
  ↓
Raport
```

---

## `reinforcement-flow.png`

```text
Driver
  ↓
Cerere
  ↓
Dispatcher
  ↓
Decizie
  ↓
Resurse suplimentare
```

---

## `questionnaire-flow.png`

```text
Incident
  ↓
Serviciu
  ↓
Chestionar
  ↓
Răspunsuri
  ↓
Confirmare
  ↓
Istoric / raportare
```

---

## `gps-simulator-flow.png`

```text
GraphML
  ↓
RoadNetwork
  ↓
Vehicle
  ↓
MovementEngine
  ↓
API
  ↓
Database
  ↓
Frontend map
```

---

# Capturi de ecran

Capturile sunt păstrate în:

```text
docs/images/
```

Ele trebuie organizate după componentă.

---

# Login

```text
docs/images/login/
```

Exemple:

```text
login-page.png
login-error.png
```

---

# Administrator

```text
docs/images/admin/
```

Exemple:

```text
admin-overview.png
admin-users.png
admin-vehicles.png
admin-database.png
admin-sql-console.png
```

---

# Dispatcher

```text
docs/images/dispatcher/
```

Exemple:

```text
dispatcher-vehicles.png
dispatcher-selected-vehicle.png
dispatcher-new-incident.png
dispatcher-recommendation.png
dispatcher-active-incident.png
dispatcher-routes.png
dispatcher-requests.png
dispatcher-selected-incident.png
```

---

# Driver

```text
docs/images/driver/
```

Exemple:

```text
driver-police.png
driver-ambulance.png
driver-fire.png
driver-active-mission.png
driver-reinforcement.png
```

---

# Chestionare

```text
docs/images/questionnaires/
```

Exemple:

```text
questionnaire-police.png
questionnaire-ambulance.png
questionnaire-fire.png
```

---

# Rapoarte

```text
docs/images/reports/
```

Exemple:

```text
incident-report-page-1.png
incident-report-route.png
```

---

# Documentația tehnică principală

Documentul DOCX va include cel puțin următoarele capitole:

```text
1. Introducere
2. Scop
3. Cerințe funcționale
4. Cerințe nefuncționale
5. Arhitectură
6. Structura repository-ului
7. Docker
8. HAProxy
9. MariaDB
10. Modelul de date
11. Autentificare
12. Rolurile utilizatorilor
13. Administrator
14. Dispatcher
15. Driver
16. Monitorizare GPS
17. Crearea incidentelor
18. Multi-vehicle dispatch
19. Recomandarea vehiculelor
20. Rutarea
21. Simulatorul GPS
22. Cererile de întăriri
23. Chestionarele specializate
24. Evenimentele incidentului
25. Raportarea PDF
26. API REST
27. Instalare de la zero
28. Testare end-to-end
29. Troubleshooting
30. Securitate
31. Limitări
32. Dezvoltări viitoare
33. Concluzii
```

---

# Relația dintre README-uri și DOCX

README-urile sunt destinate navigării rapide prin repository.

Exemplu:

```text
backend/README.md
```

explică backend-ul.

```text
frontend/README.md
```

explică interfața.

```text
database/README.md
```

explică persistența.

Documentul DOCX va lega toate aceste componente într-o singură descriere coerentă.

---

# Regula pentru capturi

Capturile folosite în documentație trebuie:

- să fie clare;
- să nu fie tăiate inutil;
- să prezinte o singură funcționalitate importantă;
- să utilizeze date de test;
- să nu expună parole reale;
- să aibă nume descriptive.

În document fiecare imagine va avea legendă.

Exemplu:

```text
Figura 12 – Formularul de creare a unui incident și selectarea resurselor necesare.
```

---

# Actualizarea documentației

Dacă este modificată o funcționalitate importantă, trebuie verificat dacă sunt afectate:

```text
README.md
README-ul componentei
Documentatie_Sistem_Monitorizare_GPS.docx
diagramele
capturile
```

Documentația trebuie să descrie implementarea existentă, nu o versiune veche a proiectului.