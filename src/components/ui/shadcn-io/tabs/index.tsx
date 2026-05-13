"use client";

import * as React from "react";
import { Activity } from "react";
import { motion, type Transition, type HTMLMotionProps } from "motion/react";

import { cn } from "@/lib/utils";
import {
  MotionHighlight,
  MotionHighlightItem,
} from "@/components/ui/shadcn-io/motion-highlight";

// Tabs Component
type TabsContextType<T extends string> = {
  activeValue: T;
  handleValueChange: (value: T) => void;
  registerTrigger: (value: T, node: HTMLElement | null) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TabsContext = React.createContext<TabsContextType<any> | undefined>(
  undefined
);

function useTabs<T extends string = string>(): TabsContextType<T> {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error("useTabs must be used within a TabsProvider");
  }
  return context;
}

type BaseTabsProps = React.ComponentProps<"div"> & {
  children: React.ReactNode;
};

type UnControlledTabsProps<T extends string = string> = BaseTabsProps & {
  defaultValue?: T;
  value?: never;
  onValueChange?: never;
};

type ControlledTabsProps<T extends string = string> = BaseTabsProps & {
  value: T;
  onValueChange?: (value: T) => void;
  defaultValue?: never;
};

type TabsProps<T extends string = string> =
  | UnControlledTabsProps<T>
  | ControlledTabsProps<T>;

function Tabs<T extends string = string>({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
  ...props
}: TabsProps<T>) {
  const [activeValue, setActiveValue] = React.useState<T | undefined>(
    defaultValue ?? undefined
  );
  const triggersRef = React.useRef(new Map<string, HTMLElement>());
  const initialSet = React.useRef(false);
  const isControlled = value !== undefined;

  React.useEffect(() => {
    if (
      !isControlled &&
      activeValue === undefined &&
      triggersRef.current.size > 0 &&
      !initialSet.current
    ) {
      const firstTab = Array.from(triggersRef.current.keys())[0];
      setActiveValue(firstTab as T);
      initialSet.current = true;
    }
  }, [activeValue, isControlled]);

  const registerTrigger = (value: string, node: HTMLElement | null) => {
    if (node) {
      triggersRef.current.set(value, node);
      if (!isControlled && activeValue === undefined && !initialSet.current) {
        setActiveValue(value as T);
        initialSet.current = true;
      }
    } else {
      triggersRef.current.delete(value);
    }
  };

  const handleValueChange = (val: T) => {
    if (!isControlled) setActiveValue(val);
    else onValueChange?.(val);
  };

  return (
    <TabsContext.Provider
      value={{
        activeValue: (value ?? activeValue)!,
        handleValueChange,
        registerTrigger,
      }}
    >
      <div
        data-slot="tabs"
        className={cn("flex flex-col gap-2", className)}
        {...props}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

type TabsListProps = React.ComponentProps<"div"> & {
  children: React.ReactNode;
  activeClassName?: string;
  transition?: Transition;
};

function TabsList({
  children,
  className,
  activeClassName,
  transition = {
    type: "spring",
    stiffness: 200,
    damping: 25,
  },
  ...props
}: TabsListProps) {
  const { activeValue } = useTabs();

  return (
    <MotionHighlight
      controlledItems
      className={cn(" bg-background", activeClassName)}
      value={activeValue}
      transition={transition}
    >
      <div
        role="tablist"
        data-slot="tabs-list"
        className={cn(
          "bg-muted text-muted-foreground flex  w-fit items-center justify-center  p-[4px]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </MotionHighlight>
  );
}

type TabsTriggerProps = HTMLMotionProps<"button"> & {
  value: string;
  children: React.ReactNode;
};

function TabsTrigger({
  ref,
  value,
  children,
  className,
  ...props
}: TabsTriggerProps) {
  const { activeValue, handleValueChange, registerTrigger } = useTabs();

  const localRef = React.useRef<HTMLButtonElement | null>(null);
  React.useImperativeHandle(ref, () => localRef.current as HTMLButtonElement);

  React.useEffect(() => {
    registerTrigger(value, localRef.current);
    return () => registerTrigger(value, null);
  }, [value, registerTrigger]);

  return (
    <MotionHighlightItem value={value}>
      <motion.button
        ref={localRef}
        data-slot="tabs-trigger"
        role="tab"
        whileTap={{ scale: 0.95 }}
        onClick={() => handleValueChange(value)}
        data-state={activeValue === value ? "active" : "inactive"}
        className={cn(
          " cursor-pointer items-center  justify-center whitespace-nowrap  px-2 py-1 text-sm font-medium ring-offset-background transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:text-foreground z-[1]",
          className
        )}
        {...props}
      >
        {children}
      </motion.button>
    </MotionHighlightItem>
  );
}

type TabsContentsProps = React.ComponentProps<"div"> & {
  children: React.ReactNode;
  /** @deprecated No longer used - Activity handles visibility. Kept for API compatibility. */
  transition?: Transition;
};

function TabsContents({
  children,
  className,
  transition: _transition,
  ...props
}: TabsContentsProps) {
  return (
    <div
      data-slot="tabs-contents"
      className={cn("overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
}

type TabsContentProps = React.ComponentProps<"div"> & {
  value: string;
  children: React.ReactNode;
  /** @deprecated No longer used - Activity handles visibility. Kept for API compatibility. */
  transition?: Transition;
};

function TabsContent({
  children,
  value,
  className,
  transition: _transition,
  ...props
}: TabsContentProps) {
  const { activeValue } = useTabs();
  return (
    <Activity mode={activeValue === value ? "visible" : "hidden"}>
      <div
        role="tabpanel"
        data-slot="tabs-content"
        className={cn("overflow-visible flex flex-col gap-6 flex-1", className)}
        {...props}
      >
        {children}
      </div>
    </Activity>
  );
}

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContents,
  TabsContent,
  useTabs,
  type TabsContextType,
  type TabsProps,
  type TabsListProps,
  type TabsTriggerProps,
  type TabsContentsProps,
  type TabsContentProps,
};
