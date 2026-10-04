import React from "react";
import { AlertCircle, ShieldAlert } from "lucide-react";

export function MedicalDisclaimer() {
  return (
    <div className="bg-muted/40 border border-border p-5 rounded-[var(--radius)] text-xs text-foreground shadow-xs">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-secondary flex items-center gap-1.5 tracking-tight">
            <ShieldAlert className="w-4 h-4 text-primary" />
            Clinical Notice & Informational Disclaimer
          </p>
          <p className="text-muted-foreground leading-relaxed">
            MedSimplify provides automated document parsing and plain-language health explanations for educational purposes only. It does not provide medical diagnoses, treatment plans, or clinical prescriptions. Always consult a qualified medical professional for health decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
