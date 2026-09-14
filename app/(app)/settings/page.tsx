import { redirect } from 'next/navigation'

// /settings n'a pas de contenu propre : on atterrit sur l'onglet Compte.
export default function SettingsIndexPage() {
  redirect('/settings/account')
}
