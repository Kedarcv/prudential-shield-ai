import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp } from "lucide-react";

interface AIInsightCardProps {
  title: string;
  description: string;
  confidence: number;
  category: string;
}

export const AIInsightCard = ({
  title,
  description,
  confidence,
  category,
}: AIInsightCardProps) => {
  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm p-5 transition-all hover:border-accent/50 hover:shadow-glow">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
          <Brain className="h-5 w-5 text-accent" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <Badge variant="secondary" className="text-xs">
              {category}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-3">{description}</p>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-sm font-medium text-success">
              {confidence}% confidence
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
