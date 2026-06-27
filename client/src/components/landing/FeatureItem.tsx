// components/landing/FeatureItem.tsx
import { LucideIcon } from "lucide-react";

interface FeatureItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureItem({ icon: Icon, title, description }: FeatureItemProps) {
  return (
    <div className="flex-1">
      <div className="w-[40px] h-[40px] bg-[#F5F0FF] rounded-[10px] flex items-center justify-center mb-3">
        <Icon size={20} className="text-[#6D3DF5]" />
      </div>
      <h3 className="text-[16px] font-semibold text-[#1C2340]">{title}</h3>
      <p className="text-[14px] text-[#8E94A8] mt-1 leading-snug">{description}</p>
    </div>
  );
}