import { MetricCard } from "@/components/MetricCard";
import { RiskAlert } from "@/components/RiskAlert";
import { AIInsightCard } from "@/components/AIInsightCard";
import { ComplianceTracker } from "@/components/ComplianceTracker";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Shield,
  TrendingDown,
  DollarSign,
  AlertCircle,
  BarChart3,
  Brain,
} from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `url(${heroBackground})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-primary" />
        
        <div className="relative z-10 container mx-auto px-6 py-24">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                Next-Generation Risk Management
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              RiskWise 2.0
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Strengthen resilience and regulatory alignment with AI-powered prudential
              risk management for financial institutions
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                <BarChart3 className="mr-2 h-5 w-5" />
                View Dashboard
              </Button>
              <Button size="lg" variant="secondary">
                <Brain className="mr-2 h-5 w-5" />
                AI Insights
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard */}
      <section className="container mx-auto px-6 py-12 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Risk Exposure"
            value="$2.4B"
            change={-3.2}
            icon={TrendingDown}
            trend="down"
            status="healthy"
          />
          <MetricCard
            title="Capital Adequacy"
            value="18.5%"
            change={2.1}
            icon={Shield}
            trend="up"
            status="healthy"
          />
          <MetricCard
            title="Liquidity Ratio"
            value="142%"
            change={-1.5}
            icon={Activity}
            trend="down"
            status="warning"
          />
          <MetricCard
            title="Credit Quality"
            value="94.2%"
            change={0.8}
            icon={DollarSign}
            trend="up"
            status="healthy"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Alerts and Insights */}
          <div className="lg:col-span-2 space-y-8">
            {/* Risk Alerts */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-foreground">
                  Real-Time Risk Alerts
                </h2>
              </div>
              <div className="space-y-3">
                <RiskAlert
                  level="medium"
                  message="Market volatility increased by 15% in tech sector holdings"
                  timestamp="2 minutes ago"
                />
                <RiskAlert
                  level="low"
                  message="Liquidity coverage ratio improved to 142%"
                  timestamp="1 hour ago"
                />
                <RiskAlert
                  level="high"
                  message="Credit concentration limit approaching threshold (92%)"
                  timestamp="3 hours ago"
                />
              </div>
            </div>

            {/* AI Insights */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Brain className="h-6 w-6 text-accent" />
                <h2 className="text-2xl font-bold text-foreground">
                  AI-Powered Insights
                </h2>
              </div>
              <div className="space-y-4">
                <AIInsightCard
                  title="Portfolio Rebalancing Opportunity"
                  description="AI analysis suggests reducing exposure to high-volatility assets by 8% to optimize risk-adjusted returns"
                  confidence={94}
                  category="Optimization"
                />
                <AIInsightCard
                  title="Emerging Credit Risk Pattern"
                  description="Machine learning models detected early indicators of credit deterioration in SME loan portfolio"
                  confidence={87}
                  category="Prediction"
                />
                <AIInsightCard
                  title="Regulatory Compliance Enhancement"
                  description="Automated analysis recommends updates to stress testing scenarios based on recent market conditions"
                  confidence={91}
                  category="Compliance"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Compliance Tracker */}
          <div className="lg:col-span-1">
            <ComplianceTracker />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
