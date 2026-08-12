# HAProxy

## Rol

HAProxy reprezintă punctul unic de intrare în aplicație.

În loc ca utilizatorul să acceseze separat:

```text
frontend
web1
web2
```

browserul comunică doar cu:

```text
http://localhost
```

HAProxy decide către ce serviciu intern trebuie trimis fiecare request.

---

# Poziția în arhitectură

```text
                  Browser
                     │
                     ▼
                  HAProxy
                     │
           ┌─────────┴─────────┐
           │                   │
        non-API              /api
           │                   │
           ▼             ┌─────┴─────┐
       frontend          web1       web2
```

---

# Portul public

Containerul HAProxy publică:

```text
80:80
```

Prin urmare aplicația poate fi accesată local prin:

```text
http://localhost
```

---

# Configurație

Fișierul principal este:

```text
haproxy.cfg
```

---

# Frontend HAProxy

HAProxy ascultă pe:

```text
*:80
```

Pentru fiecare request verifică dacă ruta începe cu:

```text
/api
```

---

# Cereri API

Regula este:

```text
path_beg /api
```

Dacă request-ul începe cu `/api`, este trimis către:

```text
api_servers
```

---

# Backend API

Grupul conține:

```text
web1:5000
web2:5000
```

Ambele servere execută aceeași aplicație Flask.

Strategia este:

```text
roundrobin
```

Conceptual:

```text
Request 1 → web1
Request 2 → web2
Request 3 → web1
Request 4 → web2
```

---

# Health checks

Serverele sunt configurate cu:

```text
check
```

HAProxy poate verifica dacă instanțele backend răspund.

Dacă una nu este disponibilă, traficul poate fi direcționat către instanța sănătoasă.

---

# Frontend static

Dacă request-ul nu începe cu:

```text
/api
```

este trimis implicit către:

```text
frontend:8000
```

Exemple:

```text
/
```

```text
/index.html
```

```text
/dispatcher.html
```

```text
/css/components.css
```

```text
/js/api.js
```

toate ajung la frontend.

---

# Exemplu complet

Request:

```text
GET /dispatcher.html
```

Flux:

```text
Browser
   │
   ▼
HAProxy
   │
   ▼
frontend:8000
```

Request:

```text
GET /api/incidents
```

Flux:

```text
Browser
   │
   ▼
HAProxy
   │
   ▼
web1:5000
sau
web2:5000
```

---

# Avantajul pentru frontend

JavaScript poate folosi:

```javascript
fetch("/api/incidents")
```

în loc de:

```javascript
fetch("http://web1:5000/api/incidents")
```

Frontend-ul nu trebuie să cunoască:

- numele containerului backend;
- numărul instanțelor;
- porturile interne.

---

# Avantajul celor două instanțe backend

Configurația:

```text
web1
web2
```

demonstrează că aplicația backend poate fi replicată.

Aceasta este o bază pentru:

- load balancing;
- redundanță;
- scalare.

În proiect, ambele instanțe utilizează aceeași bază MariaDB.

---

# Rețeaua Docker

HAProxy comunică cu celelalte servicii prin:

```text
internal_net
```

Docker DNS permite folosirea directă a numelor:

```text
frontend
web1
web2
```

---

# Dockerfile

Imaginea HAProxy folosește imaginea oficială HAProxy.

Configurația este copiată la:

```text
/usr/local/etc/haproxy/haproxy.cfg
```

---

# Reconstruire

După modificarea `haproxy.cfg`:

```bash
docker compose build haproxy
docker compose up -d haproxy
```

---

# Loguri

```bash
docker logs haproxy --tail 150
```

---

# 503 Service Unavailable

Una dintre cele mai importante erori este:

```text
503 Service Unavailable
```

În cazul rutelor API aceasta poate indica faptul că HAProxy nu găsește un backend sănătos.

Se verifică:

```bash
docker ps
```

Apoi:

```bash
docker logs web1 --tail 150
docker logs web2 --tail 150
```

Dacă ambele instanțe apar:

```text
Restarting
```

problema nu este de regulă în frontend.

Trebuie reparată eroarea backend care împiedică pornirea Flask.

---

# Testarea HAProxy

Frontend:

```text
http://localhost
```

API:

```text
http://localhost/api/vehicles
```

Dacă frontend-ul funcționează, dar API-ul nu:

```text
verifică web1 și web2
```

Dacă nici frontend-ul nu funcționează:

```text
verifică haproxy și frontend
```

---

# Relația cu Docker Compose

Ordinea logică este:

```text
database
   ↓
web1/web2

frontend
   ↓
haproxy

web1/web2
   ↓
haproxy

haproxy
   ↓
browser + raspberry
```

HAProxy depinde de:

```text
frontend
web1
web2
```

și reprezintă poarta de intrare pentru întregul sistem.