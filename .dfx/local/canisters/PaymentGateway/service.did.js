export const idlFactory = ({ IDL }) => {
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
    'get_payment_method' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(PaymentMethodDetail)],
        ['query'],
      ),
    'get_user_payment_methods' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [IDL.Vec(PaymentMethodDetail)],
        ['query'],
      ),
    'register_payment_method' : IDL.Func(
        [IDL.Text, IDL.Text, IDL.Text, IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
