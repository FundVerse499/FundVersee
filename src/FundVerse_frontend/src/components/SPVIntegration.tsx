import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign,
  Plus,
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { useCanisters } from '../contexts/CanisterContext';
import type { SPVDealInfo, DealTerms } from '../types';
import { handleICError } from '../lib/ic';

interface SPVIntegrationProps {
  campaignId: bigint;
  className?: string;
}

const SPVIntegration: React.FC<SPVIntegrationProps> = ({ 
  campaignId, 
  className = '' 
}) => {
  const { backendActor, controllerActor } = useCanisters();
  const [spvDeal, setSpvDeal] = useState<SPVDealInfo | null>(null);
  const [dealTerms, setDealTerms] = useState<DealTerms | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state for creating SPV deal
  const [formData, setFormData] = useState({
    equity_percent: 10,
    total_raise: 100000,
    fraction_price: 1000
  });

  const fetchSPVData = async () => {
    if (!backendActor) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching SPV data for campaign:', campaignId);
      
      // Get SPV deal info from backend
      const dealInfo = await backendActor.get_spv_deal_info(campaignId);
      if (dealInfo[0]) {
        setSpvDeal(dealInfo[0]);
        console.log('SPV deal info fetched:', dealInfo[0]);
        
        // If we have a deal ID, try to get deal terms from controller
        if (controllerActor && dealInfo[0].deal_id) {
          try {
            const deals = await controllerActor.list_deals();
            const deal = deals.find((d: [bigint, DealTerms]) => d[0] === dealInfo[0].deal_id);
            if (deal) {
              setDealTerms(deal[1]);
              console.log('Deal terms fetched:', deal[1]);
            }
          } catch (e) {
            console.log('Could not fetch deal terms:', e);
          }
        }
      } else {
        setSpvDeal(null);
        setDealTerms(null);
      }
    } catch (error) {
      console.error('Error fetching SPV data:', error);
      const icError = handleICError(error);
      setError(icError.message);
    } finally {
      setLoading(false);
    }
  };

  const createSPVDeal = async () => {
    if (!backendActor) return;

    try {
      setCreating(true);
      setError(null);
      console.log('Creating SPV deal for campaign:', campaignId);
      
      const result = await backendActor.create_spv_deal(
        campaignId,
        formData.equity_percent,
        BigInt(formData.total_raise),
        BigInt(formData.fraction_price)
      );

      if ('Ok' in result) {
        console.log('SPV deal created successfully:', result.Ok);
        setShowCreateForm(false);
        await fetchSPVData(); // Refresh data
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Error creating SPV deal:', error);
      const icError = handleICError(error);
      setError(icError.message);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchSPVData();
  }, [campaignId, backendActor, controllerActor]);

  const formatAmount = (amount: bigint): string => {
    const num = Number(amount);
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <Card className={`bg-black/20 border-white/10 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
            <span className="text-white/70">Loading SPV data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-black/20 border-white/10 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-green-400" />
            <span>SPV Investment</span>
          </CardTitle>
          <Button
            onClick={fetchSPVData}
            variant="ghost"
            size="sm"
            className="text-white/70 hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-red-400">
              <Info className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}

        {!spvDeal ? (
          <div className="text-center space-y-4">
            <Building2 className="h-12 w-12 mx-auto text-white/40" />
            <div>
              <h3 className="text-white font-medium mb-2">No SPV Deal Available</h3>
              <p className="text-white/70 text-sm mb-4">
                Create an SPV deal to enable equity investments for this campaign.
              </p>
            </div>
            
            {!showCreateForm ? (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create SPV Deal
              </Button>
            ) : (
              <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-white font-medium">Create SPV Deal</h4>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="equity_percent" className="text-white/70 text-sm">
                      Equity Percentage
                    </Label>
                    <Input
                      id="equity_percent"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.equity_percent}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        equity_percent: parseInt(e.target.value) || 0
                      }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="total_raise" className="text-white/70 text-sm">
                      Total Raise Amount
                    </Label>
                    <Input
                      id="total_raise"
                      type="number"
                      min="1000"
                      value={formData.total_raise}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        total_raise: parseInt(e.target.value) || 0
                      }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fraction_price" className="text-white/70 text-sm">
                      Fraction Price
                    </Label>
                    <Input
                      id="fraction_price"
                      type="number"
                      min="1"
                      value={formData.fraction_price}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        fraction_price: parseInt(e.target.value) || 0
                      }))}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    onClick={createSPVDeal}
                    disabled={creating}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {creating ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {creating ? 'Creating...' : 'Create Deal'}
                  </Button>
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                SPV Deal Active
              </Badge>
              <span className="text-white/70 text-sm">
                Deal ID: {spvDeal.deal_id.toString()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-white/70 text-sm">Equity Offered</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {spvDeal.equity_percent}%
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <span className="text-white/70 text-sm">Total Raise</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  ${formatAmount(spvDeal.total_raise)}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-green-400" />
                  <span className="text-white/70 text-sm">Fraction Price</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  ${formatAmount(spvDeal.fraction_price)}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-green-400" />
                  <span className="text-white/70 text-sm">Status</span>
                </div>
                <div className="text-2xl font-bold text-white">
                  {spvDeal.spv_canister.length > 0 ? 'Deployed' : 'Pending'}
                </div>
              </div>
            </div>

            {dealTerms && (
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-white font-medium mb-2">Deal Details</h4>
                <div className="text-white/70 text-sm space-y-1">
                  <p>Startup ID: {dealTerms.startup_id}</p>
                  <p>SPV Canister: {dealTerms.spv_canister.length > 0 ? 'Connected' : 'Not Set'}</p>
                  <p>Token Canister: {dealTerms.spv_token_canister.length > 0 ? 'Connected' : 'Not Set'}</p>
                </div>
              </div>
            )}

            <div className="pt-4">
              <Button
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                disabled={spvDeal.spv_canister.length === 0}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Invest in SPV
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SPVIntegration;
