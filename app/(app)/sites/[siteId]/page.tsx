import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ siteId: string }>
}

export default async function SiteRootPage({ params }: Props) {
  const { siteId } = await params
  redirect(`/sites/${siteId}/overview`)
}
