import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Campaign {
  'id' : bigint,
  'business_registration' : number,
  'status' : [] | [string],
  'title' : string,
  'updated_at' : bigint,
  'current_funding' : bigint,
  'goal' : bigint,
  'description' : string,
  'end_date' : bigint,
  'created_at' : bigint,
  'legal_entity' : string,
  'funding_goal' : bigint,
  'contact_info' : string,
  'category' : string,
  'doc_ids' : BigUint64Array | bigint[],
  'amount_raised' : bigint,
}
export interface CampaignCard {
  'id' : bigint,
  'title' : string,
  'goal' : bigint,
  'end_date' : bigint,
  'category' : string,
  'days_left' : bigint,
  'amount_raised' : bigint,
}
export interface CampaignMeta {
  'goal' : bigint,
  'end_date_secs' : bigint,
  'campaign_id' : bigint,
  'amount_raised' : bigint,
}
export type CampaignStatus = { 'Ended' : null } |
  { 'Active' : null };
export interface CampaignWithDetails {
  'campaign' : CampaignCard,
  'details' : Campaign,
}
export interface Doc {
  'id' : bigint,
  'data' : Uint8Array | number[],
  'name' : string,
  'content_type' : string,
  'campaign_id' : bigint,
  'uploaded_at' : bigint,
}
export type Result = { 'Ok' : bigint } |
  { 'Err' : string };
export interface UploadChunk {
  'chunk_index' : number,
  'is_final' : boolean,
  'doc_id' : bigint,
  'data' : Uint8Array | number[],
}
export interface _SERVICE {
  'create_campaign' : ActorMethod<
    [string, string, bigint, string, string, string, number, bigint, bigint],
    bigint
  >,
  'get_campaign_by_id' : ActorMethod<[bigint], [] | [Campaign]>,
  'get_campaign_cards' : ActorMethod<[], Array<CampaignCard>>,
  'get_campaign_cards_by_status' : ActorMethod<
    [CampaignStatus],
    Array<CampaignCard>
  >,
  'get_campaign_meta' : ActorMethod<[bigint], [] | [CampaignMeta]>,
  'get_campaign_total_funding' : ActorMethod<[bigint], bigint>,
  'get_campaign_with_details' : ActorMethod<
    [bigint],
    [] | [CampaignWithDetails]
  >,
  'get_doc' : ActorMethod<[bigint], [] | [Doc]>,
  'get_icp_contribution' : ActorMethod<[bigint], bigint>,
  'greet' : ActorMethod<[string], string>,
  'receive_icp_contribution' : ActorMethod<[bigint, bigint], Result>,
  'receive_payout' : ActorMethod<[bigint, bigint], Result>,
  'start_chunked_upload' : ActorMethod<
    [bigint, string, string, number, bigint],
    [] | [bigint]
  >,
  'upload_chunk' : ActorMethod<
    [UploadChunk],
    { 'Ok' : null } |
      { 'Err' : string }
  >,
  'upload_doc' : ActorMethod<
    [bigint, string, string, Uint8Array | number[], bigint],
    [] | [bigint]
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
