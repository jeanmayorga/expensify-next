"use client";

import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";

interface MonthPickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const handlePrevMonth = () => {
    onChange(subMonths(value, 1));
  };

  const handleNextMonth = () => {
    onChange(addMonths(value, 1));
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={handlePrevMonth}>
        ←
      </Button>
      <div className="min-w-[110px] sm:min-w-[140px] text-center font-medium capitalize text-sm sm:text-base">
        {format(value, "MMMM yyyy", { locale: es })}
      </div>
      <Button variant="outline" size="icon" onClick={handleNextMonth}>
        →
      </Button>
    </div>
  );
}
