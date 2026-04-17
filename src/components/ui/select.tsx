// Shadcn UI Select component - placeholder if not exists
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface SelectProps {
  children: React.ReactNode
}

export const Select = React.forwardRef<
  React.ElementRef<typeof Popover>,
  React.ComponentPropsWithoutRef<typeof Popover>
>(({ children }, ref) => (
  <Popover ref={ref}>
    {children}
  </Popover>
))
Select.displayName = Popover.displayName

export const SelectTrigger = ({ className, children }: any) => (
  <Button className={cn("w-full justify-between", className)}>
    {children}
    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
  </Button>
)

export const SelectValue = ({ placeholder }: any) => (
  <span>{placeholder}</span>
)

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof Command>,
  React.ComponentPropsWithoutRef<typeof Command>
>(({ children, position = "popper", className, ...props }, ref) => (
  <PopoverContent className={cn("w-[200px] p-0", className)} ref={ref} align="start" sideOffset={4} side={position}>
    <Command {...props}>
      {children}
    </Command>
  </PopoverContent>
))
SelectContent.displayName = Command.displayName

export const SelectItem = ({ value, children }: any) => (
  <CommandItem value={value}>{children}</CommandItem>
)

export const SelectGroup = ({ children }: any) => (
  <CommandGroup>{children}</CommandGroup>
)

