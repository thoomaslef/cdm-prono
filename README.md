# ⚽ Pronostic CDM 2026

App Next.js 14 qui génère des pronostics de matchs de la Coupe du Monde 2026 via l'API Anthropic (Claude), optimisée mobile pour TikTok.

## Lancer en local

```bash
npm install
copy .env.local.example .env.local   # puis colle ta clé API dedans
npm run dev
```

## Déployer sur Vercel

1. Pousse le projet sur GitHub (ou utilise `npx vercel`)
2. Sur [vercel.com](https://vercel.com) → **Add New → Project** → importe le repo
3. Dans **Environment Variables**, ajoute :
   - Name : `ANTHROPIC_API_KEY`
   - Value : ta clé `sk-ant-...` ([console.anthropic.com](https://console.anthropic.com/settings/keys))
4. **Deploy**

## Modèle

Le pronostic est généré par `claude-sonnet-4-6` (constante `MODEL` dans `app/api/pronostic/route.js`).
