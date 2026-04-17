"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const HOURS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]
const MINUTES = [
  "00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"
]
const AMPM = ["AM", "PM"]

type TimePickerProps = {
  date?: Date
  onChange?: (date: Date | undefined) => void
  disabled?: boolean
}

const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  ({ date, onChange, disabled }, ref) => {
    const [hour, setHour] = React.useState("00")
    const [minute, setMinute] = React.useState("00")

React.useEffect(() => {
      if (!date) {
        setHour("01")
        setMinute("00")
        return
      }
      const hour12 = date.getHours() % 12 || 12;
      setHour(hour12.toString().padStart(2, "0"))
      const minStr = date.getMinutes().toString().padStart(2, "0")
      setMinute(MINUTES.find((min) => min.includes(minStr)) || "00")
    }, [date])

    return (
      <div ref={ref} className={cn("grid gap-2 grid-cols-3", { "opacity-50 pointer-events-none": disabled })}>
        <Select disabled={disabled} onValueChange={setHour}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select disabled={disabled} onValueChange={setMinute}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MINUTES.map((minute) => (
              <SelectItem key={minute} value={minute}>
                {minute}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select disabled={disabled} onValueChange={(value) => {
          const currentDate = date || new Date();
          const [h, m] = [hour, minute];
          let hourNum = parseInt(h);
          if (value === 'PM' && hourNum < 12) hourNum += 12;
          if (value === 'AM' && hourNum === 12) hourNum = 0;
          const minuteNum = parseInt(m);
          const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hourNum, minuteNum);
          onChange?.(newDate);
        }}>
          <SelectTrigger className="h-10">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AMPM.map((ampm) => (
              <SelectItem key={ampm} value={ampm}>
                {ampm}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }
)
TimePicker.displayName = "TimePicker"

export { TimePicker }

