"use client"

import * as React from "react"
import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu"

import { cn } from "@/lib/utils"

function NavigationMenu({
  className,
  ...props
}: NavigationMenuPrimitive.Root.Props) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      delay={100}
      closeDelay={150}
      className={cn("relative", className)}
      {...props}
    />
  )
}

function NavigationMenuList({
  className,
  ...props
}: NavigationMenuPrimitive.List.Props) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn("flex items-center gap-6", className)}
      {...props}
    />
  )
}

function NavigationMenuItem({
  ...props
}: NavigationMenuPrimitive.Item.Props) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      {...props}
    />
  )
}

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Trigger.Props) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(
        "relative inline-flex items-center gap-1 text-sm font-medium text-foreground/80 transition-colors outline-none after:absolute after:inset-x-0 after:-bottom-7 after:h-0.5 after:bg-brand after:opacity-0 after:transition-opacity hover:text-brand focus-visible:text-brand data-[popup-open]:text-brand data-[popup-open]:after:opacity-100",
        className
      )}
      {...props}
    >
      {children}
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: NavigationMenuPrimitive.Content.Props) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "transition-[opacity,transform] duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 data-[activation-direction=left]:data-starting-style:translate-x-[-2rem] data-[activation-direction=right]:data-starting-style:translate-x-[2rem]",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuLink({
  className,
  ...props
}: NavigationMenuPrimitive.Link.Props) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn("outline-none", className)}
      {...props}
    />
  )
}

function NavigationMenuViewport({
  className,
  ...props
}: NavigationMenuPrimitive.Positioner.Props) {
  return (
    <NavigationMenuPrimitive.Portal>
      <NavigationMenuPrimitive.Positioner
        data-slot="navigation-menu-positioner"
        sideOffset={12}
        collisionPadding={{ left: 16, right: 16 }}
        className={cn(
          "z-50 h-[var(--positioner-height)] w-[var(--positioner-width)]",
          className
        )}
        {...props}
      >
        <NavigationMenuPrimitive.Popup
          data-slot="navigation-menu-popup"
          className="h-[var(--popup-height)] w-[var(--popup-width)] rounded-b-xl border border-t-0 border-[oklch(0.88_0.04_82/0.8)] bg-popover bg-clip-padding text-popover-foreground shadow-xl shadow-[oklch(0.3_0.03_55/0.12)] transition-[width,height,opacity] duration-250 ease-out data-ending-style:opacity-0 data-starting-style:opacity-0"
        >
          <NavigationMenuPrimitive.Viewport
            data-slot="navigation-menu-viewport"
            className="relative size-full overflow-hidden rounded-[inherit]"
          />
        </NavigationMenuPrimitive.Popup>
      </NavigationMenuPrimitive.Positioner>
    </NavigationMenuPrimitive.Portal>
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
}
