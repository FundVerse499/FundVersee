export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'add_investor' : IDL.Func(
        [IDL.Principal, IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        [],
      ),
    'distribute_exit' : IDL.Func(
        [IDL.Nat64],
        [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat64))],
        [],
      ),
    'init_spv' : IDL.Func([IDL.Nat64, IDL.Nat64], [], []),
    'investor_balance' : IDL.Func([IDL.Principal], [IDL.Nat64], ['query']),
  });
};
export const init = ({ IDL }) => { return []; };
