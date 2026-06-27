// components/landing/Hero.tsx - Fully Responsive with Mobile Images
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
      {/* Background Decoration - Responsive */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/4 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] lg:w-[800px] lg:h-[800px] bg-[#6D3DF5] rounded-full blur-[100px] sm:blur-[150px] opacity-[0.12] pointer-events-none" />
      
      <div className="max-w-[1280px] w-full mx-auto px-4 sm:px-8 md:px-12 lg:px-[72px] flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8 lg:gap-12 relative z-10">
        
        {/* Left Column - Full width on mobile, 48% on desktop */}
        <div className="w-full lg:w-[48%] flex-shrink-0 text-center lg:text-left">
          {/* Headline - Responsive text sizes */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[32px] sm:text-[40px] md:text-[48px] lg:text-[56px] font-extrabold leading-[1.1] sm:leading-[1.05]"
          >
            <span className="text-[#1C2340]">Smarter Chamas,</span>
            <br className="hidden sm:block" />
            <span className="text-[#6D3DF5]">Stronger Together.</span>
          </motion.h1>

          {/* Paragraph - Responsive text sizes */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-[16px] sm:text-[18px] leading-[1.6] text-[#5E6478] max-w-full lg:max-w-[500px] mt-4 sm:mt-[28px] mx-auto lg:mx-0"
          >
            Changa helps groups save, contribute and grow together with transparent management, secure payments and real-time insights.
          </motion.p>

          {/* Mobile Illustration - Shows on mobile only */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="block lg:hidden mt-6 sm:mt-8 flex justify-center"
          >
            <div className="w-[280px] sm:w-[350px] md:w-[400px]">
              <HeroIllustration />
            </div>
          </motion.div>

          {/* Feature Highlights - Responsive grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 lg:gap-[28px] mt-6 sm:mt-[30px]"
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
            className="mt-6 sm:mt-[32px] flex justify-center lg:justify-start"
          >
            <CTAButtons />
          </motion.div>
        </div>

        {/* Right Column - Desktop Illustration (hidden on mobile) */}
        <div className="hidden lg:block lg:w-[52%] flex-shrink-0 flex justify-end">
          <HeroIllustration />
        </div>
      </div>
    </section>
  );
}