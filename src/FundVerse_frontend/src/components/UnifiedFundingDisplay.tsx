import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  Coins, 
  CreditCard, 
  Building2, 
  Target,
  RefreshCw,
  Info
} from 'lucide-react';
import { useCanisters } from '../contexts/CanisterContext';
import type { UnifiedFunding } from '../types';
import { handleICError } from '../lib/ic';

interface UnifiedFundingDisplayProps {
  campaignId: bigint;
  className?: string;
}

const UnifiedFundingDisplay: React.FC<UnifiedFundingDisplayProps> = ({ 
  campaignId, 
  className = '' 
}) => {
  const { backendActor } = useCanisters();
  const [funding, setFunding] = useState<UnifiedFunding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFunding = async () => {
    if (!backendActor) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching unified funding for campaign:', campaignId);
      
      const result = await backendActor.get_unified_funding(campaignId);
      if (result[0]) {
        setFunding(result[0]);
        console.log('Unified funding fetched:', result[0]);
      } else {
        setError('Campaign not found');
      }
    } catch (error) {
      console.error('Error fetching unified funding:', error);
      const icError = handleICError(error);
      setError(icError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunding();
  }, [campaignId, backendActor]);

  if (loading) {
    return (
      <Card className={`bg-black/20 border-white/10 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
            <span className="text-white/70">Loading funding data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`bg-red-500/10 border-red-500/20 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-400">
            <Info className="h-4 w-4" />
            <span className="text-sm">{error}</span>
            <Button
              onClick={fetchFunding}
              variant="ghost"
              size="sm"
              className="text-red-400 hover:bg-red-500/20"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!funding) {
    return (
      <Card className={`bg-black/20 border-white/10 ${className}`}>
        <CardContent className="pt-6">
          <div className="text-center text-white/70">
            <Target className="h-8 w-8 mx-auto mb-2 text-white/40" />
            <p>No funding data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatAmount = (amount: bigint): string => {
    const num = Number(amount);
    if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(2)}B`;
    } else if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }
    return num.toString();
  };

  const formatICP = (amount: bigint): string => {
    return `${(Number(amount) / 100_000_000).toFixed(4)} ICP`;
  };

  const progressPercentage = funding.total_goal > 0 
    ? Math.min((Number(funding.total_raised) / Number(funding.total_goal)) * 100, 100)
    : 0;

  const fundingMethods = [
    {
      name: 'ICP',
      amount: funding.icp_raised,
      icon: Coins,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    {
      name: 'Traditional',
      amount: funding.traditional_raised,
      icon: CreditCard,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      name: 'SPV',
      amount: funding.spv_raised,
      icon: Building2,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    }
  ];

  return (
    <Card className={`bg-black/20 border-white/10 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-purple-400" />
            <span>Funding Overview</span>
          </CardTitle>
          <Button
            onClick={fetchFunding}
            variant="ghost"
            size="sm"
            className="text-white/70 hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Progress */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/70 text-sm">Total Progress</span>
            <span className="text-white font-medium">
              {formatAmount(funding.total_raised)} / {formatAmount(funding.total_goal)}
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-white/10"
          />
          <div className="text-center">
            <span className="text-2xl font-bold text-white">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Funding Methods Breakdown */}
        <div className="space-y-3">
          <h4 className="text-white/70 text-sm font-medium">Funding Methods</h4>
          <div className="grid grid-cols-1 gap-3">
            {fundingMethods.map((method) => (
              <div
                key={method.name}
                className={`flex items-center justify-between p-3 rounded-lg border ${method.bgColor} ${method.borderColor}`}
              >
                <div className="flex items-center space-x-3">
                  <method.icon className={`h-4 w-4 ${method.color}`} />
                  <span className="text-white font-medium">{method.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">
                    {method.name === 'ICP' ? formatICP(method.amount) : formatAmount(method.amount)}
                  </div>
                  <div className="text-white/60 text-xs">
                    {funding.total_raised > 0 
                      ? `${((Number(method.amount) / Number(funding.total_raised)) * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <Badge 
            variant={progressPercentage >= 100 ? "default" : progressPercentage >= 50 ? "secondary" : "outline"}
            className={
              progressPercentage >= 100 
                ? "bg-green-500/20 text-green-400 border-green-500/30"
                : progressPercentage >= 50
                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                : "bg-white/10 text-white/70 border-white/20"
            }
          >
            {progressPercentage >= 100 ? 'Fully Funded' : 
             progressPercentage >= 50 ? 'Well Funded' : 
             'Needs Funding'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedFundingDisplay;
