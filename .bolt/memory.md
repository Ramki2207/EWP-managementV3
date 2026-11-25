# Project memory

## Product intent & audience

- Production planning and workforce management app for an organization with multiple regional locations.
- Users are staff/admins who plan projects, track people, and register absence/sick leave.
- Dutch-language UI (greetings, labels, and domain terms like "Productieplanning", "buitenklussen", "Locatie Filter").

## Brand personality & voice

- Practical, operational tone suited to planning staff.
- Dutch is the primary UI language.

## Visual design & UX direction

- Top header shows personalized greeting with user role, welcome message, and current date (e.g. "Goedemorgen, admin / Welkom terug! 👋 / woensdag 25 november 2026").
- Location filter selector placed in the header area, near the greeting.
- Pages include: start/dashboard, productieplanning (production planning), projects overview, absence/sick-leave registration, help page.
- Help page references a downloadable manual (PDF/Word) stored in `docs/handleiding`.

## Decisions, constraints & rationale

- Location/region access control: specific users are restricted to a subset of locations (e.g. Kevin van Veen → Utrecht + Arnhem + Services only; Patrick & Stefano → Leerdam-adjacent set including Utrecht, Arnhem, Service).
- The location filter selector is locked per user to their allowed region; "Alles" and disallowed locations are not offered.
- Default absence/sick-leave person lists now respect each user's allowed region.
- Productieplanning already followed the location filter; bug was that users without a selector defaulted to "Alles" and saw all locations (e.g. Den Haag for Kevin).
- "Buitenklussen" (outside jobs) are also filtered so disallowed-location people don't appear via cross-location assignments.
- Utrecht location option bundles Leerdam and Service within it.

## Open questions & assumptions

- Untested while logged in as Kevin; needs verification on next login.
- Whether the "Download PDF" button on the Help page should open the manual directly (offered, not yet implemented).
- Exact region mapping for all users beyond Kevin, Patrick, Stefano is not yet documented.