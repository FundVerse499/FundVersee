import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  CreditCard, 
  Wallet, 
  Building, 
  Plus,
  RefreshCw,
  Info,
  Check,
  X
} from 'lucide-react';
import { useCanisters } from '../contexts/CanisterContext';
import type { PaymentMethodDetail } from '../types';
import { handleICError } from '../lib/ic';

interface PaymentMethodsProps {
  className?: string;
}

const PaymentMethods: React.FC<PaymentMethodsProps> = ({ className = '' }) => {
  const { backendActor, paymentGatewayActor, setupCanisterReferences } = useCanisters();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [adding, setAdding] = useState(false);
  const [canisterStatus, setCanisterStatus] = useState<{
    backend: boolean;
    paymentGateway: boolean;
  }>({ backend: false, paymentGateway: false });

  // Form state for adding payment method
  const [formData, setFormData] = useState({
    method_type: 'Card',
    provider: '',
    masked_account: '',
    currency: 'USD'
  });

  const fetchPaymentMethods = async () => {
    if (!backendActor) return;

    try {
      setLoading(true);
      setError(null);
      console.log('Fetching payment methods...');
      
      const result = await backendActor.get_user_payment_methods([]);
      if ('Ok' in result) {
        setPaymentMethods(result.Ok);
        console.log('Payment methods fetched:', result.Ok);
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      const icError = handleICError(error);
      setError(icError.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const { method_type, provider, masked_account, currency } = formData;
    
    if (!provider.trim()) {
      setError('Provider is required');
      return false;
    }
    
    if (!masked_account.trim()) {
      setError('Account identifier is required');
      return false;
    }
    
    // Validate based on method type
    const account = masked_account.trim();
    switch (method_type.toLowerCase()) {
      case 'card':
        if (!/^\d{13,19}$/.test(account)) {
          setError('Card number must be 13-19 digits');
          return false;
        }
        break;
      case 'wallet':
        if (!/^\d{7,15}$/.test(account)) {
          setError('Wallet number must be 7-15 digits');
          return false;
        }
        break;
      case 'bank':
        if (!/^[a-zA-Z0-9]{8,34}$/.test(account)) {
          setError('Bank account must be 8-34 alphanumeric characters');
          return false;
        }
        break;
    }
    
    return true;
  };

  const addPaymentMethod = async () => {
    if (!paymentGatewayActor) {
      setError('PaymentGateway canister not available. Please ensure all canisters are properly deployed and connected.');
      return;
    }

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    try {
      setAdding(true);
      setError(null);
      console.log('Adding payment method...');
      console.log('PaymentGateway actor:', paymentGatewayActor);
      console.log('Form data:', formData);
      
      const result = await paymentGatewayActor.register_payment_method(
        formData.method_type,
        formData.provider,
        formData.masked_account,
        formData.currency
      );

      console.log('PaymentGateway result:', result);

      if ('Ok' in result) {
        console.log('Payment method added successfully:', result.Ok);
        setShowAddForm(false);
        setFormData({
          method_type: 'Card',
          provider: '',
          masked_account: '',
          currency: 'USD'
        });
        await fetchPaymentMethods(); // Refresh data
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      const icError = handleICError(error);
      setError(icError.message);
    } finally {
      setAdding(false);
    }
  };

  const deactivatePaymentMethod = async (id: bigint) => {
    if (!paymentGatewayActor) return;

    try {
      console.log('Deactivating payment method:', id);
      
      const result = await paymentGatewayActor.deactivate_payment_method(id);
      if ('Ok' in result) {
        console.log('Payment method deactivated successfully');
        await fetchPaymentMethods(); // Refresh data
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      console.error('Error deactivating payment method:', error);
      const icError = handleICError(error);
      setError(icError.message);
    }
  };

  // Check canister status
  useEffect(() => {
    setCanisterStatus({
      backend: !!backendActor,
      paymentGateway: !!paymentGatewayActor
    });
  }, [backendActor, paymentGatewayActor]);

  // Only fetch payment methods when user wants to add one or when explicitly requested
  // useEffect(() => {
  //   fetchPaymentMethods();
  // }, [backendActor, paymentGatewayActor]);

  const getMethodIcon = (methodType: string) => {
    switch (methodType.toLowerCase()) {
      case 'card':
        return CreditCard;
      case 'wallet':
        return Wallet;
      case 'bank':
        return Building;
      default:
        return CreditCard;
    }
  };

  const getMethodColor = (methodType: string) => {
    switch (methodType.toLowerCase()) {
      case 'card':
        return 'text-blue-400';
      case 'wallet':
        return 'text-purple-400';
      case 'bank':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <Card className={`bg-black/20 border-white/10 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
            <span className="text-white/70">Loading payment methods...</span>
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
            <CreditCard className="h-5 w-5 text-blue-400" />
            <span>Payment Methods</span>
          </CardTitle>
          <Button
            onClick={fetchPaymentMethods}
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

        {/* Canister Status Indicator */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-blue-400">
              <Info className="h-4 w-4" />
              <span className="text-sm">Canister Status</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-4 text-xs">
                <span className={`${canisterStatus.backend ? 'text-green-400' : 'text-red-400'}`}>
                  Backend: {canisterStatus.backend ? '✓' : '✗'}
                </span>
                <span className={`${canisterStatus.paymentGateway ? 'text-green-400' : 'text-red-400'}`}>
                  PaymentGateway: {canisterStatus.paymentGateway ? '✓' : '✗'}
                </span>
              </div>
              {(!canisterStatus.backend || !canisterStatus.paymentGateway) && (
                <Button
                  onClick={async () => {
                    try {
                      await setupCanisterReferences();
                      setError(null);
                    } catch (e) {
                      setError('Failed to setup canister references');
                    }
                  }}
                  size="sm"
                  variant="outline"
                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/20"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Setup
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Payment Methods List */}
        <div className="space-y-3">
          {paymentMethods.length === 0 && !loading ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto text-white/40 mb-4" />
              <h3 className="text-white font-medium mb-2">Payment Methods</h3>
              <p className="text-white/70 text-sm mb-4">
                Add a payment method to enable traditional payments.
              </p>
              <div className="flex space-x-2">
                <Button
                  onClick={fetchPaymentMethods}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Load Payment Methods
                </Button>
                <Button
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 mx-auto text-white/40 mb-4 animate-spin" />
              <p className="text-white/70 text-sm">Loading payment methods...</p>
            </div>
          ) : (
            paymentMethods.map((method) => {
              const IconComponent = getMethodIcon(method.method_type);
              const colorClass = getMethodColor(method.method_type);
              
              return (
                <div
                  key={method.id.toString()}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`h-5 w-5 ${colorClass}`} />
                    <div>
                      <div className="text-white font-medium">
                        {method.provider} {method.method_type}
                      </div>
                      <div className="text-white/70 text-sm">
                        {method.masked_account} • {method.currency}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={method.is_active ? "default" : "secondary"}
                      className={
                        method.is_active
                          ? "bg-green-500/20 text-green-400 border-green-500/30"
                          : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      }
                    >
                      {method.is_active ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </Badge>
                    
                    {method.is_active && (
                      <Button
                        onClick={() => deactivatePaymentMethod(method.id)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:bg-red-500/20"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add Payment Method Form */}
        {paymentMethods.length > 0 && !showAddForm && (
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        )}

        {showAddForm && (
          <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <h4 className="text-white font-medium">Add Payment Method</h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="method_type" className="text-white/70 text-sm">
                  Method Type
                </Label>
                <select
                  id="method_type"
                  value={formData.method_type}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      method_type: e.target.value
                    }));
                    setError(null); // Clear error when user changes selection
                  }}
                  className="w-full p-2 bg-gray-800 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    colorScheme: 'dark'
                  }}
                >
                  <option value="Card" className="bg-gray-800 text-white">Card</option>
                  <option value="Wallet" className="bg-gray-800 text-white">Wallet</option>
                  <option value="Bank" className="bg-gray-800 text-white">Bank</option>
                  <option value="Fawry" className="bg-gray-800 text-white">Fawry</option>
                  <option value="PayMob" className="bg-gray-800 text-white">PayMob</option>
                  <option value="Other" className="bg-gray-800 text-white">Other</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="provider" className="text-white/70 text-sm">
                  Provider
                </Label>
                <Input
                  id="provider"
                  type="text"
                  placeholder="e.g., Visa, Mastercard, VodafoneCash"
                  value={formData.provider}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      provider: e.target.value
                    }));
                    setError(null); // Clear error when user types
                  }}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="masked_account" className="text-white/70 text-sm">
                  Account Identifier
                </Label>
                <Input
                  id="masked_account"
                  type="text"
                  placeholder={
                    formData.method_type === 'Card' ? 'e.g., 1234567890123456 (13-19 digits)' :
                    formData.method_type === 'Wallet' ? 'e.g., 1234567890 (7-15 digits)' :
                    formData.method_type === 'Bank' ? 'e.g., IBAN123456789 (8-34 alphanumeric)' :
                    'e.g., account identifier'
                  }
                  value={formData.masked_account}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      masked_account: e.target.value
                    }));
                    setError(null); // Clear error when user types
                  }}
                  className="bg-white/10 border-white/20 text-white"
                />
                <p className="text-white/50 text-xs mt-1">
                  {formData.method_type === 'Card' && 'Enter full card number (13-19 digits)'}
                  {formData.method_type === 'Wallet' && 'Enter wallet number (7-15 digits)'}
                  {formData.method_type === 'Bank' && 'Enter bank account or IBAN (8-34 alphanumeric)'}
                  {!['Card', 'Wallet', 'Bank'].includes(formData.method_type) && 'Enter account identifier'}
                </p>
              </div>
              
              <div>
                <Label htmlFor="currency" className="text-white/70 text-sm">
                  Currency
                </Label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      currency: e.target.value
                    }));
                    setError(null); // Clear error when user changes selection
                  }}
                  className="w-full p-2 bg-gray-800 border border-white/20 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{
                    colorScheme: 'dark'
                  }}
                >
                  <option value="USD" className="bg-gray-800 text-white">USD</option>
                  <option value="EGP" className="bg-gray-800 text-white">EGP</option>
                  <option value="EUR" className="bg-gray-800 text-white">EUR</option>
                  <option value="GBP" className="bg-gray-800 text-white">GBP</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button
                onClick={addPaymentMethod}
                disabled={adding}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {adding ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {adding ? 'Adding...' : 'Add Method'}
              </Button>
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentMethods;
