"use client";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getFileUrl(path) {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  if (path.startsWith('/assets/')) return path; // Frontend public assets
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const cleanPath = path.startsWith('/uploads/') ? path : `/uploads/${path.startsWith('/') ? path.slice(1) : path}`;
  return `${baseUrl}${cleanPath}`;
}

export function serializeConfig(params) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== 'watch' && key !== 'mode') {
      searchParams.append(key, value);
    }
  });
  return searchParams.toString();
}
