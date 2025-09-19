import { Principal } from '@dfinity/principal';

// Unified Funding Types
export interface UnifiedFunding {
  total_goal: bigint;
  icp_raised: bigint;
  traditional_raised: bigint;
  spv_raised: bigint;
  total_raised: bigint;
}

// SPV Types
export interface SPVDealInfo {
  deal_id: bigint;
  campaign_id: bigint;
  equity_percent: number;
  total_raise: bigint;
  fraction_price: bigint;
  spv_canister: [] | [Principal];
  spv_token_canister: [] | [Principal];
}

export interface DealTerms {
  startup_id: string;
  equity_percent: number;
  total_raise: bigint;
  fraction_price: bigint;
  spv_canister: [] | [Principal];
  spv_token_canister: [] | [Principal];
  payment_gateway_canister: [] | [Principal];
}

// Payment Gateway Types
export interface PaymentMethodDetail {
  id: bigint;
  owner: Principal;
  method_type: string;
  provider: string;
  masked_account: string;
  currency: string;
  is_active: boolean;
  created_at_ns: bigint;
}

export interface PaymentVerification {
  payment_id: bigint;
  spv_id: bigint;
  deal_id: bigint;
  investor: Principal;
  amount: bigint;
  payment_method_id: bigint;
  status: 'Pending' | 'Completed' | 'Failed';
  created_at_ns: bigint;
  completed_at_ns: [] | [bigint];
}

// SPV Token Types
export interface InvestmentCertificate {
  token_id: bigint;
  owner: Principal;
  spv_id: bigint;
  deal_id: bigint;
  investment_amount: bigint;
  fractions: bigint;
  created_at: bigint;
  is_transferable: boolean;
}

export interface CertificateMetadata {
  name: string;
  description: string;
  image_url: string;
  attributes: Array<[string, string]>;
}

// Campaign Types (Enhanced)
export interface CampaignCard {
  id: bigint;
  title: string;
  goal: bigint;
  end_date: bigint;
  category: string;
  days_left: bigint;
  amount_raised: bigint;
  status?: string; // Optional status field for admin panel
}

export interface CampaignWithDetails {
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

export interface CampaignMeta {
  campaign_id: bigint;
  goal: bigint;
  amount_raised: bigint;
  end_date_secs: bigint;
}

// Contribution Types
export interface Contribution {
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

// Document Types
export interface Doc {
  id: bigint;
  campaign_id: bigint;
  name: string;
  content_type: string;
  data: Uint8Array;
  uploaded_at: bigint;
}

export interface UploadChunk {
  doc_id: bigint;
  chunk_index: number;
  data: Uint8Array;
  is_final: boolean;
}

// Campaign Status Types
export type CampaignStatus = 'Active' | 'Ended';

// Funding Method Types
export type FundingMethod = 'ICP' | 'Traditional' | 'SPV' | 'All';

// Admin Types
export interface AdminAction {
  type: 'approve' | 'reject' | 'review';
  campaign_id: bigint;
  reason?: string;
  timestamp: bigint;
}

// User Profile Types
export interface UserProfile {
  principal: Principal;
  name?: string;
  email?: string;
  registered_at?: bigint;
  total_contributions: bigint;
  total_campaigns: bigint;
  total_investments: bigint;
}

// Dashboard Statistics
export interface DashboardStats {
  total_campaigns: number;
  active_campaigns: number;
  total_funding: bigint;
  user_contributions: bigint;
  user_campaigns: number;
  user_investments: number;
}

// Form Data Types
export interface CreateCampaignData {
  title: string;
  description: string;
  fundingGoal: bigint;
  category: string;
  legalEntity: string;
  contactInfo: string;
  businessRegistration: number;
}

export interface CreateSPVDealData {
  campaign_id: bigint;
  equity_percent: number;
  total_raise: bigint;
  fraction_price: bigint;
}

export interface ContributionData {
  campaign_id: bigint;
  amount: bigint;
  method: FundingMethod;
  payment_method_id?: bigint;
}

// Error Types
export interface ICError {
  message: string;
  code?: string;
  details?: any;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ICError;
}

// Component Props Types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ActorProps {
  backendActor?: any;
  fundFlowActor?: any;
  controllerActor?: any;
  spvActor?: any;
  spvTokenActor?: any;
  paymentGatewayActor?: any;
  adminActor?: any;
}

// Navigation Types
export type TabType = 'dashboard' | 'campaigns' | 'contributions' | 'spv' | 'admin' | '';

export interface NavigationItem {
  id: TabType;
  label: string;
  icon: string;
  path: string;
  requiresAuth: boolean;
  adminOnly?: boolean;
}
