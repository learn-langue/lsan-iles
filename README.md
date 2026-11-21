# Lsan · Iles

Application personnelle pour apprendre **la darija algérienne** et **le kabyle (taqbaylit)**, 100 % texte, 100 % locale.
*Lsan* veut dire « langue » en darija, *iles* veut dire « langue » en kabyle.

- Pas de serveur, pas de compte, pas d'audio. La progression reste dans le navigateur (`localStorage`), avec export et import en JSON.
- Installable sur le téléphone (PWA) et utilisable hors ligne.
- Le tuteur IA appelle Gemini ou OpenAI directement depuis le navigateur, avec votre propre clé.

## Lancer

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # tests du domaine et vérification du corpus
npm run build      # site statique dans dist/
```

Le dossier `dist/` peut être ouvert avec n'importe quel hébergeur statique (GitHub Pages, Netlify) ou servi en local avec `npm run preview`. Les routes utilisent `#/`, donc aucune configuration serveur n'est nécessaire.

## Mise en ligne

Chaque push sur `main` lance `.github/workflows/deploy.yml` : tests, build, puis publication sur GitHub Pages.
Pour l'activer une fois : **Settings → Pages → Source : GitHub Actions**. L'adresse du site est publique, même si le dépôt est privé.

## Ce qu'il y a dedans

| Module | Contenu |
|---|---|
| Parcours | 4 niveaux. Chaque leçon enchaîne mots nouveaux, « truc à savoir », phrases en situation, exercices, puis rejoue les erreurs |
| Exercices | Paires, QCM, phrases à trous, constructeur de phrases avec mots pièges, détecteur de nuances (arabe littéraire glissé en darija), chasse aux erreurs de genre (kabyle), « À qui tu dis ça ? », lettre mystère et chiffre caché, saisie libre tolérante, simulateur WhatsApp |
| Révision | Flashcards à répétition espacée (À revoir, Moyen, Facile), sprint de 60 s, mots fragiles |
| Tests | Positionnement adaptatif, examens de palier (80 % pour débloquer), bilan d'évolution rejouable avec historique en courbe |
| Tuteur IA | 5 scénarios, réplique au niveau de l'apprenant, boutons « Traduire » et « Mot à mot », correction bienveillante |

## Ajouter du contenu

Déposer un fichier `src/content/<darija|kabyle>/n<niveau>/lNN-nom.json` au même format que les leçons existantes. Il est chargé automatiquement, et `npm test` vérifie sa cohérence : identifiants, réponses présentes dans les options, trous de texte, intrus, etc.

- **Darija** : chaque texte a `chat` (écriture WhatsApp avec 3/7/9), `latin` (sans chiffres) et `ar` (écriture arabe). Les réglages choisissent quelle forme afficher.
- **Kabyle** : `text` contient l'orthographe standard (ɣ, ɛ, č…) et `ascii` une forme de secours pour la saisie.

Le contenu doit être relu par un locuteur natif. Les variantes régionales vont dans `variants`.

## Organisation

```
src/
  content/     leçons JSON, guide des lettres kabyles, table des chiffres darija
  domain/      logique pure et testée : correction, répétition espacée, série, déroulé de leçon, génération des tests
  store/       état persistant (Zustand)
  features/    écrans : accueil, parcours, leçon, exercices, révision, sprint, tests, tuteur, réglages
  components/  éléments d'interface partagés
tests/         Vitest
```
