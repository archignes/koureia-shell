import { redirect } from "next/navigation"

type Props = {
  params: Promise<{ domain: string }>
}

export default async function TenantIntakeSelectorPage({ params }: Props) {
  const { domain } = await params
  redirect(`/${domain}`)
}
