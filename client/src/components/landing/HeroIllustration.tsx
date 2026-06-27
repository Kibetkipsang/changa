// components/landing/HeroIllustration.tsx
import { motion } from "framer-motion";
import { PhoneMockup } from "./PhoneMockup";
import { FloatingCard } from "./FloatingCards";
import { Shield, Users, CheckCircle } from "lucide-react";

export function HeroIllustration() {
  return (
    <div className="relative w-full flex justify-center items-center" style={{ height: "620px" }}>
      {/* Phone Mockups */}
      <div className="relative flex items-center justify-center">
        {/* Back Phone */}
        <motion.div
          initial={{ opacity: 0, x: 30, rotate: 5 }}
          animate={{ opacity: 1, x: 0, rotate: 10 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="absolute left-0 z-10"
          style={{ transform: "rotate(10deg)" }}
        >
          <PhoneMockup height={500} type="back" />
        </motion.div>

        {/* Front Phone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-20"
          style={{ marginLeft: "80px" }}
        >
          <PhoneMockup height={560} type="front" />
        </motion.div>
      </div>

      {/* Floating Cards */}
      {/* Top Right Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        className="absolute top-0 right-0 z-30"
      >
        <FloatingCard
          icon={Shield}
          iconColor="text-blue-500"
          title="100% Secure"
          description="Bank-level security for your peace of mind"
          width="190px"
          height="88px"
        />
      </motion.div>

      {/* Middle Left Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-30"
      >
        <FloatingCard
          icon={Users}
          iconColor="text-purple-500"
          title="50,000+"
          description="Active users across Kenya"
          width="140px"
          height="110px"
        />
      </motion.div>

      {/* Bottom Right Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        className="absolute bottom-0 right-8 z-30"
      >
        <FloatingCard
          icon={CheckCircle}
          iconColor="text-green-500"
          title="On Time"
          description="Track and never miss a contribution"
          width="180px"
          height="90px"
        />
      </motion.div>
    </div>
  );
}