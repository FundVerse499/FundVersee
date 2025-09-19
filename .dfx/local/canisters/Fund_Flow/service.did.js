export const idlFactory = ({ IDL }) => {
  const PaymentMethod = IDL.Variant({
    'ICP' : IDL.Null,
    'PayMob' : IDL.Null,
    'BankTransfer' : IDL.Null,
    'Fawry' : IDL.Null,
    'Other' : IDL.Text,
  });
  const EscrowStatus = IDL.Variant({
    'Refunded' : IDL.Null,
    'Held' : IDL.Null,
    'Released' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const Contribution = IDL.Record({
    'id' : IDL.Nat64,
    'status' : EscrowStatus,
    'method' : PaymentMethod,
    'backer' : IDL.Principal,
    'confirmed_at_ns' : IDL.Opt(IDL.Nat64),
    'created_at_ns' : IDL.Nat64,
    'icp_transfer_id' : IDL.Opt(IDL.Nat64),
    'amount' : IDL.Nat64,
    'campaign_id' : IDL.Nat64,
  });
  const EscrowSummary = IDL.Record({
    'total_held' : IDL.Nat64,
    'total_pending' : IDL.Nat64,
    'total_refunded' : IDL.Nat64,
    'campaign_id' : IDL.Nat64,
    'total_released' : IDL.Nat64,
  });
  const ICPTransferStatus = IDL.Variant({
    'Failed' : IDL.Null,
    'Confirmed' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const ICPTransfer = IDL.Record({
    'id' : IDL.Nat64,
    'to' : IDL.Principal,
    'status' : ICPTransferStatus,
    'from' : IDL.Principal,
    'memo' : IDL.Nat64,
    'confirmed_at_ns' : IDL.Opt(IDL.Nat64),
    'created_at_ns' : IDL.Nat64,
    'amount_e8s' : IDL.Nat64,
    'block_height' : IDL.Opt(IDL.Nat64),
  });
  const RegisteredUser = IDL.Record({
    'user_principal' : IDL.Principal,
    'registered_at_ns' : IDL.Nat64,
    'name' : IDL.Text,
    'email' : IDL.Text,
  });
  return IDL.Service({
    'confirm_payment' : IDL.Func(
        [IDL.Nat64, IDL.Principal],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        [],
      ),
    'contribute' : IDL.Func(
        [IDL.Principal, IDL.Nat64, IDL.Nat64, PaymentMethod],
        [IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text })],
        [],
      ),
    'contribute_icp' : IDL.Func(
        [IDL.Principal, IDL.Nat64, IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text })],
        [],
      ),
    'get_campaign_contributions' : IDL.Func(
        [IDL.Nat64],
        [IDL.Vec(Contribution)],
        ['query'],
      ),
    'get_contributions_by_user' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [IDL.Vec(Contribution)],
        ['query'],
      ),
    'get_escrow_summary' : IDL.Func([IDL.Nat64], [EscrowSummary], ['query']),
    'get_icp_transfer' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(ICPTransfer)],
        ['query'],
      ),
    'get_icp_transfers_by_user' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [IDL.Vec(ICPTransfer)],
        ['query'],
      ),
    'get_my_profile' : IDL.Func([], [IDL.Opt(RegisteredUser)], ['query']),
    'is_registered' : IDL.Func([IDL.Opt(IDL.Principal)], [IDL.Bool], ['query']),
    'refund_campaign' : IDL.Func(
        [IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text })],
        [],
      ),
    'register_user' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        [],
      ),
    'release_campaign' : IDL.Func(
        [IDL.Principal, IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
