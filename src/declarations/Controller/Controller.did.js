export const idlFactory = ({ IDL }) => {
  const DealTerms = IDL.Record({
    'equity_percent' : IDL.Nat8,
    'startup_id' : IDL.Text,
    'spv_canister' : IDL.Opt(IDL.Principal),
    'total_raise' : IDL.Nat64,
    'fraction_price' : IDL.Nat64,
  });
  return IDL.Service({
    'create_spv' : IDL.Func(
        [IDL.Text, IDL.Nat8, IDL.Nat64, IDL.Nat64],
        [IDL.Nat64],
        [],
      ),
    'list_deals' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Nat64, DealTerms))],
        ['query'],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
