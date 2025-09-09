import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface CampaignCard {
  'id' : bigint,
  'title' : string,
  'goal' : bigint,
  'end_date' : bigint,
  'idea_id' : bigint,
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
export interface CampaignWithIdea { 'campaign' : CampaignCard, 'idea' : Idea }
export interface Doc {
  'id' : bigint,
  'data' : Uint8Array | number[],
  'name' : string,
  'content_type' : string,
  'idea_id' : bigint,
  'uploaded_at' : bigint,
}
export interface Idea {
  'business_registration' : number,
  'status' : [] | [string],
  'title' : string,
  'updated_at' : bigint,
  'current_funding' : bigint,
  'description' : string,
  'created_at' : bigint,
  'legal_entity' : string,
  'funding_goal' : bigint,
  'contact_info' : string,
  'category' : string,
}
export type Result = { 'Ok' : bigint } |
  { 'Err' : string };
export interface _SERVICE {
  'create_campaign' : ActorMethod<[bigint, bigint, bigint], Result>,
  'create_idea' : ActorMethod<
    [string, string, bigint, string, string, string, number],
    bigint
  >,
  'get_campaign_cards' : ActorMethod<[], Array<CampaignCard>>,
  'get_campaign_cards_by_status' : ActorMethod<
    [CampaignStatus],
    Array<CampaignCard>
  >,
  'get_campaign_meta' : ActorMethod<[bigint], [] | [CampaignMeta]>,
  'get_campaign_total_funding' : ActorMethod<[bigint], bigint>,
  'get_campaign_with_idea' : ActorMethod<[bigint], [] | [CampaignWithIdea]>,
  'get_doc' : ActorMethod<[bigint], [] | [Doc]>,
  'get_icp_contribution' : ActorMethod<[bigint], bigint>,
  'get_idea_by_id' : ActorMethod<[bigint], [] | [Idea]>,
  'greet' : ActorMethod<[string], string>,
  'receive_icp_contribution' : ActorMethod<[bigint, bigint], Result>,
  'receive_payout' : ActorMethod<[bigint, bigint], Result>,
  'upload_doc' : ActorMethod<
    [bigint, string, string, Uint8Array | number[], bigint],
    [] | [bigint]
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
