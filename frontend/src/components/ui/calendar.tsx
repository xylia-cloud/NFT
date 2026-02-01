import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

export interface FlowByDate {
  [dateStr: string]: { income: number; expense: number } | number; // "2024-03-14" -> { income: 12.50, expense: 0 } or just 12.50 for rewards
}

interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  flowByDate?: FlowByDate;
  showAmount?: boolean;
  className?: string;
}

export function Calendar({
  selectedDate,
  onSelectDate,
  flowByDate = {},
  showAmount = false,
  className,
}: CalendarProps) {
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1));
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const isToday = (d: number) => {
    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === d
    );
  };

  const isSelected = (d: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === d
    );
  };

  const getFlow = (d: number) => {
    const str = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const flow = flowByDate[str];
    if (flow === undefined) return { income: 0, expense: 0 };
    if (typeof flow === "number") return { income: flow, expense: 0 };
    return flow;
  };

  const getAmount = (d: number) => {
    const str = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const flow = flowByDate[str];
    if (flow === undefined) return 0;
    if (typeof flow === "number") return flow;
    return flow.income;
  };

  const hasIncome = (d: number) => getFlow(d).income > 0;
  const hasExpense = (d: number) => getFlow(d).expense > 0;
  const hasFlow = (d: number) => hasIncome(d) || hasExpense(d);
  const hasReward = (d: number) => getAmount(d) > 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between px-2 mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={prevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-semibold text-foreground">
          {year}年{month + 1}月
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {w}
          </div>
        ))}
        {days.map((d, i) =>
          d === null ? (
            <div key={`empty-${i}`} className="aspect-square" />
          ) : (
            <button
              key={d}
              type="button"
              onClick={() => {
                const date = new Date(year, month, d);
                onSelectDate(isSelected(d) ? null : date);
              }}
              className={cn(
                "aspect-square rounded-lg text-sm font-medium transition-colors flex flex-col items-center justify-center gap-0.5 relative",
                "hover:bg-muted/80",
                isSelected(d) && "bg-primary text-primary-foreground hover:bg-primary/90",
                !isSelected(d) && isToday(d) && "ring-1 ring-primary",
                !isSelected(d) && !isToday(d) && "text-foreground",
                (hasFlow(d) || hasReward(d)) && !isSelected(d) && "bg-primary/5"
              )}
            >
              {d}
              {showAmount && hasReward(d) && !isSelected(d) && (
                <span className="text-[10px] text-primary font-medium">+{getAmount(d).toFixed(1)}</span>
              )}
              {!showAmount && (hasFlow(d) || hasReward(d)) && !isSelected(d) && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5 items-center">
                  {hasIncome(d) || hasReward(d) ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" title="收入" />
                  ) : null}
                  {hasExpense(d) ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" title="支出" />
                  ) : null}
                </div>
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
}
