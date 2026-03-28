"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function Select({ value, onChange, options, disabled, className = "", placeholder }: SelectProps) {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const selectedIndex = options.findIndex((o) => o.value === value);

  const close = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, close]);

  // Scroll focused item into view
  useEffect(() => {
    if (!open || focusedIndex < 0 || !listRef.current) return;
    const items = listRef.current.children;
    if (items[focusedIndex]) {
      (items[focusedIndex] as HTMLElement).scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        } else if (focusedIndex >= 0) {
          onChange(options[focusedIndex].value);
          close();
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        } else {
          setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : prev));
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) {
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        }
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close();
        break;
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    if (open) {
      close();
    } else {
      setOpen(true);
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded bg-card border text-sm text-left transition-colors ${
          open
            ? "border-accent shadow-[0_0_0_3px_rgba(250,204,21,0.1)]"
            : "border-border hover:border-muted"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_rgba(250,204,21,0.1)]`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${selectedOption ? "text-foreground" : "text-muted"}`}>
          {selectedOption?.label || placeholder || "Select..."}
        </span>
        <svg
          className={`w-4 h-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg bg-card border border-border shadow-lg shadow-black/30 py-1"
        >
          {options.map((option, i) => (
            <div
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                option.value === value
                  ? "text-accent bg-accent/10"
                  : focusedIndex === i
                    ? "bg-card-hover text-foreground"
                    : "text-foreground hover:bg-card-hover"
              }`}
              onMouseEnter={() => setFocusedIndex(i)}
              onClick={() => {
                onChange(option.value);
                close();
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
