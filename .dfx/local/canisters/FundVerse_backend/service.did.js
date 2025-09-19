export const idlFactory = ({ IDL }) => {
  const Campaign = IDL.Record({
    'id' : IDL.Nat64,
    'business_registration' : IDL.Nat8,
    'status' : IDL.Opt(IDL.Text),
    'title' : IDL.Text,
    'updated_at' : IDL.Nat64,
    'current_funding' : IDL.Nat64,
    'goal' : IDL.Nat64,
    'description' : IDL.Text,
    'end_date' : IDL.Nat64,
    'created_at' : IDL.Nat64,
    'legal_entity' : IDL.Text,
    'funding_goal' : IDL.Nat64,
    'contact_info' : IDL.Text,
    'category' : IDL.Text,
    'doc_ids' : IDL.Vec(IDL.Nat64),
    'amount_raised' : IDL.Nat64,
  });
  const CampaignCard = IDL.Record({
    'id' : IDL.Nat64,
    'title' : IDL.Text,
    'goal' : IDL.Nat64,
    'end_date' : IDL.Nat64,
    'category' : IDL.Text,
    'days_left' : IDL.Int64,
    'amount_raised' : IDL.Nat64,
  });
  const CampaignStatus = IDL.Variant({
    'Ended' : IDL.Null,
    'Active' : IDL.Null,
  });
  const CampaignMeta = IDL.Record({
    'goal' : IDL.Nat64,
    'end_date_secs' : IDL.Nat64,
    'campaign_id' : IDL.Nat64,
    'amount_raised' : IDL.Nat64,
  });
  const CampaignWithDetails = IDL.Record({
    'campaign' : CampaignCard,
    'details' : Campaign,
  });
  const Doc = IDL.Record({
    'id' : IDL.Nat64,
    'data' : IDL.Vec(IDL.Nat8),
    'name' : IDL.Text,
    'content_type' : IDL.Text,
    'campaign_id' : IDL.Nat64,
    'uploaded_at' : IDL.Nat64,
  });
  const SPVDealInfo = IDL.Record({
    'equity_percent' : IDL.Nat8,
    'spv_canister' : IDL.Opt(IDL.Principal),
    'total_raise' : IDL.Nat64,
    'fraction_price' : IDL.Nat64,
    'deal_id' : IDL.Nat64,
    'campaign_id' : IDL.Nat64,
    'spv_token_canister' : IDL.Opt(IDL.Principal),
  });
  const UnifiedFunding = IDL.Record({
    'spv_raised' : IDL.Nat64,
    'total_goal' : IDL.Nat64,
    'traditional_raised' : IDL.Nat64,
    'icp_raised' : IDL.Nat64,
    'total_raised' : IDL.Nat64,
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
  const Result = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text });
  const UploadChunk = IDL.Record({
    'chunk_index' : IDL.Nat32,
    'is_final' : IDL.Bool,
    'doc_id' : IDL.Nat64,
    'data' : IDL.Vec(IDL.Nat8),
  });
  return IDL.Service({
    'approve_campaign' : IDL.Func(
        [IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        [],
      ),
    'create_campaign' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Nat64,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Nat8,
          IDL.Nat64,
          IDL.Nat64,
        ],
        [IDL.Nat64],
        [],
      ),
    'create_spv_deal' : IDL.Func(
        [IDL.Nat64, IDL.Nat8, IDL.Nat64, IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text })],
        [],
      ),
    'get_campaign_approval_status' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(IDL.Text)],
        ['query'],
      ),
    'get_campaign_by_id' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(Campaign)],
        ['query'],
      ),
    'get_campaign_cards' : IDL.Func([], [IDL.Vec(CampaignCard)], ['query']),
    'get_campaign_cards_by_status' : IDL.Func(
        [CampaignStatus],
        [IDL.Vec(CampaignCard)],
        ['query'],
      ),
    'get_campaign_meta' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(CampaignMeta)],
        ['query'],
      ),
    'get_campaign_total_funding' : IDL.Func(
        [IDL.Nat64],
        [IDL.Nat64],
        ['query'],
      ),
    'get_campaign_with_details' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(CampaignWithDetails)],
        ['query'],
      ),
    'get_doc' : IDL.Func([IDL.Nat64], [IDL.Opt(Doc)], ['query']),
    'get_icp_contribution' : IDL.Func([IDL.Nat64], [IDL.Nat64], ['query']),
    'get_spv_contribution' : IDL.Func([IDL.Nat64], [IDL.Nat64], ['query']),
    'get_spv_deal_info' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(SPVDealInfo)],
        ['query'],
      ),
    'get_spv_deals_for_campaign' : IDL.Func(
        [IDL.Nat64],
        [IDL.Vec(IDL.Nat64)],
        ['query'],
      ),
    'get_traditional_contribution' : IDL.Func(
        [IDL.Nat64],
        [IDL.Nat64],
        ['query'],
      ),
    'get_unified_funding' : IDL.Func(
        [IDL.Nat64],
        [IDL.Opt(UnifiedFunding)],
        ['query'],
      ),
    'get_user_payment_methods' : IDL.Func(
        [IDL.Opt(IDL.Principal)],
        [
          IDL.Variant({
            'Ok' : IDL.Vec(PaymentMethodDetail),
            'Err' : IDL.Text,
          }),
        ],
        [],
      ),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'link_campaign_to_spv' : IDL.Func(
        [IDL.Nat64, IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        [],
      ),
    'process_traditional_payment' : IDL.Func(
        [IDL.Nat64, IDL.Nat64, IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text })],
        [],
      ),
    'receive_icp_contribution' : IDL.Func([IDL.Nat64, IDL.Nat64], [Result], []),
    'receive_payout' : IDL.Func([IDL.Nat64, IDL.Nat64], [Result], []),
    'receive_spv_contribution' : IDL.Func(
        [IDL.Nat64, IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        [],
      ),
    'set_admin_canister' : IDL.Func([IDL.Principal], [], []),
    'set_controller_canister' : IDL.Func([IDL.Principal], [], []),
    'set_payment_gateway_canister' : IDL.Func([IDL.Principal], [], []),
    'start_chunked_upload' : IDL.Func(
        [IDL.Nat64, IDL.Text, IDL.Text, IDL.Nat32, IDL.Nat64],
        [IDL.Opt(IDL.Nat64)],
        [],
      ),
    'submit_campaign_for_approval' : IDL.Func(
        [IDL.Nat64],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        [],
      ),
    'upload_chunk' : IDL.Func(
        [UploadChunk],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : IDL.Text })],
        [],
      ),
    'upload_doc' : IDL.Func(
        [IDL.Nat64, IDL.Text, IDL.Text, IDL.Vec(IDL.Nat8), IDL.Nat64],
        [IDL.Opt(IDL.Nat64)],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
