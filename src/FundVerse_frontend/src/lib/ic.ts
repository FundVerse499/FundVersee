import type { _SERVICE as FundVerseBackendService } from "../../../declarations/FundVerse_backend/FundVerse_backend.did";
import type { _SERVICE as FundFlowService } from "../../../declarations/Fund_Flow/Fund_Flow.did";
import type { _SERVICE as ControllerService } from "../../../declarations/Controller/Controller.did";
import type { _SERVICE as SPVService } from "../../../declarations/SPV/SPV.did";
import type { _SERVICE as SpvTokenService } from "../../../declarations/Spv_Token/Spv_Token.did";
import type { _SERVICE as PaymentGatewayService } from "../../../declarations/PaymentGateway/PaymentGateway.did";
import type { _SERVICE as AdminService } from "../../../declarations/Admin/Admin.did";
import type { ActorSubclass } from "@dfinity/agent";
import { Actor, HttpAgent } from '@dfinity/agent';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

// Import generated declarations
import { 
  createActor as createFundFlowActorgenerated, 
  canisterId as FUND_FLOW_CANISTER_ID,
  idlFactory as fundFlowIdl 
} from "../../../declarations/Fund_Flow";

import { 
  createActor as createBackendActor,
  canisterId as FUNDVERSE_BACKEND_CANISTER_ID,
  idlFactory as fundVerseBackendIdl 
} from "../../../declarations/FundVerse_backend";

import { 
  createActor as createControllerActorGenerated,
  canisterId as CONTROLLER_CANISTER_ID,
  idlFactory as controllerIdl 
} from "../../../declarations/Controller";

import { 
  createActor as createSPVActorGenerated,
  canisterId as SPV_CANISTER_ID,
  idlFactory as spvIdl 
} from "../../../declarations/SPV";

import { 
  createActor as createSpvTokenActorGenerated,
  canisterId as SPV_TOKEN_CANISTER_ID,
  idlFactory as spvTokenIdl 
} from "../../../declarations/Spv_Token";

import { 
  createActor as createPaymentGatewayActorGenerated,
  canisterId as PAYMENT_GATEWAY_CANISTER_ID,
  idlFactory as paymentGatewayIdl 
} from "../../../declarations/PaymentGateway";

import { 
  createActor as createAdminActorGenerated,
  canisterId as ADMIN_CANISTER_ID,
  idlFactory as adminIdl 
} from "../../../declarations/Admin";

// Environment configuration
const isLocal = process.env.DFX_NETWORK === 'local' || 
                (import.meta as any).env?.DFX_NETWORK === 'local' ||
                window.location.hostname === 'localhost';

const host = isLocal ? 'http://localhost:4943' : 'https://ic0.app';



// Internet Identity configuration
const INTERNET_IDENTITY_URL = isLocal 
  ? `http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943`
  : 'https://identity.ic0.app';

// Global auth client instance
let authClient: AuthClient | null = null;

// Initialize auth client
const getAuthClient = async (): Promise<AuthClient> => {
  if (!authClient) {
    authClient = await AuthClient.create({
      idleOptions: {
        disableIdle: true,
        disableDefaultIdleCallback: true,
      },
    });
  }
  return authClient;
};

// Create HTTP agent with authentication
const createAgent = async (): Promise<HttpAgent> => {
  const client = await getAuthClient();
  const identity = client.getIdentity();
  
  const agent = new HttpAgent({ 
    host, 
    identity,
  });
  
  // Fetch root key for local development
  if (isLocal) {
    try {
      await agent.fetchRootKey();
    } catch (error) {
      console.warn('Failed to fetch root key:', error);
    }
  }
  
  return agent;
};

