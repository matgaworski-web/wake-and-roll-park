# WAKE & ROLL PARK ŁÓDŹ – PLAN ARCHITEKTURY I REALIZACJI

## 1. Założenia i Rola
- **Rola:** Główny Architekt, Projektant i Inżynier Wdrożenia
- **Lokalizacja:** Stawy Stefańskiego, ul. Patriotyczna 3, 93-452 Łódź
- **Podmiot:** WAKE & ROLL PARK S.C. Katarzyna Kobierzycka Mateusz Gaworski (NIP: 7292705046, REGON: 101755106)
- **Domeny:** `wakeandrollpark.pl` (główna) oraz `wakeandroll.pl` (alias/redirect)
- **Serwer docelowy:** VPS OVH `57.131.192.232` (NGINX 1.28 + Docker/Node) + Cloudflare Proxy 🟠 (Account ID: `26e9a9b548af169e0537cc7c404ed827`)
- **Poczta:** `kontakt@wakeandrollpark.pl` (Cloudflare Email Routing -> `mat.gaworski@gmail.com`)

---

## 2. Architektura Systemu (Astro + Node API + SQLite + NGINX)

```
                            [ PRZEGLĄDARKA / KLIENT ]
                                       │
                                       ▼
                     [ CLOUDFLARE EDGE (WAF, SSL, CDN) ]
                       wakeandrollpark.pl / wakeandroll.pl
                                       │
                                       ▼ (Proxy 🟠)
                   [ OVH VPS 57.131.192.232 : NGINX 1.28 ]
                   ├── /               -> /var/www/wakeandrollpark.pl/current (Astro static dist)
                   ├── /api/           -> proxy_pass http://127.0.0.1:8793/api/ (Node.js API)
                   └── /.well-known/   -> /var/www/certbot (Let's Encrypt)
                                       │
                                       ▼
               [ BACKEND API (Node.js + SQLite / Docker: 8793) ]
               ├── /api/passes/types     (katalog karnetów)
               ├── /api/passes/order     (zamówienie karnetu z przelewem)
               ├── /api/bookings         (kalendarz i rezerwacje wyciągu/SUP)
               ├── /api/admin/auth       (logowanie administratora JWT)
               ├── /api/admin/orders     (potwierdzanie wpłat, aktywacja karnetów)
               ├── /api/admin/bookings   (harmonogram toru, blokowanie terminów)
               └── /api/admin/settings   (konfiguracja numeru konta bankowego, tryb testowy)
```

---

## 3. Podział Odpowiedzialności Plików i Komponentów

| Slice | Pliki | Odpowiedzialność |
|-------|-------|------------------|
| **Treść & Źródła** | `docs/SOURCES.md`, `src/content/site.ts` | 100% zweryfikowane fakty, cenniki, godziny, regulaminy. Zero wymyślonych danych. |
| **Infrastruktura** | `deploy/nginx/`, `scripts/deploy.sh`, `scripts/cf-dns.ps1` | NGINX vhost, certbot TLS, Cloudflare DNS & Proxy, deploy atomowy symlinków. |
| **Frontend Astro** | `src/components/*`, `src/layouts/Layout.astro`, `src/pages/*` | Dostępny, responsywny (360px-4K) UI z a11y, WCAG, reduced-motion, 3 slajdy Hero. |
| **Backend & Baza** | `server/src/*`, `server/data/wakeandroll.db` | API REST, SQLite, obsługa zamówień karnetów, unikalne numery, generowanie kodów. |
| **Panel Admina** | `src/pages/admin/*`, `server/src/routes/admin.js` | Widok kasy, potwierdzanie wpłat przelewów, blokowanie godzin toru, zarządzanie cennikiem. |
| **Testy & QA** | `tests/smoke.test.js`, `tests/a11y.test.js` | Testy HTTP, smoke testy po deployu, walidacja formularzy i stanów UI. |
