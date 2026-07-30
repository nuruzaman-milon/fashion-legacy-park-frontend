"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "inline-flex h-5 w-8.5 shrink-0 items-center rounded-full border border-transparent bg-input p-0.5 transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:bg-brand data-disabled:cursor-not-allowed data-disabled:opacity-50 dark:bg-input/80 dark:data-checked:bg-brand",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="size-4 rounded-full bg-background shadow-sm transition-transform data-checked:translate-x-3.5 dark:data-checked:bg-brand-foreground"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