// Authentication functions
export const login = async (): Promise<boolean> => {
  try {
    const client = await getAuthClient();
    
    return new Promise((resolve, reject) => {
      client.login({
        identityProvider: INTERNET_IDENTITY_URL,
        maxTimeToLive: BigInt(7 * 24 * 60 * 60 * 1000 * 1000 * 1000), // 7 days in nanoseconds
        onSuccess: () => {
          console.log('Login successful');
          resolve(true);
        },
        onError: (error: any) => {
          console.error('Login failed:', error);
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    const client = await getAuthClient();
    await client.logout();
    authClient = null;
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const client = await getAuthClient();
    return await client.isAuthenticated();
  } catch (error) {
    console.error('Authentication check failed:', error);
    return false;
  }
};

export const getIdentity = async () => {
  const client = await getAuthClient();
  return client.getIdentity();
};

export const getPrincipal = async (): Promise<Principal> => {
  const identity = await getIdentity();
  return identity.getPrincipal();
};

// Actor creation functions
export const createFundVerseBackendActor = async (): Promise<ActorSubclass<FundVerseBackendService>> => {
  const agent = await createAgent();
  return createBackendActor(FUNDVERSE_BACKEND_CANISTER_ID, { agent });
};

export const createFundFlowActor = async (): Promise<ActorSubclass<FundFlowService>> => {
  const agent = await createAgent();
  return createFundFlowActorgenerated(FUND_FLOW_CANISTER_ID, { agent });
};

export const createControllerActor = async (): Promise<ActorSubclass<ControllerService>> => {
  const agent = await createAgent();
  return createControllerActorGenerated(CONTROLLER_CANISTER_ID, { agent });
};

export const createSPVActor = async (): Promise<ActorSubclass<SPVService>> => {
  const agent = await createAgent();
  return createSPVActorGenerated(SPV_CANISTER_ID, { agent });
};

export const createSpvTokenActor = async (): Promise<ActorSubclass<SpvTokenService>> => {
  const agent = await createAgent();
  return createSpvTokenActorGenerated(SPV_TOKEN_CANISTER_ID, { agent });
};

export const createPaymentGatewayActor = async (): Promise<ActorSubclass<PaymentGatewayService>> => {
  const agent = await createAgent();
  return createPaymentGatewayActorGenerated(PAYMENT_GATEWAY_CANISTER_ID, { agent });
};

export const createAdminActor = async (): Promise<ActorSubclass<AdminService>> => {
  const agent = await createAgent();
  return createAdminActorGenerated(ADMIN_CANISTER_ID, { agent });
};

// Helper exports for canister IDs
export const FUNDVERSE_BACKEND_CANISTER_ID_STR: string = String(FUNDVERSE_BACKEND_CANISTER_ID);
export const FUND_FLOW_CANISTER_ID_STR: string = String(FUND_FLOW_CANISTER_ID);
export const CONTROLLER_CANISTER_ID_STR: string = String(CONTROLLER_CANISTER_ID);
export const SPV_CANISTER_ID_STR: string = String(SPV_CANISTER_ID);
export const SPV_TOKEN_CANISTER_ID_STR: string = String(SPV_TOKEN_CANISTER_ID);
export const PAYMENT_GATEWAY_CANISTER_ID_STR: string = String(PAYMENT_GATEWAY_CANISTER_ID);
export const ADMIN_CANISTER_ID_STR: string = String(ADMIN_CANISTER_ID);

export const getCanisterPrincipal = (canisterId: string): Principal => Principal.fromText(canisterId);

// Error handling
export class ICError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ICError';
  }
}

export const handleICError = (error: any): ICError => {
  if (error instanceof ICError) return error;
  
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  
  if (errorMessage.includes('insufficient funds')) {
    return new ICError('Insufficient funds for this operation', 'INSUFFICIENT_FUNDS');
  }
  if (errorMessage.includes('not authorized') || errorMessage.includes('unauthorized')) {
    return new ICError('You are not authorized to perform this action', 'NOT_AUTHORIZED');
  }
  if (errorMessage.includes('campaign not found')) {
    return new ICError('Campaign not found', 'CAMPAIGN_NOT_FOUND');
  }
  if (errorMessage.includes('campaign already ended')) {
    return new ICError('Campaign has already ended', 'CAMPAIGN_ENDED');
  }
  
  return new ICError(errorMessage, 'UNKNOWN');
};

// Utility functions
export const formatPrincipal = (principal: Principal): string => {
  const text = principal.toString();
  if (text.length <= 12) return text;
  return `${text.slice(0, 6)}...${text.slice(-6)}`;
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

// Connection status
export const getConnectionStatus = async () => {
  try {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
      return { connected: false, principal: null };
    }
    
    const principal = await getPrincipal();
    return { connected: true, principal };
  } catch (error) {
    console.error('Failed to get connection status:', error);
    return { connected: false, principal: null };
  }
};

// Export types for use in components
export type { 
  FundVerseBackendService, 
  FundFlowService, 
  ControllerService, 
  SPVService, 
  SpvTokenService, 
  PaymentGatewayService, 
  AdminService 
};