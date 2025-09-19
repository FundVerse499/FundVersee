import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import { motion } from "framer-motion";
import {
  createFundVerseBackendActor,
  createFundFlowActor,
  copyToClipboard,
  formatPrincipal,
  handleICError,
  type FundVerseBackendService,
  type FundFlowService
} from "./lib/ic";
import type { ActorSubclass } from "@dfinity/agent";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { CanisterProvider, useCanisters } from "./contexts/CanisterContext";
import CampaignCardComponent from "./components/CampaignCard";
import CampaignDetails from "./components/CampaignDetails";
import Dashboard from "./components/Dashboard";
import CreateProjectWizard from "./components/CreateProjectWizard";
import ContributionDialog from "./components/ContributionDialog";
import LandingPage from "./components/LandingPage";
import UnifiedFundingDisplay from "./components/UnifiedFundingDisplay";
import SPVIntegration from "./components/SPVIntegration";
import PaymentMethods from "./components/PaymentMethods";
import AdminPanel from "./components/AdminPanel";
import type { CampaignCard } from "./types";

import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import {
  Copy,
  CheckCircle,
  Plus,
  TrendingUp,
  Users,
  Target,
  Clock,
  Wallet,
  Activity,
  Settings,
  LogOut,
  User,
  Menu,
  X,
  Building2
} from "lucide-react";

// Types for campaign data (imported from types/index.ts)

interface CampaignWithDetails {
  campaign: CampaignCard;
  details: {
    id: bigint;
    title: string;
    description: string;
    funding_goal: bigint;
    current_funding: bigint;
    legal_entity: string;
    status: [] | [string];
    contact_info: string;
    category: string;
    business_registration: number;
    created_at: bigint;
    updated_at: bigint;
    doc_ids: bigint[];
    amount_raised: bigint;
    goal: bigint;
    end_date: bigint;
  };
}

interface Contribution {
  id: bigint;
  campaign_id: bigint;
  backer: Principal;
  amount: bigint;
  method: { ICP: null } | { BankTransfer: null } | { Fawry: null } | { PayMob: null } | { Other: string };
  status: { Pending: null } | { Held: null } | { Released: null } | { Refunded: null };
  created_at_ns: bigint;
  confirmed_at_ns: [] | [bigint];
  icp_transfer_id: [] | [bigint];
}

