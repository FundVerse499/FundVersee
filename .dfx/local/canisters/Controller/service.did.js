export const idlFactory = ({ IDL }) => {
  const DealTerms = IDL.Record({
    'equity_percent' : IDL.Nat8,
    'startup_id' : IDL.Text,
    'payment_gateway_canister' : IDL.Opt(IDL.Principal),
    'spv_canister' : IDL.Opt(IDL.Principal),
    'total_raise' : IDL.Nat64,
    'fraction_price' : IDL.Nat64,
    'spv_token_canister' : IDL.Opt(IDL.Principal),
  });
  return IDL.Service({
    'complete_investment' : IDL.Func(
        [IDL.Nat64, IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        [],
      ),
    'create_spv' : IDL.Func(
        [IDL.Text, IDL.Nat8, IDL.Nat64, IDL.Nat64],
        [IDL.Nat64],
        [],
      ),
    'init' : IDL.Func([], [], []),
    'invest_in_spv' : IDL.Func(
        [IDL.Nat64, IDL.Principal, IDL.Nat64, IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text })],
        [],
      ),
    'list_deals' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Nat64, DealTerms))],
        ['query'],
      ),
    'set_payment_gateway' : IDL.Func([IDL.Principal], [], []),
    'set_spv_canisters' : IDL.Func(
        [IDL.Nat64, IDL.Principal, IDL.Principal],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
