import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const YT_REGEX = /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:[^&]*&)*v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}