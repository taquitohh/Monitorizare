# Backend

Acest folder conține serviciul API al aplicației, implementat în Flask.

## Rol

- expune endpoint-uri pentru vehicule și incidente;
- procesează cererile frontend-ului;
- se conectează la baza de date MariaDB;
- gestionează logica de validare și recomandare.

## Fișiere importante

- app.py – punctul de intrare principal al aplicației Flask.
- config/config.py – configurări pentru conexiunea la bază de date și mediul de execuție.
- routes/ – module pentru rutare și endpoint-uri.

## Rulare locală

```bash
cd backend
pip install -r requirements.txt
python app.py
```
