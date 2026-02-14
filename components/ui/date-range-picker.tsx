"use client";

import * as React from "react";
import { format } from "date-fns";
import { es as dateFnsEs } from "date-fns/locale";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { es as dayPickerEs } from "react-day-picker/locale";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  /** Estilo similar al SelectTrigger */
  triggerClassName?: string;
}

const formatDateDisplay = (date: Date) =>
  format(date, "dd/MMMM/yyyy", { locale: dateFnsEs });

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Seleccionar rango",
  className,
  triggerClassName,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const displayText = React.useMemo(() => {
    if (!value?.from) return placeholder;
    const fromStr = formatDateDisplay(value.from);
    if (!value.to || value.from.getTime() === value.to.getTime()) {
      return fromStr;
    }
    return `${fromStr} → ${formatDateDisplay(value.to)}`;
  }, [value, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "border-input data-placeholder:text-muted-foreground [&_svg]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 flex h-9 w-full sm:w-fit sm:min-w-[200px] items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] hover:bg-transparent",
            triggerClassName,
            className,
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-50" />
          <span className="flex-1 truncate text-left capitalize">
            {displayText}
          </span>
          <ChevronDownIcon className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={value}
          onSelect={onChange}
          defaultMonth={value?.from ?? new Date()}
          locale={dayPickerEs}
          className="[--cell-size:--spacing(8)]"
        />
      </PopoverContent>
    </Popover>
  );
}
