# Backend

## 1. Rol
Backend Flask pentru:
- autentificare
- vehicule
- GPS
- incidente
- dispecerizare
- șoferi
- întăriri
- chestionare
- raportare
- administrare

## 2. Structură

app.py
routes/
services/
config/
utils/

## 3. app.py
- inițializare Flask
- conexiune DB
- endpoint-uri principale
- înregistrare blueprint-uri

## 4. routes/
auth.py
admin.py
driver.py
specialist.py
vehicles.py
positions.py

## 5. services/
AuthService
IncidentService
RouteService
SpecialistService
IncidentEventService
IncidentReportService

## 6. Autentificare
Bearer token
roluri
verificarea endpoint-urilor

## 7. Incidente
validare
tipuri multiple
resurse multiple

## 8. Rutare
graful rutier
distanță
traseu

## 9. Chestionare

## 10. Raport PDF

## 11. Configurare

## 12. Dependencies
requirements.txt

## 13. Verificarea sintaxei
python -m compileall .

## 14. Rulare prin Docker

## 15. Troubleshooting
SyntaxError
IndentationError
web1/web2 restarting