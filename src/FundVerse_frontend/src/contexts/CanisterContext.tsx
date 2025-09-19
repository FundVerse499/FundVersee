import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Principal } from '@dfinity/principal';
import {
  createFundVerseBackendActor,
  createFundFlowActor,
  createControllerActor,
  createSPVActor,
  createSpvTokenActor,
  createPaymentGatewayActor,
  createAdminActor,
  type FundVerseBackendService,
  type FundFlowService,
  type ControllerService,
  type SPVService,
  type SpvTokenService,
  type PaymentGatewayService,
  type AdminService,
  handleICError
} from '../lib/ic';
import type { ActorSubclass } from '@dfinity/agent';
import { useAuth } from './AuthContext';

interface CanisterContextType {
  // Actors
  backendActor: ActorSubclass<FundVerseBackendService> | null;
  fundFlowActor: ActorSubclass<FundFlowService> | null;
  controllerActor: ActorSubclass<ControllerService> | null;
  spvActor: ActorSubclass<SPVService> | null;
  spvTokenActor: ActorSubclass<SpvTokenService> | null;
  paymentGatewayActor: ActorSubclass<PaymentGatewayService> | null;
  adminActor: ActorSubclass<AdminService> | null;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  initializeActors: () => Promise<void>;
  clearActors: () => void;
  setupCanisterReferences: () => Promise<void>;
}

const CanisterContext = createContext<CanisterContextType | undefined>(undefined);

export const useCanisters = () => {
  const context = useContext(CanisterContext);
  if (context === undefined) {
    throw new Error('useCanisters must be used within a CanisterProvider');
  }
  return context;
};

interface CanisterProviderProps {
  children: ReactNode;
}

export const CanisterProvider: React.FC<CanisterProviderProps> = ({ children }) => {
  const { isAuthenticated, identity } = useAuth();
  
  // Actor states
  const [backendActor, setBackendActor] = useState<ActorSubclass<FundVerseBackendService> | null>(null);
  const [fundFlowActor, setFundFlowActor] = useState<ActorSubclass<FundFlowService> | null>(null);
  const [controllerActor, setControllerActor] = useState<ActorSubclass<ControllerService> | null>(null);
  const [spvActor, setSPVActor] = useState<ActorSubclass<SPVService> | null>(null);
  const [spvTokenActor, setSpvTokenActor] = useState<ActorSubclass<SpvTokenService> | null>(null);
  const [paymentGatewayActor, setPaymentGatewayActor] = useState<ActorSubclass<PaymentGatewayService> | null>(null);
  const [adminActor, setAdminActor] = useState<ActorSubclass<AdminService> | null>(null);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize all actors
  const initializeActors = async () => {
    if (!isAuthenticated || !identity) {
      console.log('Not authenticated, skipping actor initialization');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Initializing all canister actors...');

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.error('Actor initialization timed out after 15 seconds');
        setLoading(false);
        setError('Connection timeout. Please refresh the page.');
      }, 15000);

      // Initialize all actors in parallel
      const [
        backend,
        fundFlow,
        controller,
        spv,
        spvToken,
        paymentGateway,
        admin
      ] = await Promise.all([
        createFundVerseBackendActor(),
        createFundFlowActor(),
        createControllerActor(),
        createSPVActor(),
        createSpvTokenActor(),
        createPaymentGatewayActor(),
        createAdminActor()
      ]);

      setBackendActor(backend);
      setFundFlowActor(fundFlow);
      setControllerActor(controller);
      setSPVActor(spv);
      setSpvTokenActor(spvToken);
      setPaymentGatewayActor(paymentGateway);
      setAdminActor(admin);

      console.log('All actors initialized successfully');

      // Setup canister references
      await setupCanisterReferences();

      clearTimeout(timeoutId);
    } catch (error) {
      console.error('Actor initialization error:', error);
      const icError = handleICError(error);
      setError(`Failed to connect to services: ${icError.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Setup canister references in backend
  const setupCanisterReferences = async () => {
    if (!backendActor || !controllerActor || !paymentGatewayActor || !adminActor) {
      console.log('Not all actors available for setup');
      return;
    }

    try {
      console.log('Setting up canister references...');
      
      // Get canister principals
      const controllerPrincipal = controllerActor._principal;
      const paymentGatewayPrincipal = paymentGatewayActor._principal;
      const adminPrincipal = adminActor._principal;

      // Set references in backend (these calls might fail if already set, which is fine)
      try {
        await backendActor.set_controller_canister(controllerPrincipal);
        console.log('Controller canister reference set');
      } catch (e) {
        console.log('Controller reference already set or failed:', e);
      }

      try {
        await backendActor.set_payment_gateway_canister(paymentGatewayPrincipal);
        console.log('PaymentGateway canister reference set');
      } catch (e) {
        console.log('PaymentGateway reference already set or failed:', e);
      }

      try {
        await backendActor.set_admin_canister(adminPrincipal);
        console.log('Admin canister reference set');
      } catch (e) {
        console.log('Admin reference already set or failed:', e);
      }

      console.log('Canister references setup completed');
    } catch (error) {
      console.error('Error setting up canister references:', error);
      // Don't set error state here as this is not critical for basic functionality
    }
  };

  // Clear all actors
  const clearActors = () => {
    console.log('Clearing all actors');
    setBackendActor(null);
    setFundFlowActor(null);
    setControllerActor(null);
    setSPVActor(null);
    setSpvTokenActor(null);
    setPaymentGatewayActor(null);
    setAdminActor(null);
    setError(null);
  };

  // Initialize actors when authentication state changes
  useEffect(() => {
    if (isAuthenticated && identity) {
      console.log('Auth state changed - initializing actors...');
      initializeActors();
    } else if (!isAuthenticated) {
      console.log('User not authenticated, clearing actors');
      clearActors();
    }
  }, [isAuthenticated, identity]);

  const value: CanisterContextType = {
    // Actors
    backendActor,
    fundFlowActor,
    controllerActor,
    spvActor,
    spvTokenActor,
    paymentGatewayActor,
    adminActor,
    
    // Loading states
    loading,
    error,
    
    // Actions
    initializeActors,
    clearActors,
    setupCanisterReferences
  };

  return (
    <CanisterContext.Provider value={value}>
      {children}
    </CanisterContext.Provider>
  );
};
