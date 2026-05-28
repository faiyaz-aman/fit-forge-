import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple Tailwind CSS classes into a single string,
 * resolving conflicts appropriately.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
