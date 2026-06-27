// components/landing/Hero.tsx - Fixed version
import { motion } from "framer-motion";
import { HeroIllustration } from "./HeroIllustration";
import { FeatureItem } from "./FeatureItem";
import { CTAButtons } from "./CTAButtons";
import { Shield, Users, TrendingUp } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Secure & Trusted",
    description: "Your money and data are always safe",
  },
  {
    icon: Users,
    title: "Built for Groups",
    description: "Manage members, contributions and funds with ease",
  },
  {
    icon: TrendingUp,
    title: "Real-time Insights",
    description: "Track contributions, balances and reports instantly",
  },
];

export function Hero() {
  return (
    <section className="min-h-screen pt-[72px] flex items-center relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/2 w-[800px] h-[800px] bg-[#6D3DF5] rounded-full blur-[150px] opacity-[0.12] pointer-events-none" />
      
      <div className="max-w-[1280px] w-full mx-auto px-[72px] flex items-center justify-between gap-12 relative z-10">
        {/* Left Column - 48% */}
        <div className="w-[48%] flex-shrink-0">
          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[56px] font-extrabold leading-[1.05]"
          >
            <span className="text-[#1C2340]">Smarter Chamas,</span>
            <br />
            <span className="text-[#6D3DF5]">Stronger Together.</span>
          </motion.h1>

          {/* Paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[18px] leading-[1.6] text-[#5E6478] max-w-[500px] mt-[28px]"
          >
            Changa helps groups save, contribute and grow together with transparent management, secure payments and real-time insights.
          </motion.p>

          {/* Feature Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex gap-[28px] mt-[30px]"
          >
            {features.map((feature, index) => (
              <FeatureItem
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-[32px]"
          >
            <CTAButtons />
          </motion.div>
        </div>

        {/* Right Column - 52% */}
        <div className="w-[52%] flex-shrink-0 flex justify-end">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}