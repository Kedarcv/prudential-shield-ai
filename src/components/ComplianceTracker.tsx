import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle2 } from "lucide-react";

interface ComplianceItem {
  name: string;
  completion: number;
  status: "compliant" | "in-progress" | "at-risk";
}

import { useCompliance } from "@/hooks/useApi";
import { useEffect, useState } from "react";

export const ComplianceTracker = () => {
  const { data: complianceData, loading } = useCompliance();
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);

  useEffect(() => {
    if (complianceData && complianceData.frameworks) {
      const items = complianceData.frameworks.map((framework: any) => ({
        name: framework.framework.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        completion: Math.round(framework.summary?.averageCompletion || 0),
        status: (framework.summary?.averageCompletion >= 95 ? 'compliant' : 
                framework.summary?.averageCompletion >= 80 ? 'in-progress' : 'at-risk') as "compliant" | "in-progress" | "at-risk"
      }));
      setComplianceItems(items);
    } else {
      // Fallback data if API fails
      setComplianceItems([
        { name: "Basel III Requirements", completion: 98, status: "compliant" },
        { name: "IFRS 9 Standards", completion: 95, status: "compliant" },
        { name: "Stress Testing", completion: 87, status: "in-progress" },
        { name: "Liquidity Coverage Ratio", completion: 92, status: "compliant" },
      ]);
    }
  }, [complianceData]);

  if (loading) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Regulatory Compliance
          </h3>
        </div>
        <div className="space-y-5">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-2 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Regulatory Compliance
        </h3>
      </div>
      <div className="space-y-5">
        {complianceItems.map((item) => (
          <div key={item.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                {item.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {item.completion}%
                </span>
                {item.status === "compliant" && (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                )}
              </div>
            </div>
            <Progress value={item.completion} className="h-2" />
          </div>
        ))}
      </div>
    </Card>
  );
};
