"use client";

import { CalendarDays, ChevronDown } from "lucide-react";

interface MonthPickerProps {
  value: Date;
  onChange: (date: Date) => void;
}

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const selectedMonth = value.getMonth();
  const selectedYear = value.getFullYear();

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(selectedYear, Number(e.target.value), 1);
    onChange(newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(Number(e.target.value), selectedMonth, 1);
    onChange(newDate);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <CalendarDays className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/50 pointer-events-none" />
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/50 pointer-events-none" />
        <select
          value={selectedMonth}
          onChange={handleMonthChange}
          className="w-full bg-sidebar-accent text-sidebar-foreground border-0 rounded-md pl-7 pr-6 py-1.5 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-sidebar-ring appearance-none"
        >
          {MONTHS.map((name, i) => (
            <option key={i} value={i} className="text-foreground bg-background">
              {name}
            </option>
          ))}
        </select>
      </div>
      <div className="relative">
        <CalendarDays className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/50 pointer-events-none" />
        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-sidebar-foreground/50 pointer-events-none" />
        <select
          value={selectedYear}
          onChange={handleYearChange}
          className="w-full bg-sidebar-accent text-sidebar-foreground border-0 rounded-md pl-7 pr-6 py-1.5 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-sidebar-ring appearance-none"
        >
          {YEARS.map((year) => (
            <option key={year} value={year} className="text-foreground bg-background">
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
