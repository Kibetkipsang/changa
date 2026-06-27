// components/landing/TrustedCompanies.tsx - Fixed version
import { motion } from "framer-motion";

const companies = [
  { name: "Safaricom", color: "#E7212E" },
  { name: "Airtel", color: "#E3120B" },
  { name: "Equity", color: "#0047AB" },
  { name: "Co-op Bank", color: "#1C6FB4" },
  { name: "NCBA", color: "#003366" },
  { name: "KCB", color: "#006633" },
];

export function TrustedCompanies() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="py-8 border-t border-gray-100/50 bg-white"
    >
      <div className="max-w-[1280px] mx-auto px-[72px]">
        <p className="text-center text-[16px] font-medium text-[#8E94A8] mb-6">
          Trusted by thousands of groups across Kenya
        </p>
        <div className="flex items-center justify-center gap-12 flex-wrap">
          {companies.map((company) => (
            <div
              key={company.name}
              className="h-[28px] opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
            >
              <div
                className="h-full flex items-center font-bold text-[16px]"
                style={{ color: company.color }}
              >
                {company.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}