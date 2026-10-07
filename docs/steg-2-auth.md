# Steg 2 – Authentication, login och roller (klart)

Status: **klar och verifierad** (programmatiska tester + webbläsrtest).
Inga secrets i detta dokument – testkontonens lösenord ligger bara i `.env`.

## Filer skapade/ändrade

| Fil | Innehåll |
| --- | --- |
| `supabase/migrations/20261007181000_roles_chef_larare_elev.sql` | Roller `chef`/`lärare`/`elev`, `is_chef()`/`is_larare()`, chef-policies |
| `supabase/migrations/20261007181100_allow_service_role_updates.sql` | Tillåter backend (service role) att sätta roller |
| `web/login.html` | Minimal testlogin: e-post, lösenord, logga in, glömt lösenord |
| `web/app.html` | Skyddad testsida: "Inloggad som …", logout, RLS/rolltester |
| `web/reset.html` | Sätt nytt lösenord via Supabase-återställningslänk |
| `web/lib.js` | Supabase-client, `roleLabel`, `requireSession`, `fetchProfile` |
| `web/style.css` | Enkel neutral stil (ingen Studora-design) |
| `web/config.js` | Genererad från `.env` av `scripts/serve.mjs` (git-ignored) |
| `scripts/serve.mjs` | Genererar config + statisk testserver (`npm run web`, port 4173) |
| `package.json` | Script `web` tillagt |
| `.gitignore` | `web/config.js` tillagt |
| `docs/steg-2-auth.md` | Detta dokument |

## Supabase Auth

- Inloggning: `signInWithPassword` (e-post + lösenord) – inget eget lösenordssystem.
  Lösenord lagras bara i Supabase Auth, aldrig i `profiles`.
- Session: `persistSession: true` (localStorage), `autoRefreshToken`, `detectSessionInUrl`.
  Skyddad sida (`app.html`) anropar `requireSession()` → omdirigerar till login utan session.
- Logout: `signOut()` → tillbaka till login.
- Glömt lösenord: `resetPasswordForEmail(..., { redirectTo: origin + '/reset.html' })`
  → `reset.html` sätter nytt lösenord via `updateUser`.
- Självregistrering: ingen "Skapa konto"-sida byggd. Testet **visade att projektets
  signup-endpoint svarar 200** (konton kan skapas via API) – stäng detta i dashboard:
  Authentication → Sign Ups / Providers → Email → avmarkera "Allow new users to sign up".

## Roller (ett enda rollsystem)

Enum `public.app_role = ('chef', 'lärare', 'elev')` på `profiles.role`, default `elev`.
Gamla `admin`/`student` togs bort i samma migration (inga parallella system).

Hierarki som SQL-funktioner (anropas via `POST /rest/v1/rpc/...`):

- `is_chef()` → true endast för `chef`
- `is_larare()` → true för `chef` **och** `lärare` (chef har alltid lärarbehörighet)

Rolländring: trigger `prevent_role_change` kastar `Only chef can change roles` om en
inloggad användare som inte är chef försöker ändra `role`. Service role (backend) får
ändra roller – skyddat av RLS, eftersom bara service/chef når UPDATE alls.

## Testresultat – programmatiskt (22 tester, alla PASS)

- Login ger JWT för chef/lärare/elev; egen profilroll rätt för alla tre.
- Hierarki: chef → `is_chef=true, is_larare=true`; lärare → `false/true`; elev → `false/false`.
- RLS: elev ser endast egen profil och egna inställningar; ser inte lärarens profilrad.
- RLS: chef ser alla profiler (3) och elevens rad; får uppdatera andras roll.
- RLS: lärare ser (än så länge) endast egna profiler.
- Elev som försöker sätta `role=chef` → **400 "Only chef can change roles"**, rollen oförändrad.
- Ogiltig JWT → 401. Logout → 204. Självregistrering: se avsnitt ovan.

## Testresultat – webbläsare (localhost:4173)

- Fel lösenord → "Fel e-post eller lösenord."
- Inloggning → `app.html` visar **Inloggad som Elev** / **Chef** / **Lärare** (alla tre testade).
- Knappen "försök byta min roll till chef" → **NEKAT av servern: Only chef can change roles**.
- Knappen "läs alla profiler (RLS)" → **OK: endast egen rad syns**.
- Logout → tillbaka till login; besök av `app.html` utan session → omdirigerad till login.
- Sessionen återfinns efter stängd/öppnad flik (persistence).
- "Glömt lösenord?"-formuläret växlar fram/åter. Inga konsolfel.

En bugg hittades och fixades via webbläsrtestet: `fetchProfile()` filtrerade inte på eget
id, så chef (som ser alla rader) fick "multiple rows returned". Filtrerar nu på `user.id`.

## Password reset – verifierat, en öppen fråga

- Recovery-token skapas och verifieras: `admin/generate_link` (200) + återföljd
  verifieringslänk → **303 med tokens**. Mekaniken fungerar alltså i Supabase.
- Själva `POST /auth/v1/recover` svarade 400 först och sen **429
  `over_email_send_rate_limit`** – Supabases e-postrategräns (fria nivån, flera testmejl
  under kort tid). **Leverans av e-post kunde inte verifieras** (testdomäner har ingen inkorg).
- Länken i mailet hamnar på projektets Site URL (nu `…/www.Studora.free`), inte på
  `reset.html`. Lägg till `http://localhost:4173/reset.html` som Redirect URL och sätt
  Site URL i dashboard (Authentication → URL Configuration) innan flödet används på riktigt.

## Testkonton (creds i `.env`, aldrig i kod/dokument)

- `TEST_CHEF_EMAIL` / `TEST_CHEF_PASSWORD` – roll `chef`
- `TEST_LARARE_EMAIL` / `TEST_LARARE_PASSWORD` – roll `lärare`
- `TEST_ELEV_EMAIL` / `TEST_ELEV_PASSWORD` – roll `elev`

Tillfälliga konton (utest, tmp-…) togs bort efter testet. Kvar: exakt de tre testkontona.

## Kvar att göras (behöver dashboard/PAT – ej gjort)

1. Stäng "Allow new users to sign up" (elever får inte registrera sig själva).
2. Lägg till redirect URL för `reset.html` + sätt Site URL.
3. (Valfritt) konfigurera SMTP för att slippa e-postrategränsen.
