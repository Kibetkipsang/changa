// components/landing/FloatingCard.tsx
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FloatingCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
  width: string;
  height: string;
}

export function FloatingCard({
  icon: Icon,
  iconColor,
  title,
  description,
  width,
  height,
}: FloatingCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white/80 backdrop-blur-xl rounded-[18px] p-4 shadow-xl border border-white/50"
      style={{ width, height }}
    >
      <div className="flex items-start gap-3 h-full">
        <div className="flex-shrink-0">
          <Icon size={20} className={iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-bold text-[#1C2340] truncate">{title}</div>
          <div className="text-[11px] text-[#8E94A8] leading-snug mt-0.5 line-clamp-2">
            {description}
          </div>
        </div>
      </div>
    </motion.div>
  );
}