import Image from "next/image";
import { CreditCard, Wifi } from "lucide-react";
import { type CardWithBank } from "../../cards/service";
import {
  isLightColor,
  CARD_TYPES,
  CARD_KINDS,
  DARK_TEXT_COLOR,
} from "../../cards/utils";

interface CreditCardMiniProps {
  card: CardWithBank;
}

export function CreditCardMini({ card }: CreditCardMiniProps) {
  const cardColor = card.color || "#1e293b";
  const useDarkText = isLightColor(cardColor);

  const cardTypeLabel = CARD_TYPES.find(
    (t) => t.value === card.card_type,
  )?.label;
  const cardKindLabel = CARD_KINDS.find(
    (k) => k.value === card.card_kind,
  )?.label;

  return (
    <div
      className="relative rounded-xl p-4 overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 50%, ${cardColor}aa 100%)`,
        color: useDarkText ? DARK_TEXT_COLOR : "white",
      }}
    >
      {/* Decorative circles */}
      <div
        className="absolute -right-4 -top-4 w-16 h-16 rounded-full opacity-10"
        style={{ backgroundColor: useDarkText ? DARK_TEXT_COLOR : "white" }}
      />

      {/* Top row: Bank logo and card kind */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {card.bank?.image ? (
            <div
              className="h-6 w-6 rounded p-0.5 flex items-center justify-center"
              style={{
                backgroundColor: useDarkText
                  ? "rgba(0,0,0,0.1)"
                  : "rgba(255,255,255,0.2)",
              }}
            >
              <Image
                src={card.bank.image}
                alt={card.bank.name}
                width={18}
                height={18}
                className="object-contain"
              />
            </div>
          ) : (
            <div
              className="h-6 w-6 rounded flex items-center justify-center"
              style={{
                backgroundColor: useDarkText
                  ? "rgba(0,0,0,0.1)"
                  : "rgba(255,255,255,0.2)",
              }}
            >
              <CreditCard className="h-3 w-3" />
            </div>
          )}
          {card.bank && (
            <span className="text-[10px] font-medium opacity-80">
              {card.bank.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {cardKindLabel && (
            <span className="text-[10px] font-medium uppercase opacity-60">
              {cardKindLabel}
            </span>
          )}
          <Wifi className="h-4 w-4 opacity-50 rotate-90" />
        </div>
      </div>

      {/* Card number */}
      <p className="font-mono text-sm tracking-widest opacity-90 mb-2">
        •••• •••• •••• {card.last4 || "••••"}
      </p>

      {/* Bottom row */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase truncate opacity-90">
            {card.cardholder_name || card.name}
          </p>
          {card.expiration_date && (
            <p className="text-[10px] opacity-60">{card.expiration_date}</p>
          )}
        </div>
        {cardTypeLabel && (
          <span className="text-[10px] font-bold uppercase opacity-70">
            {cardTypeLabel}
          </span>
        )}
      </div>
    </div>
  );
}
