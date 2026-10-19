# XOXO Club · La Commerciale

Le cercle privé des membres de La Commerciale : demandes d'accès, missions, preuves, points, privilèges et ventes billetterie.

- `lacom.club` : page d'entrée du club
- `lacom.club/ambassadeurs` : espace membre (connexion par lien email)
- `lacom.club/ambassadeurs/rejoindre` : demande d'accès

## Stack

Next.js (App Router) · Supabase (base, auth, stockage) · Vercel

## Variables d'environnement

Voir `.env.example`. À renseigner dans Vercel :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

## Base de données (Supabase)

Tables : `profiles`, `access_requests`, `events`, `missions`, `proofs`, `privileges`, `redemptions`, `sales`, `points_ledger`, `app_settings`.

Fonctions : `approve_proof`, `refuse_proof`, `redeem_privilege`, `member_balance`, `leaderboard_month`.

Les points ne sont jamais stockés en dur : le solde est la somme du journal `points_ledger`.

## Développement

```
npm install
npm run dev
```
