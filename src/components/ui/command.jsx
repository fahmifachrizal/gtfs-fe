"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"

function Command({
  className,
  ...props
}) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-lg bg-popover text-popover-foreground",
        className
      )}
      {...props} />
  );
}

function CommandDialog({
  children,
  ...props
}) {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0 shadow-lg shadow-black/20">
        <Command className="[&_[data-slot='command-input-wrapper']]:px-3 [&_[data-slot='command-input-wrapper']]:py-2 [&_[data-slot='command-input-wrapper']]:border-b">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}) {
  return (
    <div data-slot="command-input-wrapper" className="flex items-center gap-2">
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "h-full w-full rounded-lg bg-transparent py-1 text-sm outline-hidden placeholder:text-muted-foreground disabled:opacity-50",
          className
        )}
        {...props} />
    </div>
  );
}

function CommandList({
  className,
  ...props
}) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn("max-h-[320px] overflow-y-auto overflow-x-hidden", className)}
      {...props} />
  );
}

function CommandEmpty({
  ...props
}) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm text-muted-foreground"
      {...props} />
  );
}

function CommandGroup({
  className,
  ...props
}) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn("[&_[data-slot='command-group-heading']]:px-2 [&_[data-slot='command-group-heading']]:py-1.5 [&_[data-slot='command-group-heading']]:text-xs [&_[data-slot='command-group-heading']]:font-medium [&_[data-slot='command-group-heading']]:text-muted-foreground", className)}
      {...props} />
  );
}

function CommandSeparator({
  className,
  ...props
}) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-muted", className)}
      {...props} />
  );
}

function CommandItem({
  className,
  ...props
}) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 py-1.5 text-sm outline-hidden data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground",
        className
      )}
      {...props} />
  );
}

function CommandShortcut({
  className,
  ...props
}) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs text-muted-foreground",
        className
      )}
      {...props} />
  );
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandSeparator,
  CommandItem,
  CommandShortcut,
}
