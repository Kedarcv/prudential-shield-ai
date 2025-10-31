import { MetricCard } from "@/components/MetricCard";
import { RiskAlert } from "@/components/RiskAlert";
import { AIInsightCard } from "@/components/AIInsightCard";
import { ComplianceTracker } from "@/components/ComplianceTracker";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Activity,
  Shield,
  TrendingDown,
  DollarSign,
  AlertCircle,
  BarChart3,
  Brain,
  Wifi,
  WifiOff,
} from "lucide-react";
import heroBackground from "@/assets/hero-background.jpg";
import { useDashboardMetrics, useAlerts, useAIInsights, useHealthCheck } from "@/hooks/useApi";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { indexPageConfig, loadingConfig } from "@/config/dashboardConfig";

const Index = () => {
  const navigate = useNavigate();
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboardMetrics();
  const { data: alertsData, loading: alertsLoading } = useAlerts({ status: 'active', limit: 10 });
  const { data: aiInsights, loading: aiLoading } = useAIInsights();
  const { isHealthy } = useHealthCheck();
  
  // Use configurable fallback data
  const fallbackMetrics = indexPageConfig.fallbackMetrics;
  const fallbackAlerts = indexPageConfig.fallbackAlerts;

  // Use real data if available, otherwise fallback
  const metrics = dashboardData?.keyMetrics || fallbackMetrics;
  const alerts = alertsData?.alerts || fallbackAlerts;
  const insights = aiInsights || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Health Status Indicator */}
      {!isHealthy && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <WifiOff className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Backend services are currently unavailable. Displaying cached data.
              </p>
            </div>
          </div>
        </div>
      )}

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
              Prudential Risk Management
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Comprehensive risk assessment and regulatory compliance platform 
              for financial institutions and banking operations
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90"
                onClick={() => navigate('/risk')}
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                View Dashboard
              </Button>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => navigate('/compliance')}
              >
                <Brain className="mr-2 h-5 w-5" />
                Analytics
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard */}
      <section className="container mx-auto px-6 py-12 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardLoading ? (
            // Loading skeletons
            Array.from({ length: loadingConfig.skeletonCount.metrics }).map((_, i) => (
              <div key={i} className="p-6 rounded-lg border bg-card">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
          ) : (
            <>
              <MetricCard
                title="Risk Exposure"
                value={metrics.riskExposure?.value || "$2.4B"}
                change={metrics.riskExposure?.change || -3.2}
                icon={TrendingDown}
                trend={metrics.riskExposure?.change > 0 ? "up" : "down"}
                status={metrics.riskExposure?.status || "healthy"}
              />
              <MetricCard
                title="Capital Adequacy"
                value={metrics.capitalAdequacy?.value || "18.5%"}
                change={metrics.capitalAdequacy?.change || 2.1}
                icon={Shield}
                trend={metrics.capitalAdequacy?.change > 0 ? "up" : "down"}
                status={metrics.capitalAdequacy?.status || "healthy"}
              />
              <MetricCard
                title="Liquidity Ratio"
                value={metrics.liquidityRatio?.value || "142%"}
                change={metrics.liquidityRatio?.change || -1.5}
                icon={Activity}
                trend={metrics.liquidityRatio?.change > 0 ? "up" : "down"}
                status={metrics.liquidityRatio?.status || "warning"}
              />
              <MetricCard
                title="Credit Quality"
                value={metrics.creditQuality?.value || "94.2%"}
                change={metrics.creditQuality?.change || 0.8}
                icon={DollarSign}
                trend={metrics.creditQuality?.change > 0 ? "up" : "down"}
                status={metrics.creditQuality?.status || "healthy"}
              />
            </>
          )}
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
                {alertsLoading ? (
                  // Loading skeletons for alerts
                  Array.from({ length: loadingConfig.skeletonCount.alerts }).map((_, i) => (
                    <div key={i} className="p-4 rounded-lg border bg-card">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))
                ) : (
                  alerts.slice(0, 3).map((alert) => (
                    <RiskAlert
                      key={alert._id}
                      level={alert.severity === "critical" ? "high" : alert.severity as "low" | "medium" | "high"}
                      message={alert.title}
                      timestamp={new Date(alert.triggeredAt).toLocaleString()}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Risk Analytics */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Brain className="h-6 w-6 text-accent" />
                <h2 className="text-2xl font-bold text-foreground">
                  Risk Analytics & Insights
                </h2>
              </div>
              <div className="space-y-4">
                {aiLoading ? (
                  // Loading skeletons for AI insights
                  Array.from({ length: loadingConfig.skeletonCount.insights }).map((_, i) => (
                    <div key={i} className="p-5 rounded-lg border bg-card">
                      <div className="flex items-start gap-4">
                        <Skeleton className="w-11 h-11 rounded-lg" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-48 mb-2" />
                          <Skeleton className="h-4 w-full mb-3" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  insights.slice(0, 3).map((insight) => (
                    <AIInsightCard
                      key={insight.id}
                      title={insight.title}
                      description={insight.description}
                      confidence={insight.confidence}
                      category={insight.category}
                    />
                  ))
                )}
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
