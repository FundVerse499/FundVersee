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
  const Result = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text });
  const UploadChunk = IDL.Record({
    'chunk_index' : IDL.Nat32,
    'is_final' : IDL.Bool,
    'doc_id' : IDL.Nat64,
    'data' : IDL.Vec(IDL.Nat8),
  });
  return IDL.Service({
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
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'receive_icp_contribution' : IDL.Func([IDL.Nat64, IDL.Nat64], [Result], []),
    'receive_payout' : IDL.Func([IDL.Nat64, IDL.Nat64], [Result], []),
    'start_chunked_upload' : IDL.Func(
        [IDL.Nat64, IDL.Text, IDL.Text, IDL.Nat32, IDL.Nat64],
        [IDL.Opt(IDL.Nat64)],
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
