export const idlFactory = ({ IDL }) => {
  const InvestmentCertificate = IDL.Record({
    'token_id' : IDL.Nat64,
    'owner' : IDL.Principal,
    'created_at' : IDL.Nat64,
    'investment_amount' : IDL.Nat64,
    'is_transferable' : IDL.Bool,
    'deal_id' : IDL.Nat64,
    'spv_id' : IDL.Nat64,
    'fractions' : IDL.Nat64,
  });
  const CertificateMetadata = IDL.Record({
    'image_url' : IDL.Text,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'attributes' : IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text)),
  });
  return IDL.Service({
    'balance_of' : IDL.Func([IDL.Principal], [IDL.Nat64], ['query']),
    'get_certificate' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(InvestmentCertificate)],
        ['query'],
      ),
    'get_certificate_metadata' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(CertificateMetadata)],
        ['query'],
      ),
    'get_owner_certificates' : IDL.Func(
        [IDL.Principal],
        [IDL.Vec(InvestmentCertificate)],
        ['query'],
      ),
    'init' : IDL.Func([], [], []),
    'mint' : IDL.Func([IDL.Principal, IDL.Nat64], [], []),
    'mint_certificate' : IDL.Func(
        [IDL.Principal, IDL.Nat64, IDL.Nat64, IDL.Nat64, IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text })],
        [],
      ),
    'set_spv_canister' : IDL.Func([IDL.Principal], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
