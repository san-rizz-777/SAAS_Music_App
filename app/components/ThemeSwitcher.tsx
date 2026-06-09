"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export function ThemeSwitcher() {
    const { theme, setTheme } = useTheme();
    const [isMounted, setIsMounted] = useState(false);
    const isDark = theme;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    const toggleTheme = () => {
        setTheme(isDark === "dark" ? "light" : "dark");
    };

    return (
        <Button
            className="hover:bg-transparent"
            onClick={toggleTheme}
            variant="ghost"
        >
            {isDark === "dark" ? <Sun /> : <Moon />}
        </Button>
    );
}