"use client";

import {
  BookOpen,
  Building2,
  Car,
  Circle,
  Coins,
  CreditCard,
  Dog,
  Droplets,
  Dumbbell,
  Flame,
  Gamepad2,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Music,
  PiggyBank,
  Plane,
  Shirt,
  ShoppingCart,
  Smartphone,
  Tv,
  Utensils,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Central registry mapping category icon keys (the `icon` value stored on a
 * category) to Lucide icon components. Prefer this over per-page emoji or
 * icon maps so category icons render consistently across the app.
 */
export const categoryIconMap: Record<string, LucideIcon> = {
  "shopping-cart": ShoppingCart,
  utensils: Utensils,
  car: Car,
  home: Home,
  "gamepad-2": Gamepad2,
  shirt: Shirt,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  plane: Plane,
  smartphone: Smartphone,
  tv: Tv,
  dumbbell: Dumbbell,
  "book-open": BookOpen,
  music: Music,
  dog: Dog,
  gift: Gift,
  coins: Coins,
  "piggy-bank": PiggyBank,
  "credit-card": CreditCard,
  "building-2": Building2,
  wifi: Wifi,
  droplets: Droplets,
  zap: Zap,
  fire: Flame,
  circle: Circle,
};

/** Resolve an icon key to its Lucide component, falling back to Circle. */
export function getCategoryIcon(icon?: string | null): LucideIcon {
  return (icon && categoryIconMap[icon]) || Circle;
}

/** Render a category icon by key, defaulting to Circle when unknown. */
export function CategoryIcon({
  icon,
  className,
}: {
  icon?: string | null;
  className?: string;
}) {
  const Icon = getCategoryIcon(icon);
  return <Icon className={className} aria-hidden="true" />;
}
