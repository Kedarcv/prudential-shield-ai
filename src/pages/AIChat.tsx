import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  Shield, 
  FileText,
  Lightbulb,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/hooks/useApi';
import { toast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const AIChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `Hello ${user?.firstName}! I'm your AI Risk Management assistant. I can help you with risk analysis, compliance questions, portfolio insights, and more. What would you like to know about today?`,
      timestamp: new Date(),
      suggestions: [
        "Analyze my portfolio risk exposure",
        "What are the current compliance requirements?",
        "Generate a market risk report",
        "Show me stress testing scenarios"
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickPrompts = [
    {
      icon: TrendingUp,
      title: "Risk Analysis",
      prompt: "Provide a comprehensive risk analysis for my current portfolio"
    },
    {
      icon: Shield,
      title: "Compliance Check",
      prompt: "Check compliance status against current regulatory requirements"
    },
    {
      icon: BarChart3,
      title: "Market Insights",
      prompt: "What are the key market risks I should be aware of today?"
    },
    {
      icon: FileText,
      title: "Generate Report",
      prompt: "Generate a risk assessment report for the last quarter"
    }
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(inputValue),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const generateAIResponse = (userInput: string): string => {
    // Simple response generation based on keywords (replace with actual AI integration)
    const input = userInput.toLowerCase();
    
    if (input.includes('risk') || input.includes('portfolio')) {
      return `Based on your current portfolio analysis, I've identified several key risk factors:

1. **Market Risk**: Your portfolio has a 15% exposure to high-volatility assets
2. **Credit Risk**: 3 positions show elevated credit risk scores
3. **Liquidity Risk**: Current liquidity coverage ratio is 142% (above minimum)

**Recommendations**:
- Consider reducing exposure to high-beta stocks by 5%
- Monitor credit ratings for XYZ Corp and ABC Ltd
- Maintain current liquidity buffer

Would you like me to generate a detailed report or perform stress testing?`;
    }
    
    if (input.includes('compliance')) {
      return `Current compliance status overview:

✅ **Capital Adequacy**: 18.5% (Above minimum 12%)
✅ **Liquidity Coverage**: 142% (Above minimum 100%)
⚠️ **Leverage Ratio**: 5.8% (Monitor - close to threshold)
✅ **Stress Testing**: Last completed 15 days ago

**Action Items**:
- Schedule quarterly stress test review
- Update ICAAP documentation
- Review leverage ratio components

Do you need specific compliance guidance for any regulatory framework?`;
    }
    
    if (input.includes('market')) {
      return `Current market risk assessment:

**Key Risk Factors Today**:
- Increased volatility in tech sector (+23%)
- Central bank policy uncertainty
- Geopolitical tensions affecting energy prices

**Portfolio Impact**:
- VaR (95%): $1.2M (within acceptable limits)
- Expected shortfall: $1.8M
- Beta coefficient: 1.15 vs market

**Recommendations**:
- Monitor position sizing in tech holdings
- Consider hedging strategies for energy exposure
- Review correlation assumptions in risk models

Would you like me to run specific stress scenarios?`;
    }
    
    return `I understand you're asking about "${userInput}". As your AI Risk Management assistant, I can help you with:

- **Risk Analysis**: Portfolio risk assessment, VaR calculations, stress testing
- **Compliance**: Regulatory requirements, reporting obligations, gap analysis
- **Market Intelligence**: Current trends, volatility analysis, correlation studies  
- **Reporting**: Custom reports, executive summaries, regulatory filings

Could you provide more specific details about what you'd like to analyze or learn about?`;
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Message content has been copied.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Risk Assistant</h1>
              <p className="text-muted-foreground">Your intelligent companion for risk management</p>
            </div>
            <div className="ml-auto">
              <Badge variant="outline" className="bg-green-50 border-green-200">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                Online
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickPrompts.map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => handleSuggestionClick(prompt.prompt)}
                  >
                    <prompt.icon className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-left text-sm">{prompt.title}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">AI Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    <span>Risk Analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span>Compliance Guidance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Market Insights</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Report Generation</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            {message.type === 'user' ? (
                              <User className="w-4 h-4" />
                            ) : (
                              <Bot className="w-4 h-4" />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className={`rounded-lg p-4 ${
                          message.type === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <div className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </div>
                          
                          {/* Message Actions */}
                          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/50">
                            <span className="text-xs opacity-70">
                              {message.timestamp.toLocaleTimeString()}
                            </span>
                            {message.type === 'ai' && (
                              <div className="flex gap-1 ml-auto">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0"
                                  onClick={() => copyToClipboard(message.content)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                  <ThumbsUp className="w-3 h-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                  <ThumbsDown className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Suggestions */}
                          {message.suggestions && (
                            <div className="mt-3 space-y-2">
                              {message.suggestions.map((suggestion, index) => (
                                <Button
                                  key={index}
                                  size="sm"
                                  variant="outline"
                                  className="w-full justify-start text-left h-auto p-2 text-xs"
                                  onClick={() => handleSuggestionClick(suggestion)}
                                >
                                  {suggestion}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            <Bot className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span className="text-sm">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </CardContent>

              {/* Input Area */}
              <div className="border-t p-4">
                <div className="flex gap-3">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask me anything about risk management, compliance, or market analysis..."
                    className="resize-none"
                    rows={1}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                    className="px-4"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Press Enter to send • Shift + Enter for new line
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;