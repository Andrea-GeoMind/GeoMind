# Templates d'emails d'authentification Supabase

Ces cinq templates vivent dans le **dashboard Supabase** (`Authentication → Emails`),
pas dans ce dépôt : ils ne peuvent pas être versionnés ni déployés par le code.
Ce fichier en est la source de référence — à recopier dans le dashboard, et à
mettre à jour ici en même temps si on les modifie.

Les templates par défaut de Supabase sont en anglais et sans identité visuelle
(« Confirm Your Signup »). Ceux-ci reprennent la mise en forme des emails
transactionnels envoyés par Resend (`lib/email/templates/`).

> **Le lien magique de l'audit express ne figure pas ici.** Il est envoyé par
> Resend depuis `lib/email/templates/audit-magic-link.ts`, parce que son objet
> doit contenir le domaine audité — un objet Supabase est fixe et n'accepte pas
> de variable par envoi. Le template « Magic Link » ci-dessous ne sert donc
> qu'aux connexions sans mot de passe classiques.

Variable disponible dans le corps : `{{ .ConfirmationURL }}`.
Voir aussi `{{ .Token }}`, `{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .Email }}`.

---

## Confirm signup

**Objet** : `Confirmez votre adresse — GeoMind`

```html
<div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
  <p style="font-size: 18px; font-weight: 700; margin: 0 0 16px;">GeoMind</p>
  <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 12px;">Confirmez votre adresse</h1>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Bienvenue sur GeoMind. Confirmez votre adresse pour activer votre compte et lancer votre première analyse de visibilité dans les IA.</p>
  <a href="{{ .ConfirmationURL }}"
     style="display: inline-block; background: linear-gradient(to right, #4F46E5, #7C3AED); color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
    Confirmer mon adresse
  </a>
  <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 24px 0 0;">Ce lien expire dans 24 heures. Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message : aucun compte ne sera activé.</p>
  <p style="font-size: 12px; line-height: 1.6; color: #94a3b8; margin: 24px 0 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    GeoMind — visibilité dans les moteurs de réponses IA.<br />
    Vous recevez ce message parce qu'une inscription a été demandée avec cette adresse.<br />
    <a href="https://geomind.fr/legal/privacy" style="color: #94a3b8;">Politique de confidentialité</a>
  </p>
</div>
```

---

## Magic Link

**Objet** : `Votre lien de connexion — GeoMind`

```html
<div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
  <p style="font-size: 18px; font-weight: 700; margin: 0 0 16px;">GeoMind</p>
  <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 12px;">Votre lien de connexion</h1>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Cliquez ci-dessous pour vous connecter à GeoMind. Aucun mot de passe n'est nécessaire.</p>
  <a href="{{ .ConfirmationURL }}"
     style="display: inline-block; background: linear-gradient(to right, #4F46E5, #7C3AED); color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
    Me connecter
  </a>
  <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 24px 0 0;">Ce lien est valable une heure et ne fonctionne qu'une fois. Si vous n'avez pas demandé à vous connecter, ignorez ce message.</p>
  <p style="font-size: 12px; line-height: 1.6; color: #94a3b8; margin: 24px 0 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    GeoMind — visibilité dans les moteurs de réponses IA.<br />
    
    <a href="https://geomind.fr/legal/privacy" style="color: #94a3b8;">Politique de confidentialité</a>
  </p>
</div>
```

---

## Reset Password

**Objet** : `Réinitialiser votre mot de passe — GeoMind`

```html
<div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
  <p style="font-size: 18px; font-weight: 700; margin: 0 0 16px;">GeoMind</p>
  <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 12px;">Réinitialiser votre mot de passe</h1>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Vous avez demandé à changer votre mot de passe GeoMind. Choisissez-en un nouveau en cliquant ci-dessous.</p>
  <a href="{{ .ConfirmationURL }}"
     style="display: inline-block; background: linear-gradient(to right, #4F46E5, #7C3AED); color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
    Choisir un nouveau mot de passe
  </a>
  <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 24px 0 0;">Ce lien expire dans une heure. Si vous n'avez rien demandé, ignorez ce message : votre mot de passe actuel reste valable.</p>
  <p style="font-size: 12px; line-height: 1.6; color: #94a3b8; margin: 24px 0 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    GeoMind — visibilité dans les moteurs de réponses IA.<br />
    
    <a href="https://geomind.fr/legal/privacy" style="color: #94a3b8;">Politique de confidentialité</a>
  </p>
</div>
```

---

## Change Email Address

**Objet** : `Confirmez votre nouvelle adresse — GeoMind`

```html
<div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
  <p style="font-size: 18px; font-weight: 700; margin: 0 0 16px;">GeoMind</p>
  <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 12px;">Confirmez votre nouvelle adresse</h1>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Vous avez demandé à remplacer l'adresse de votre compte GeoMind par celle-ci. Confirmez pour terminer le changement.</p>
  <a href="{{ .ConfirmationURL }}"
     style="display: inline-block; background: linear-gradient(to right, #4F46E5, #7C3AED); color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
    Confirmer le changement
  </a>
  <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 24px 0 0;">Ce lien expire dans 24 heures. Tant que vous n'avez pas confirmé, votre ancienne adresse reste active.</p>
  <p style="font-size: 12px; line-height: 1.6; color: #94a3b8; margin: 24px 0 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    GeoMind — visibilité dans les moteurs de réponses IA.<br />
    
    <a href="https://geomind.fr/legal/privacy" style="color: #94a3b8;">Politique de confidentialité</a>
  </p>
</div>
```

---

## Invite user

**Objet** : `Vous êtes invité sur GeoMind`

```html
<div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
  <p style="font-size: 18px; font-weight: 700; margin: 0 0 16px;">GeoMind</p>
  <h1 style="font-size: 22px; font-weight: 800; margin: 0 0 12px;">Vous êtes invité sur GeoMind</h1>
  <p style="font-size: 15px; line-height: 1.6; margin: 0 0 24px;">Quelqu'un vous a invité à rejoindre GeoMind, l'outil qui mesure si un site est cité par ChatGPT, Perplexity, Gemini et Claude.</p>
  <a href="{{ .ConfirmationURL }}"
     style="display: inline-block; background: linear-gradient(to right, #4F46E5, #7C3AED); color: #ffffff; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
    Accepter l'invitation
  </a>
  <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 24px 0 0;">Ce lien expire dans 24 heures. Si cette invitation ne vous concerne pas, ignorez ce message.</p>
  <p style="font-size: 12px; line-height: 1.6; color: #94a3b8; margin: 24px 0 0; border-top: 1px solid #e2e8f0; padding-top: 16px;">
    GeoMind — visibilité dans les moteurs de réponses IA.<br />
    
    <a href="https://geomind.fr/legal/privacy" style="color: #94a3b8;">Politique de confidentialité</a>
  </p>
</div>
```

---
