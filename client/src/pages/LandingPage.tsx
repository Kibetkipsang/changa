// pages/LandingPage.tsx
import { Navbar } from "../components/landing/Navbar";
import { Hero } from "../components/landing/Hero";
import { TrustedCompanies } from "../components/landing/TrustedCompanies";

export function Landing() {
  return (
    <div className="bg-white">
      <Navbar />
      <main className="pt-[72px]">
        <Hero />
        <TrustedCompanies />
      </main>
    </div>
  );
}