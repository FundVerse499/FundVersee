import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock,
  RefreshCw,
  Info,
  Users,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useCanisters } from '../contexts/CanisterContext';
import type { CampaignCard } from '../types';
import { handleICError } from '../lib/ic';

interface AdminPanelProps {
  className?: string;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ className = '' }) => {
  const { backendActor, adminActor } = useCanisters();
  const [campaigns, setCampaigns] = useState<CampaignCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<Set<bigint>>(new Set());

  const fetchCampaigns = async () => {
    if (!backendActor) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching campaigns for admin review...');
      
      const fetchedCampaigns = await backendActor.get_campaign_cards();
      setCampaigns(fetchedCampaigns);
      console.log('Campaigns fetched for admin:', fetchedCampaigns.length);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      const icError = handleICError(error);
      setError(icError.message);
    } finally {
      setLoading(false);
    }
  };

  const getCampaignStatus = async (campaignId: bigint): Promise<string | null> => {
    if (!backendActor) return null;

    try {
      const result = await backendActor.get_campaign_approval_status(campaignId);
      return result[0] || null;
    } catch (error) {
      console.error('Error fetching campaign status:', error);
      return null;
    }
  };

  const approveCampaign = async (campaignId: bigint) => {
    if (!backendActor) return;

    try {
      setProcessing(prev => new Set(prev).add(campaignId));
      setError(null);
      console.log('Approving campaign:', campaignId);
      
      const result = await backendActor.approve_campaign(campaignId);
      if ('Ok' in result) {
        console.log('Campaign approved successfully');
        await fetchCampaigns(); // Refresh data
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Error approving campaign:', error);
      const icError = handleICError(error);
      setError(icError.message);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(campaignId);
        return newSet;
      });
    }
  };

  const submitForApproval = async (campaignId: bigint) => {
    if (!backendActor) return;

    try {
      setProcessing(prev => new Set(prev).add(campaignId));
      setError(null);
      console.log('Submitting campaign for approval:', campaignId);
      
      const result = await backendActor.submit_campaign_for_approval(campaignId);
      if ('Ok' in result) {
        console.log('Campaign submitted for approval successfully');
        await fetchCampaigns(); // Refresh data
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Error submitting campaign for approval:', error);
      const icError = handleICError(error);
      setError(icError.message);
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(campaignId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [backendActor]);

  const formatAmount = (amount: bigint): string => {
    const num = Number(amount);
    if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(2)}M`;
    } else if (num >= 1_000) {
      return `${(num / 1_000).toFixed(2)}K`;
    }
    return num.toString();
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'pending_approval':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <Card className={`bg-black/20 border-white/10 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
            <span className="text-white/70">Loading admin data...</span>
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
            <Shield className="h-5 w-5 text-purple-400" />
            <span>Admin Panel</span>
          </CardTitle>
          <Button
            onClick={fetchCampaigns}
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

        {/* Admin Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-400" />
              <span className="text-white/70 text-sm">Total Campaigns</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {campaigns.length}
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span className="text-white/70 text-sm">Approved</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {campaigns.filter(c => c.status === 'approved').length}
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-white/70 text-sm">Pending</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {campaigns.filter(c => c.status === 'pending_approval').length}
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="space-y-3">
          <h4 className="text-white font-medium">Campaign Review</h4>
          
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-white/40 mb-4" />
              <h3 className="text-white font-medium mb-2">No Campaigns</h3>
              <p className="text-white/70 text-sm">
                No campaigns available for review.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id.toString()}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h5 className="text-white font-medium">{campaign.title}</h5>
                      {getStatusBadge(campaign.status || null)}
                    </div>
                    <div className="flex items-center space-x-4 text-white/70 text-sm">
                      <span>ID: {campaign.id.toString()}</span>
                      <span>Goal: ${formatAmount(campaign.goal)}</span>
                      <span>Raised: ${formatAmount(campaign.amount_raised)}</span>
                      <span>Category: {campaign.category}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {campaign.status === 'pending_approval' && (
                      <Button
                        onClick={() => approveCampaign(campaign.id)}
                        disabled={processing.has(campaign.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {processing.has(campaign.id) ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    
                    {(!campaign.status || campaign.status === 'draft') && (
                      <Button
                        onClick={() => submitForApproval(campaign.id)}
                        disabled={processing.has(campaign.id)}
                        size="sm"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        {processing.has(campaign.id) ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPanel;