function AppContent() {
  const { isAuthenticated, user, identity, login, logout, loading } = useAuth();
  const { adminActor } = useCanisters();
  const [copied, setCopied] = useState(false);

  // Actor instances
  const [backendActor, setBackendActor] = useState<ActorSubclass<FundVerseBackendService> | null>(null);
  const [fundFlowActor, setFundFlowActor] = useState<ActorSubclass<FundFlowService> | null>(null);

  // Data state
  const [campaigns, setCampaigns] = useState<CampaignCard[]>([]);
  const [userContributions, setUserContributions] = useState<Contribution[]>([]);
  const [appLoading, setAppLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // UI state
const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'contributions' | 'spv' | 'admin' | ''>('');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showContributeDialog, setShowContributeDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignCard | null>(null);
  const [showLandingPage, setShowLandingPage] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Initialize actors when authenticated
  useEffect(() => {
    if (isAuthenticated && identity) {
      console.log("Auth state changed - initializing actors...");
      initializeActors();
    } else if (!isAuthenticated) {
      console.log("User not authenticated, clearing actors");
      setBackendActor(null);
      setFundFlowActor(null);
      setAppLoading(false);
    }
  }, [isAuthenticated, identity]);

  const initializeActors = async () => {
    try {
      setAppLoading(true);
      setError(null);
      console.log("Initializing actors...");

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error("Actor initialization timed out after 10 seconds");
        setAppLoading(false);
        setError("Connection timeout. Please refresh the page.");
      }, 10000);

      const backend = await createFundVerseBackendActor();
      const fundFlow = await createFundFlowActor();

      setBackendActor(backend);
      setFundFlowActor(fundFlow);

      console.log("Actors initialized successfully");

      // Load initial data
      await Promise.all([
        fetchCampaigns(backend),
        fetchUserContributions(fundFlow),
        checkAdminStatus()
      ]);

      clearTimeout(timeoutId);
    } catch (error) {
      console.error("Actor initialization error:", error);
      setError("Failed to connect to backend services");
    } finally {
      setAppLoading(false);
    }
  };



  // Authentication functions
  const handleLogin = async () => {
    try {
      console.log("Starting login process...");
      await login();
      console.log("Login completed");
    } catch (error) {
      console.error("Login error:", error);
      setError("Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      console.log("Starting logout process...");
      logout();
      setBackendActor(null);
      setFundFlowActor(null);
      setCampaigns([]);
      setUserContributions([]);
      setError(null);
      console.log("Logout completed");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Data fetching functions
  const fetchCampaigns = async (actor = backendActor) => {
    if (!actor) return;

    try {
      console.log("Fetching campaigns...");
      const fetchedCampaigns = await actor.get_campaign_cards();
      setCampaigns(fetchedCampaigns);
      console.log("Campaigns fetched:", fetchedCampaigns.length);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      const icError = handleICError(error);
      setError(icError.message);
    }
  };

  const fetchUserContributions = async (actor = fundFlowActor) => {
    if (!actor || !identity) return;

    try {
      console.log("Fetching user contributions...");
      const contributions = await actor.get_contributions_by_user([identity.getPrincipal()]);
      setUserContributions(contributions);
      console.log("Contributions fetched:", contributions.length);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      const icError = handleICError(error);
      setError(icError.message);
    }
  };

  const checkAdminStatus = async () => {
    if (!identity || !adminActor) return;
    
    try {
      // Check if user has admin role using the Admin canister
      const role = await adminActor.get_my_role();
      setIsAdmin(role.Admin !== null);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  // Campaign management functions
  const createCampaign = async (ideaData: {
    title: string;
    description: string;
    fundingGoal: bigint;
    category: string;
    legalEntity: string;
    contactInfo: string;
    businessRegistration: number;
  }) => {
    if (!backendActor) throw new Error("Backend not initialized");

    try {
      console.log("Creating campaign with data:", ideaData);

      // Create campaign (now includes all idea data)
      const endDate = BigInt(Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60); // 30 days from now
      const campaignId = await backendActor.create_campaign(
        ideaData.title,
        ideaData.description,
        ideaData.fundingGoal,
        ideaData.legalEntity,
        ideaData.contactInfo,
        ideaData.category,
        ideaData.businessRegistration,
        ideaData.fundingGoal, // goal parameter
        endDate // end_date parameter
      );

      console.log("Campaign created successfully with ID:", campaignId);
      await fetchCampaigns();
      return campaignId;
    } catch (error) {
      console.error("Error creating campaign:", error);
      const icError = handleICError(error);
      throw icError;
    }
  };

  const contributeToCampaign = async (campaignId: bigint, amount: bigint) => {
    if (!fundFlowActor || !identity) throw new Error("Not authenticated");

    try {
      console.log("Contributing to campaign:", campaignId, "amount:", amount);

      const result = await fundFlowActor.contribute_icp(identity.getPrincipal(), campaignId, amount);

      if ('Ok' in result) {
        console.log("Contribution successful, ID:", result.Ok);

        // Update backend with contribution
        if (backendActor) {
          await backendActor.receive_icp_contribution(campaignId, amount);
        }

        // Refresh data
        await Promise.all([
          fetchCampaigns(),
          fetchUserContributions()
        ]);

        return result.Ok;
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error("Error contributing to campaign:", error);
      const icError = handleICError(error);
      throw icError;
    }
  };

  const getCampaignDetails = async (campaignId: bigint): Promise<CampaignWithDetails | null> => {
    if (!backendActor) return null;

    try {
      console.log("Fetching campaign details for ID:", campaignId);
      const result = await backendActor.get_campaign_with_details(campaignId);
      return result[0] || null;
    } catch (error) {
      console.error("Error fetching campaign details:", error);
      const icError = handleICError(error);
      setError(icError.message);
      return null;
    }
  };

  const getCampaignContributions = async (campaignId: bigint): Promise<Contribution[]> => {
    if (!fundFlowActor) return [];

    try {
      console.log("Fetching contributions for campaign:", campaignId);
      return await fundFlowActor.get_campaign_contributions(campaignId);
    } catch (error) {
      console.error("Error fetching campaign contributions:", error);
      return [];
    }
  };

  // Utility functions
  const copyPrincipal = async () => {
    if (identity) {
      const success = await copyToClipboard(identity.getPrincipal().toString());
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleContribute = (campaignId: bigint) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      setSelectedCampaign(campaign);
      setShowContributeDialog(true);
    }
  };

  const handleCreateProject = () => {
    setShowLandingPage(false);
    setShowCreateDialog(true);
  };

  const handleExploreCampaigns = () => {
    setShowLandingPage(false);
    setActiveTab('campaigns');
  };

  // Loading state
  if (loading || appLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="text-white text-lg">Loading FundVerse...</p>
          <p className="text-white/60 text-sm">Auth: {loading ? 'Loading' : 'Ready'} | App: {appLoading ? 'Loading' : 'Ready'}</p>
          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 max-w-md">
              <p className="text-red-400 text-sm">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
                className="mt-2 text-red-400 border-red-400/30 hover:bg-red-500/20"
              >
                Refresh Page
              </Button>
            </div>
          )}
          {appLoading && (
            <Button
              onClick={() => {
                console.log("Manual stop loading triggered");
                setAppLoading(false);
                setError("Loading stopped manually");
              }}
              variant="outline"
              size="sm"
              className="mt-4 text-yellow-400 border-yellow-400/30 hover:bg-yellow-500/20"
            >
              Stop Loading
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
        
        {/* Header */}
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  FundVerse
                </h1>
                {isAuthenticated && (
                  <div className="hidden md:flex space-x-1">
                    <Button
                      variant={showLandingPage ? "default" : "ghost"}
                      size="sm"
                      onClick={() => {
                        setShowLandingPage(true);
                        setActiveTab('');
                      }}
                      className="text-white hover:bg-white/10"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Home
                    </Button>

                    <Button
                      variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        setShowLandingPage(false);
                        setActiveTab('dashboard');
                      }}
                      className="text-white hover:bg-white/10"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                    <Button
                      variant={activeTab === 'campaigns' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        setShowLandingPage(false);
                        setActiveTab('campaigns');
                      }}
                      className="text-white hover:bg-white/10"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Campaigns
                    </Button>
                    <Button
                      variant={activeTab === 'contributions' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        setShowLandingPage(false);
                        setActiveTab('contributions');
                      }}
                      className="text-white hover:bg-white/10"
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      My Contributions
                    </Button>
                    <Button
                      variant={activeTab === 'spv' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => {
                        setShowLandingPage(false);
                        setActiveTab('spv');
                      }}
                      className="text-white hover:bg-white/10"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      SPV Investments
                    </Button>
                    {isAdmin && (
                      <Button
                        variant={activeTab === 'admin' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => {
                          setShowLandingPage(false);
                          setActiveTab('admin');
                        }}
                        className="text-white hover:bg-white/10"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Admin
                      </Button>
                    )}

                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {isAuthenticated ? (
                  <>
                    <div className="hidden md:flex items-center space-x-2">
                      <User className="h-4 w-4 text-purple-400" />
                      <span className="text-sm text-white/80">
                        {identity ? formatPrincipal(identity.getPrincipal()) : 'Loading...'}
                      </span>

                      <Button onClick={copyPrincipal} variant="ghost" size="sm" className="text-white hover:bg-white/10">
                        {copied ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <Button onClick={handleLogout} variant="outline" size="sm" className="text-white border-white/20 hover:bg-white/10">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                    <Button
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                      variant="ghost"
                      size="sm"
                      className="md:hidden text-white hover:bg-white/10"
                    >
                      {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </Button>
                  </>
                ) : (
                  <Button onClick={handleLogin} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Connect Internet Identity
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Menu */}
        {isAuthenticated && showMobileMenu && (
          <div className="md:hidden border-b border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4">
              <div className="space-y-2">
                <Button
                  variant={showLandingPage ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setShowLandingPage(true);
                    setActiveTab('');
                    setShowMobileMenu(false);
                  }}
                  className="w-full justify-start text-white hover:bg-white/10"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Home
                </Button>
                <Button
                  variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setShowLandingPage(false);
                    setActiveTab('dashboard');
                    setShowMobileMenu(false);
                  }}
                  className="w-full justify-start text-white hover:bg-white/10"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
                <Button
                  variant={activeTab === 'campaigns' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setShowLandingPage(false);
                    setActiveTab('campaigns');
                    setShowMobileMenu(false);
                  }}
                  className="w-full justify-start text-white hover:bg-white/10"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Campaigns
                </Button>
                <Button
                  variant={activeTab === 'contributions' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setShowLandingPage(false);
                    setActiveTab('contributions');
                    setShowMobileMenu(false);
                  }}
                  className="w-full justify-start text-white hover:bg-white/10"
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  My Contributions
                </Button>
                <Button
                  variant={activeTab === 'spv' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setShowLandingPage(false);
                    setActiveTab('spv');
                    setShowMobileMenu(false);
                  }}
                  className="w-full justify-start text-white hover:bg-white/10"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  SPV Investments
                </Button>
                {isAdmin && (
                  <Button
                    variant={activeTab === 'admin' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      setShowLandingPage(false);
                      setActiveTab('admin');
                      setShowMobileMenu(false);
                    }}
                    className="w-full justify-start text-white hover:bg-white/10"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                )}
                <div className="pt-2 border-t border-white/10">
                  <div className="flex items-center space-x-2 text-sm text-white/80 mb-2">
                    <User className="h-4 w-4 text-purple-400" />
                    <span>{identity ? formatPrincipal(identity.getPrincipal()) : 'Loading...'}</span>
                  </div>
                  <Button
                    onClick={copyPrincipal}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-white hover:bg-white/10"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy Principal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {/* Error Display */}
          {error && (
            <Card className="mb-6 border-red-500/20 bg-red-500/10">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-400">
                  <span className="text-sm font-medium">{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                    className="text-red-400 hover:bg-red-500/20"
                  >
                    ×
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Authentication Required */}
          {!isAuthenticated ? (
            <div className="text-center py-20">
              <Card className="max-w-md mx-auto bg-black/20 border-white/10">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Welcome to FundVerse</CardTitle>
                  <CardDescription className="text-white/70">
                    Connect your Internet Identity to start funding and creating campaigns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleLogin}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    size="lg"
                  >
                    <User className="h-5 w-5 mr-2" />
                    Connect Internet Identity
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : showLandingPage ? (
            <LandingPage
              onCreateProject={handleCreateProject}
              onExploreCampaigns={handleExploreCampaigns}
            />
          ) : (
            <>
              {/* Action Buttons */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-4">
                  <h2 className="text-2xl font-bold text-white">
                    {activeTab === 'dashboard' && 'Dashboard'}
                    {activeTab === 'campaigns' && 'All Campaigns'}
                    {activeTab === 'contributions' && 'My Contributions'}
                    {activeTab === 'spv' && 'SPV Investments'}
                    {activeTab === 'admin' && 'Admin Panel'}
                  </h2>
                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                    {campaigns.length} campaigns
                  </Badge>
                </div>

                {activeTab === 'campaigns' && (
                  <Button
                    onClick={handleCreateProject}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                )}
              </div>

              {/* Content based on active tab */}
              {activeTab === 'dashboard' && (
                <Dashboard campaigns={campaigns} />
              )}

              {activeTab === 'campaigns' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaigns.map((campaign) => (
                    <CampaignCardComponent
                      key={campaign.id.toString()}
                      campaign={campaign}
                      fundFlowActor={fundFlowActor}
                      backendActor={backendActor}
                      onContribute={handleContribute}
                    />
                  ))}
                </div>
              )}

              {activeTab === 'contributions' && (
                <div className="space-y-4">
                  {userContributions.length === 0 ? (
                    <Card className="bg-black/20 border-white/10">
                      <CardContent className="pt-6 text-center">
                        <Wallet className="h-12 w-12 mx-auto text-white/40 mb-4" />
                        <p className="text-white/70">No contributions yet. Start supporting campaigns!</p>
                      </CardContent>
                    </Card>
                  ) : (
                    userContributions.map((contribution) => (
                      <Card key={contribution.id.toString()} className="bg-black/20 border-white/10">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-medium">Campaign #{contribution.campaign_id.toString()}</p>
                              <p className="text-white/70 text-sm">
                                Amount: {(Number(contribution.amount) / 100_000_000).toFixed(4)} ICP
                              </p>
                            </div>
                            <Badge
                              variant={
                                'Released' in contribution.status ? 'default' :
                                  'Held' in contribution.status ? 'secondary' :
                                    'Pending' in contribution.status ? 'outline' : 'destructive'
                              }
                            >
                              {Object.keys(contribution.status)[0]}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'spv' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PaymentMethods />
                    <div className="space-y-4">
                      <h3 className="text-white font-medium">SPV Investments</h3>
                      <Card className="bg-black/20 border-white/10">
                        <CardContent className="pt-6 text-center">
                          <Building2 className="h-12 w-12 mx-auto text-white/40 mb-4" />
                          <h4 className="text-white font-medium mb-2">SPV Investment Management</h4>
                          <p className="text-white/70 text-sm mb-4">
                            Manage your equity investments and SPV deals. Create SPV deals for campaigns to enable equity-based funding.
                          </p>
                          <p className="text-white/60 text-xs">
                            SPV deals can be created from individual campaign pages.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'admin' && (
                <div className="space-y-6">
                  <AdminPanel />
                </div>
              )}


            </>
          )}
        </main>

        {/* Dialogs */}
        {showCreateDialog && backendActor && (
          <CreateProjectWizard
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            backendActor={backendActor as any}
            onProjectCreated={() => {
              setShowCreateDialog(false);
              fetchCampaigns();
            }}
          />
        )}

        {showContributeDialog && selectedCampaign && fundFlowActor && backendActor && (
          <ContributionDialog
            open={showContributeDialog}
            onOpenChange={setShowContributeDialog}
            campaignId={selectedCampaign.id}
            campaignTitle={selectedCampaign.title}
            fundFlowActor={fundFlowActor}
            backendActor={backendActor}
            onContributionSuccess={() => {
              setShowContributeDialog(false);
              fetchCampaigns();
              fetchUserContributions();
            }}
          />
        )}

        {/* Routes for detailed views */}
        <Routes>
          <Route
            path="/campaign/:id"
            element={
              <CampaignDetails />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <CanisterProvider>
        <AppContent />
      </CanisterProvider>
    </AuthProvider>
  );
}

export default App;
