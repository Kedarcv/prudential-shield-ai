import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface RiskAlertProps {
  level: "low" | "medium" | "high";
  message: string;
  timestamp: string;
}

export const RiskAlert = ({ level, message, timestamp }: RiskAlertProps) => {
  const levelConfig = {
    low: {
      icon: CheckCircle,
      className: "border-success/50 bg-success/5",
      iconClassName: "text-success",
    },
    medium: {
      icon: AlertTriangle,
      className: "border-warning/50 bg-warning/5",
      iconClassName: "text-warning",
    },
    high: {
      icon: AlertCircle,
      className: "border-destructive/50 bg-destructive/5",
      iconClassName: "text-destructive",
    },
  };

  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border transition-all hover:border-primary/50",
        config.className
      )}
    >
      <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", config.iconClassName)} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground mb-1">{message}</p>
        <p className="text-xs text-muted-foreground">{timestamp}</p>
      </div>
    </div>
  );
};
