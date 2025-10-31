import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  trend: "up" | "down" | "neutral";
  status?: "healthy" | "warning" | "critical";
}

export const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  trend,
  status = "healthy",
}: MetricCardProps) => {
  const statusColors = {
    healthy: "text-success",
    warning: "text-warning",
    critical: "text-destructive",
  };

  const trendColors = {
    up: trend === "up" ? "text-success" : "text-destructive",
    down: trend === "down" ? "text-success" : "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <Card className="relative overflow-hidden border-border bg-card/50 backdrop-blur-sm p-6 transition-all hover:border-primary/50 hover:shadow-glow">
      <div className="absolute inset-0 bg-gradient-glow opacity-0 transition-opacity hover:opacity-100" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
          <Icon className={cn("h-5 w-5", statusColors[status])} />
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-foreground">{value}</p>
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-medium", trendColors[trend])}>
              {change > 0 ? "+" : ""}{change}%
            </span>
            <span className="text-xs text-muted-foreground">vs last period</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
