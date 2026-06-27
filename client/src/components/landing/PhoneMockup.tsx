// components/landing/PhoneMockup.tsx - Smaller screens
import { motion } from "framer-motion";

interface PhoneMockupProps {
  height: number;
  type: "front" | "back";
}

export function PhoneMockup({ height, type }: PhoneMockupProps) {
  const width = height * (9 / 19.5);

  return (
    <motion.div
      animate={{
        y: [0, -6, 0],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className="relative rounded-[36px] bg-[#1C2340] shadow-2xl overflow-hidden flex-shrink-0"
      style={{ width, height }}
    >
      {/* Screen */}
      <div className="absolute inset-[5px] rounded-[31px] bg-white overflow-hidden">
        {type === "front" ? <FrontScreen /> : <BackScreen />}
      </div>

      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[26px] bg-[#1C2340] rounded-b-[18px] z-10" />

      {/* Dynamic Island */}
      <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[80px] h-[5px] bg-black rounded-full z-10 opacity-50" />
    </motion.div>
  );
}

function FrontScreen() {
  return (
    <div className="h-full bg-[#F8F9FC] p-3 flex flex-col text-xs">
      <div className="flex justify-between items-center mb-3 mt-1">
        <div>
          <div className="text-[8px] text-gray-400">Good morning</div>
          <div className="text-[13px] font-bold text-[#1C2340]">👋 James</div>
        </div>
        <div className="w-[28px] h-[28px] bg-[#6D3DF5] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
          J
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#6D3DF5] to-[#8B6BF5] rounded-[12px] p-3 text-white mb-3">
        <div className="text-[8px] opacity-80">Total Balance</div>
        <div className="text-[20px] font-bold">KES 245,800</div>
        <div className="flex justify-between mt-1.5">
          <div>
            <div className="text-[7px] opacity-80">Savings</div>
            <div className="text-[10px] font-semibold">KES 180,500</div>
          </div>
          <div>
            <div className="text-[7px] opacity-80">Contributions</div>
            <div className="text-[10px] font-semibold">KES 65,300</div>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3">
        {["Members", "Loans", "Meetings"].map((item, i) => (
          <div key={i} className="flex-1 bg-white rounded-[8px] p-1.5 shadow-sm">
            <div className="text-[7px] text-gray-400">{item}</div>
            <div className="text-[12px] font-bold text-[#1C2340]">{i === 0 ? "12" : i === 1 ? "4" : "8"}</div>
          </div>
        ))}
      </div>

      <div className="flex-1">
        <div className="text-[8px] font-semibold text-gray-400 mb-1.5">Your Chamas</div>
        <div className="space-y-1.5">
          {[
            { name: "Unity Group", amount: "KES 45,200" },
            { name: "Progressive", amount: "KES 32,100" },
            { name: "Empower", amount: "KES 28,500" },
          ].map((chama, i) => (
            <div key={i} className="bg-white rounded-[6px] p-1.5 shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <div className="w-[20px] h-[20px] bg-[#F5F0FF] rounded-full flex items-center justify-center text-[8px] text-[#6D3DF5] font-bold">
                  {chama.name[0]}
                </div>
                <span className="text-[9px] font-medium text-[#1C2340]">{chama.name}</span>
              </div>
              <span className="text-[8px] font-semibold text-[#6D3DF5]">{chama.amount}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-around mt-1.5 pt-1.5 border-t border-gray-100">
        {["🏠", "📊", "💰", "👥", "⚙️"].map((icon, i) => (
          <div key={i} className="text-[13px] opacity-50 hover:opacity-100 cursor-pointer">
            {icon}
          </div>
        ))}
      </div>
    </div>
  );
}

function BackScreen() {
  return (
    <div className="h-full bg-[#F8F9FC] p-3 flex flex-col text-xs">
      <div className="flex justify-between items-center mb-3 mt-1">
        <button className="text-[#6D3DF5] text-[10px] font-medium">← Back</button>
        <div className="text-[10px] font-medium text-[#1C2340]">Contribution</div>
        <div className="w-[28px] h-[28px] bg-[#6D3DF5] rounded-full flex items-center justify-center text-white text-[10px] font-bold">
          C
        </div>
      </div>

      <div className="bg-gradient-to-r from-[#6D3DF5] to-[#8B6BF5] rounded-[12px] p-3 text-white mb-3">
        <div className="text-[8px] opacity-80">Monthly Contribution</div>
        <div className="text-[22px] font-bold">KES 5,000</div>
        <div className="text-[8px] opacity-80 mt-0.5">Due: March 31, 2026</div>
      </div>

      <div className="bg-white rounded-[12px] p-3 shadow-sm mb-3">
        <div className="text-[10px] font-medium text-[#1C2340] mb-1.5">Select Amount</div>
        <div className="grid grid-cols-3 gap-1.5">
          {[2000, 5000, 10000, 15000, 20000, "Custom"].map((amount, i) => (
            <button
              key={i}
              className={`py-1.5 rounded-[6px] text-[9px] font-medium transition-colors ${
                amount === 5000
                  ? "bg-[#6D3DF5] text-white"
                  : "bg-gray-50 text-[#1C2340] hover:bg-gray-100"
              }`}
            >
              {typeof amount === "number" ? `KES ${amount.toLocaleString()}` : amount}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[12px] p-3 shadow-sm mb-3">
        <div className="text-[10px] font-medium text-[#1C2340] mb-1.5">Payment Method</div>
        <div className="space-y-1.5">
          {[
            { method: "M-Pesa", number: "0712 345 678" },
            { method: "Bank Transfer", number: "NCBA - 1234567890" },
          ].map((payment, i) => (
            <div key={i} className="flex items-center gap-2 p-1.5 rounded-[6px] bg-gray-50">
              <div className="w-[24px] h-[24px] bg-[#F5F0FF] rounded-full flex items-center justify-center text-[11px]">
                💳
              </div>
              <div>
                <div className="text-[9px] font-medium text-[#1C2340]">{payment.method}</div>
                <div className="text-[7px] text-gray-400">{payment.number}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="w-full py-2.5 bg-[#6D3DF5] text-white rounded-[10px] font-medium text-[12px] hover:bg-[#5B2FD6] transition-colors mt-auto">
        Continue Payment →
      </button>
    </div>
  );
}