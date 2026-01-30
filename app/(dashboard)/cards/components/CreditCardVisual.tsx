import Image from "next/image";
import { CreditCard, Wifi } from "lucide-react";
import { type CardWithBank } from "../service";
import { isLightColor, formatCurrency, CARD_TYPES, CARD_KINDS, DARK_TEXT_COLOR } from "../utils";

interface CreditCardVisualProps {
  card: CardWithBank;
  onClick: () => void;
}

export function CreditCardVisual({ card, onClick }: CreditCardVisualProps) {
  const cardColor = card.color || "#1e293b";
  const useDarkText = isLightColor(cardColor);

  const cardTypeLabel = CARD_TYPES.find((t) => t.value === card.card_type)?.label;
  const cardKindLabel = CARD_KINDS.find((k) => k.value === card.card_kind)?.label;

  return (
    <button
      onClick={onClick}
      className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
    >
      <div
        className="relative w-full aspect-[1.75/1] rounded-2xl p-4 overflow-hidden shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl active:scale-[0.98]"
        style={{
          background: `linear-gradient(135deg, ${cardColor} 0%, ${cardColor}dd 50%, ${cardColor}aa 100%)`,
          color: useDarkText ? DARK_TEXT_COLOR : "white",
        }}
      >
        {/* Decorative circles */}
        <div
          className="absolute -right-8 -top-8 w-28 h-28 rounded-full opacity-10"
          style={{ backgroundColor: useDarkText ? DARK_TEXT_COLOR : "white" }}
        />
        <div
          className="absolute -right-4 top-12 w-20 h-20 rounded-full opacity-10"
          style={{ backgroundColor: useDarkText ? DARK_TEXT_COLOR : "white" }}
        />

        {/* Top row: Bank logo and card kind */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2">
            {card.bank?.image ? (
              <div
                className="h-7 w-7 rounded-md backdrop-blur-sm p-1 flex items-center justify-center"
                style={{ backgroundColor: useDarkText ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)" }}
              >
                <Image
                  src={card.bank.image}
                  alt={card.bank.name}
                  width={20}
                  height={20}
                  className="object-contain"
                />
              </div>
            ) : (
              <div
                className="h-7 w-7 rounded-md backdrop-blur-sm flex items-center justify-center"
                style={{ backgroundColor: useDarkText ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.2)" }}
              >
                <CreditCard className="h-3.5 w-3.5" />
              </div>
            )}
            {card.bank && (
              <span className="text-xs font-medium opacity-80">{card.bank.name}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {cardKindLabel && (
              <span className="text-[10px] font-medium uppercase opacity-60">{cardKindLabel}</span>
            )}
            <Wifi className="h-4 w-4 opacity-60 rotate-90" />
          </div>
        </div>

        {/* Card number */}
        <div className="font-mono text-base tracking-widest mb-3 opacity-90">
          •••• •••• •••• {card.last4 || "••••"}
        </div>

        {/* Bottom row: cardholder, expiry, type, balance */}
        <div className="flex items-end justify-between mb-2">
          <div className="flex-1 min-w-0">
            {card.cardholder_name && (
              <p className="text-xs font-medium tracking-wide uppercase truncate">
                {card.cardholder_name}
              </p>
            )}
            {card.expiration_date && (
              <p className="text-[10px] opacity-60 mt-0.5">{card.expiration_date}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-0.5">
            {cardTypeLabel && (
              <span className="text-[10px] font-bold uppercase opacity-80">{cardTypeLabel}</span>
            )}
            {card.card_kind === "credit" && card.outstanding_balance != null && card.outstanding_balance > 0 && (
              <span className="text-[10px] font-semibold opacity-70">
                {formatCurrency(card.outstanding_balance)}
              </span>
            )}
          </div>
        </div>

        {/* Card name */}
        <p className="text-[11px] font-medium opacity-70 truncate">{card.name}</p>
      </div>
    </button>
  );
}
