export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'balance_of' : IDL.Func([IDL.Principal], [IDL.Nat64], ['query']),
    'mint' : IDL.Func([IDL.Principal, IDL.Nat64], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
