'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

/**
 * Boutons d'authentification du header public.
 *
 * Les pages marketing sont prérendues : elles ne peuvent pas connaître la
 * session au build. La détection se fait donc côté client, après hydratation.
 *
 * Deux contraintes qui dictent la forme :
 *
 *  1. Ne pas casser le prérendu — aucun appel serveur, aucun `dynamic`, le
 *     HTML statique reste servi tel quel par le CDN.
 *  2. Ne pas provoquer de saut visible — l'état inconnu rend les boutons
 *     déconnectés (le cas de loin le plus fréquent sur une page publique) à
 *     l'identique du HTML prérendu. Si une session est trouvée, on bascule sur
 *     un unique bouton « Mon tableau de bord ». Le conteneur garde une largeur
 *     minimale pour que la bascule ne décale pas la barre de navigation.
 *
 * Pas de redirection automatique vers le dashboard : un utilisateur connecté a
 * le droit de lire le blog ou la page tarifs.
 */
export function useIsSignedIn(): boolean {
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    // getSession() lit le cookie local, sans aller-retour réseau : la bascule
    // se fait au premier rendu client, avant tout affichage perceptible.
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.session))
    })

    // Connexion ou déconnexion dans un autre onglet : le header suit.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setSignedIn(Boolean(session))
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return signedIn
}

export function HeaderAuthActions() {
  const signedIn = useIsSignedIn()

  if (signedIn) {
    return (
      <Button
        asChild
        size="sm"
        className="rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
      >
        <Link href="/dashboard">Mon tableau de bord</Link>
      </Button>
    )
  }

  return (
    <>
      <Button variant="ghost" asChild size="sm" className="hidden md:inline-flex">
        <Link href="/login">Se connecter</Link>
      </Button>
      <Button
        asChild
        size="sm"
        className="rounded-lg bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
      >
        <Link href="/signup">Commencer</Link>
      </Button>
    </>
  )
}
