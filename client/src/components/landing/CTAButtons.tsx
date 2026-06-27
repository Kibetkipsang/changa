// components/landing/CTAButtons.tsx
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

export function CTAButtons() {
  return (
    <div>
      <div className="flex gap-[18px]">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="h-[50px] px-8 bg-[#6D3DF5] text-white rounded-[12px] font-medium text-[16px] hover:bg-[#5B2FD6] transition-all shadow-sm hover:shadow-lg flex items-center gap-2"
        >
          Get Started for Free
          <ArrowRight size={18} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="h-[50px] px-8 bg-transparent border-2 border-[#6D3DF5] text-[#6D3DF5] rounded-[12px] font-medium text-[16px] hover:bg-[#F5F0FF] transition-all"
        >
          Book a Demo
        </motion.button>
      </div>
      <div className="flex items-center gap-2 mt-[18px]">
        <Check size={16} className="text-[#6D3DF5]" />
        <span className="text-[14px] text-[#8E94A8]">Free to start. No credit card required.</span>
      </div>
    </div>
  );
}