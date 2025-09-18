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
  /**
   * Create a Campaign linked to an existing Idea. Returns new campaign_id (Ok) or error (Err).
   */
  'create_campaign' : ActorMethod<[bigint, bigint, bigint], Result>,
  /**
   * Create an Idea and persist it in stable storage. Returns the new idea_id.
   */
  'create_idea' : ActorMethod<
    [string, string, bigint, string, string, string, number],
    bigint
  >,
  /**
   * Return all campaign cards (title/category pulled from linked Idea).
   */
  'get_campaign_cards' : ActorMethod<[], Array<CampaignCard>>,
  /**
   * Return cards filtered by status (Active/Ended).
   */
  'get_campaign_cards_by_status' : ActorMethod<
    [CampaignStatus],
    Array<CampaignCard>
  >,
  /**
   * Fund_Flow integration methods
   */
  'get_campaign_meta' : ActorMethod<[bigint], [] | [CampaignMeta]>,
  'get_campaign_total_funding' : ActorMethod<[bigint], bigint>,
  /**
   * Fetch a single campaign joined with its Idea.
   */
  'get_campaign_with_idea' : ActorMethod<[bigint], [] | [CampaignWithIdea]>,
  'get_doc' : ActorMethod<[bigint], [] | [Doc]>,
  'get_icp_contribution' : ActorMethod<[bigint], bigint>,
  /**
   * Convenience: fetch an idea by id
   */
  'get_idea_by_id' : ActorMethod<[bigint], [] | [Idea]>,
  /**
   * Simple hello (handy for quick health checks)
   */
  'greet' : ActorMethod<[string], string>,
  'receive_icp_contribution' : ActorMethod<[bigint, bigint], Result>,
  'receive_payout' : ActorMethod<[bigint, bigint], Result>,
  /**
   * Document methods
   */
  'upload_doc' : ActorMethod<
    [bigint, string, string, Uint8Array | number[], bigint],
    [] | [bigint]
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
