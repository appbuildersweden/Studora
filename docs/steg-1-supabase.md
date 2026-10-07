# Steg 1 – Supabase (klart)

Status: **klar och verifierad** mot det befintliga Supabase-projektet.
Inga secrets finns i detta dokument – alla nycklar och lösenord ligger bara i `.env`.

## Vad som gjordes

1. Supabase CLI installerades lokalt (`supabase` som dev-dependency, v2.120.0) och verifierades.
2. `supabase init` skapade `supabase/config.toml`.
3. Migrationsfilerna skapades och tillämpades på fjärrprojektet med `supabase db push`.
4. Supabase Auth förberedes: nya användare får automatiskt `profiles`- och `user_settings`-rad via trigger på `auth.users`.
5. Roller skapade: enum `public.app_role ('admin', 'student')`. Standardroll är `student`.
6. RLS aktiverades på båda tabellerna med policies.
7. `.gitignore` skapades – täcker `.env`, `.env.local`, `.env.*.local`, `node_modules/`, `supabase/.temp/`.
8. Anslutning och RLS testades mot molnet (se nedan).

## Filer skapade/ändrade

| Fil | Innehåll |
| --- | --- |
| `supabase/config.toml` | Supabase-projektkonfiguration (via `supabase init`) |
| `supabase/migrations/20261007174000_init_profiles.sql` | Roller, tabeller, triggers, Auth-trigger |
| `supabase/migrations/20261007174001_rls_and_admin.sql` | RLS-policies, `is_admin()`, rolländringsspärr |
| `.gitignore` | Skyddar secrets från Git/GitHub |
| `package.json` | `@supabase/supabase-js`, `@supabase/ssr`, `supabase` (dev) tillagda |

## Migrationer (tillämpade på fjärrprojektet)

1. `20261007174000_init_profiles.sql`
   - `public.app_role` enum: `admin`, `student`
   - `public.profiles` (id, full_name, username, role, created_at, updated_at)
   - `public.user_settings` (user_id, theme, language, created_at, updated_at)
   - `set_updated_at()`-triggers på båda tabellerna
   - `handle_new_user()`-trigger på `auth.users` → skapar profil + inställningar
2. `20261007174001_rls_and_admin.sql`
   - RLS aktiverat på `profiles` och `user_settings`
   - `is_admin()` (security definer, endast `authenticated`)
   - Trigger som förhindrar att icke-admin ändrar sin `role`

Inga tabeller för uppgifter, quiz, AI eller filer skapades – de kommer i senare steg.

## RLS-översikt

- `profiles`: användaren läser/uppdaterar sin egen rad; admin läser/uppdaterar alla.
- `user_settings`: endast egen rad läs/uppdatera.
- Inga insert/delete-policies – rader skapas av `handle_new_user()` och tas bort via CASCADE.
- Rolländring till `admin` bara av admin (trigger, annars fel `P0001: Only admins can change roles`).

## Testresultat (mot molnet)

| Test | Resultat |
| --- | --- |
| Anon läser `profiles` / `user_settings` | 200, tom lista (inga rader syns) |
| Anon INSERT `profiles` | nekas (401) |
| Admin skapar användare via Auth Admin API | 200, profil skapas av trigger (role=student) |
| Inloggning (password grant) ger JWT | OK |
| Inloggad läser endast egen profil | OK (1 rad) |
| Inloggad uppdaterar egna inställningar (theme=dark) | OK |
| Inloggad försöker sätta role=admin | nekas (400, "Only admins can change roles") |
| Främmande `user_settings`-rad osynlig | OK (0 rader) |
| Secret key ser alla rader (service bypass) | OK |
| Testanvändare borttagen → profil/settingsCASCADE | OK (0 rader kvar) |

Alla tester passerade. Tillfälliga testkonton togs bort efteråt.

## Anslutning

- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_JWKS_URL`,
  `SUPABASE_DB_PASSWORD` ligger i `.env` (aldrig i kod eller Git).
- Push av framtida migrationer: `supabase db push` (efter `supabase login` + `supabase link`)
  eller via `--db-url` som i detta steg.
