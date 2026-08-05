# Monitorizare GPS

Acest proiect este o aplicație de monitorizare și gestionare a vehiculelor în timp real, cu posibilitatea de a crea incidente, de a recomanda vehicule și de a vizualiza locațiile pe hartă.

## Arhitectura generală

Proiectul este organizat în mai multe componente:

- Frontend: interfață web în HTML/CSS/JavaScript, cu harta Leaflet.
- Backend: serviciu Flask care expune API-uri pentru vehicule, incidente și recomandări.
- Database: MariaDB pentru stocarea datelor de vehicule, incidente și poziții.
- Raspberry: client care simulează sau trimite date pentru monitorizare.
- HAProxy: punct de intrare și distribuție a traficului.

## Structura proiectului

- backend/ – API-ul Flask și logica aplicației.
- frontend/ – interfața utilizatorului și resursele statice.
- database/ – scheme SQL și documentație pentru baza de date.
- raspberry/ – clientul/agentul pentru generarea sau transmiterea datelor.
- haproxy/ – configurarea proxy-ului invers.
- docs/ – documentație suplimentară.

## Cum rulează aplicația

Aplicația este orchestrată cu Docker Compose.

```bash
docker compose up --build
```

După pornire, accesarea aplicației se face prin browser la adresa:

- http://localhost:8080

## Funcționalități principale

- Vizualizarea vehiculelor pe hartă.
- Monitorizarea poziției vehiculelor în timp real.
- Crearea și gestionarea incidentelor.
- Recomandarea celui mai potrivit vehicul pentru un incident.
- Persistența datelor în baza de date MariaDB.

## Tehnologii utilizate

- Python 3
- Flask
- MariaDB
- Docker / Docker Compose
- Leaflet.js
- HTML/CSS/JavaScript

## Note pentru dezvoltare

Pentru verificarea sintaxei backend-ului și a fișierelor frontend:

```bash
python -m compileall backend frontend/js
```
