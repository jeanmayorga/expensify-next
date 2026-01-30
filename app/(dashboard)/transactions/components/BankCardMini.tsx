import Image from "next/image";
import { Building2 } from "lucide-react";
import { type Bank } from "../../banks/service";
import { isLightColor, DARK_TEXT_COLOR } from "../../cards/utils";

interface BankCardMiniProps {
  bank: Bank;
}

export function BankCardMini({ bank }: BankCardMiniProps) {
  const bankColor = bank.color || "#2563eb";
  const useDarkText = isLightColor(bankColor);

  return (
    <div
      className="relative rounded-xl p-4 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${bankColor} 0%, ${bankColor}dd 50%, ${bankColor}aa 100%)`,
        color: useDarkText ? DARK_TEXT_COLOR : "white",
      }}
    >
      {/* Decorative circle */}
      <div
        className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10"
        style={{ backgroundColor: useDarkText ? DARK_TEXT_COLOR : "white" }}
      />

      <div className="flex items-center gap-3">
        {bank.image ? (
          <div
            className="h-10 w-10 rounded-lg p-1 flex items-center justify-center"
            style={{
              backgroundColor: useDarkText
                ? "rgba(0,0,0,0.1)"
                : "rgba(255,255,255,0.2)",
            }}
          >
            <Image
              src={bank.image}
              alt={bank.name}
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
        ) : (
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{
              backgroundColor: useDarkText
                ? "rgba(0,0,0,0.1)"
                : "rgba(255,255,255,0.2)",
            }}
          >
            <Building2 className="h-5 w-5" />
          </div>
        )}
        <div>
          <p className="font-semibold">{bank.name}</p>
          <p className="text-xs opacity-70">Bank Account</p>
        </div>
      </div>
    </div>
  );
}
