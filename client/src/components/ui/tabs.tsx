import { Tabs as TabsPrimitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '../../lib/utils';

// From shadcn/ui, restyled with the tokens.md colors. Radix supplies role="tablist"/"tab",
// aria-selected and arrow-key navigation.

function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn('flex flex-col gap-4', className)} {...props} />;
}

function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn('flex gap-1 rounded-card bg-divider p-1', className)}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        'min-h-11 flex-1 rounded-control px-4 font-semibold text-text data-[state=active]:bg-surface data-[state=active]:text-primary-ink data-[state=active]:shadow-sm',
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn(className)} {...props} />;
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
