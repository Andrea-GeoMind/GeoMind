import Header from '@/components/features/marketing/header'
import Footer from '@/components/features/marketing/footer'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
