import React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const PASSWORD_RULES = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (value) => /[A-Z]/.test(value),
  },
  {
    id: "number",
    label: "One number",
    test: (value) => /[0-9]/.test(value),
  },
  {
    id: "special",
    label: "One special character",
    test: (value) => /[^A-Za-z0-9]/.test(value),
  },
];

export function passwordMeetsAllRules(password) {
  return PASSWORD_RULES.every((rule) => rule.test(password || ""));
}

export function PasswordRequirementsChecklist({ password = "" }) {
  return (
    <ul className="mt-2 space-y-1.5" aria-live="polite">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-2 text-sm",
              passed ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {passed ? (
              <Check className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <X className="h-4 w-4 shrink-0" aria-hidden />
            )}
            <span>
              {rule.label}
              <span className="sr-only">{passed ? " — met" : " — not met"}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
