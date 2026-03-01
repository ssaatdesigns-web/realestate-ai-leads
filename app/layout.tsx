import "./globals.css";
import Image from "next/image";
import Link from "next/link";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="container topbarInner">
            <div className="brand">
              <Image
                src="/logo/logo.png"
                alt="SAAT Designs"
                width={44}
                height={44}
                priority
              />
              <div className="brandText">
                <div className="brandName">SAAT Designs</div>
                <div className="brandTag">Real Estate Lead Intelligence</div>
              </div>
            </div>

            <nav className="nav">
              <Link className="navLink" href="/">
                Dashboard
              </Link>
              <Link className="navLink" href="/leads">
                Leads
              </Link>
            </nav>
          </div>
        </header>

        <main className="container main">{children}</main>

        <footer className="footer">
          <div className="container footerInner">
            <span>© {new Date().getFullYear()} SAAT Designs</span>
            <span className="dot">•</span>
            <span>Secure lead tracking</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
