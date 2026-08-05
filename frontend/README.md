# Frontend

Acest folder conține interfața web a aplicației de monitorizare GPS.

## Rol

- afișează vehiculele și incidentele pe interfață;
- permite selectarea locațiilor incidentelor pe hartă;
- comunică cu backend-ul prin API;
- afișează informații în timp real despre starea sistemului.

## Structură

- index.html – structura principală a paginii.
- css/ – stiluri organizate pe componente și funcționalitate.
- js/ – logica aplicației: hartă, API, incidente, recomandări și stare UI.
- assets/images/ – imagini și resurse grafice.

## Rulare

Frontend-ul este servit de Docker Compose împreună cu restul aplicației.

Dacă vrei să îl rulezi separat pentru dezvoltare, poți deschide folderul în browser sau folosi un server static simplu.