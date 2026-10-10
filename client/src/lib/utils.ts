import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// shadcn/ui's helper: joins class names and lets a later Tailwind class override an earlier one
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
