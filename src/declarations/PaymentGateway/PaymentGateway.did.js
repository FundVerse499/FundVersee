export const idlFactory = ({ IDL }) => {
  const PaymentStatus = IDL.Variant({
    'Failed' : IDL.Null,
    'Refunded' : IDL.Null,
    'Verified' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const PaymentVerification = IDL.Record({
    'status' : PaymentStatus,
    'verified_at_ns' : IDL.Opt(IDL.Nat64),
    'created_at_ns' : IDL.Nat64,
    'payment_method_id' : IDL.Nat64,
    'deal_id' : IDL.Nat64,
    'spv_id' : IDL.Nat64,
    'payment_id' : IDL.Nat64,
    'amount' : IDL.Nat64,
    'investor' : IDL.Principal,
  });
  const PaymentMethodDetail = IDL.Record({
    'id' : IDL.Nat64,
    'provider' : IDL.Text,
    'owner' : IDL.Principal,
    'created_at_ns' : IDL.Nat64,
    'method_type' : IDL.Text,
    'currency' : IDL.Text,
    'is_active' : IDL.Bool,
    'masked_account' : IDL.Text,
  });
  return IDL.Service({
    'deactivate_payment_method' : IDL.Func(
        [IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        [],
      ),
    'get_investor_payments' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(PaymentVerification)],
        ['query'],
      ),
    'get_payment_method' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(PaymentMethodDetail)],
        ['query'],
      ),
    'get_payment_verification' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(PaymentVerification)],
        ['query'],
      ),
    'get_user_payment_methods' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [IDL.Vec(PaymentMethodDetail)],
        ['query'],
      ),
    'init' : IDL.Func([], [], []),
    'initiate_payment' : IDL.Func(
        [IDL.Nat64, IDL.Nat64, IDL.Nat64, IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text })],
        [],
      ),
    'register_payment_method' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text })],
        [],
      ),
    'set_spv_token_canister' : IDL.Func([IDL.Principal], [], []),
    'verify_payment' : IDL.Func(
        [IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
