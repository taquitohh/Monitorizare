# Database

Acest folder conține structura și documentația bazei de date MariaDB.

## Conținut

- init/ – fișiere SQL pentru crearea schemei și încărcarea datelor inițiale.
- docs/ – documentație și query-uri utile pentru verificare.

## Schema principală

Baza de date stochează:

- vehicule;
- poziții GPS;
- incidente;
- atribuiri și statusuri pentru operațiuni.

## Utilizare

La pornirea aplicației, Docker Compose va inițializa baza de date cu fișierele din folderul init/.
