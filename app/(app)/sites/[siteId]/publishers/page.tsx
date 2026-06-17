import { redirect } from 'next/navigation'

// L'onglet « Publishers » a été fusionné dans « Présence off-site » (les publishers
// sectoriels y sont désormais un bloc). On redirige pour ne pas casser les liens.
type Props = {
  params: Promise<{ siteId: string }>
}

export default async function PublishersRedirect({ params }: Props) {
  const { siteId } = await params
  redirect(`/sites/${siteId}/presence`)
}
