import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Contribution {
  'id' : bigint,
  'status' : EscrowStatus,
  'method' : PaymentMethod,
  'backer' : Principal,
  'confirmed_at_ns' : [] | [bigint],
  'created_at_ns' : bigint,
  'icp_transfer_id' : [] | [bigint],
  'amount' : bigint,
  'campaign_id' : bigint,
}
export type EscrowStatus = { 'Refunded' : null } |
  { 'Held' : null } |
  { 'Released' : null } |
  { 'Pending' : null };
export interface EscrowSummary {
  'total_held' : bigint,
  'total_pending' : bigint,
  'total_refunded' : bigint,
  'campaign_id' : bigint,
  'total_released' : bigint,
}
export interface ICPTransfer {
  'id' : bigint,
  'to' : Principal,
  'status' : ICPTransferStatus,
  'from' : Principal,
  'memo' : bigint,
  'confirmed_at_ns' : [] | [bigint],
  'created_at_ns' : bigint,
  'amount_e8s' : bigint,
  'block_height' : [] | [bigint],
}
export type ICPTransferStatus = { 'Failed' : null } |
  { 'Confirmed' : null } |
  { 'Pending' : null };
export type PaymentMethod = { 'ICP' : null } |
  { 'PayMob' : null } |
  { 'BankTransfer' : null } |
  { 'Fawry' : null } |
  { 'Other' : string };
export interface RegisteredUser {
  'user_principal' : Principal,
  'registered_at_ns' : bigint,
  'name' : string,
  'email' : string,
}
export interface _SERVICE {
  'confirm_payment' : ActorMethod<
    [bigint, Principal],
    { 'Ok' : null } |
      { 'Err' : string }
  >,
  'contribute' : ActorMethod<
    [Principal, bigint, bigint, PaymentMethod],
    { 'Ok' : bigint } |
      { 'Err' : string }
  >,
  'contribute_icp' : ActorMethod<
    [Principal, bigint, bigint],
    { 'Ok' : bigint } |
      { 'Err' : string }
  >,
  'get_campaign_contributions' : ActorMethod<[bigint], Array<Contribution>>,
  'get_contributions_by_user' : ActorMethod<
    [[] | [Principal]],
    Array<Contribution>
  >,
  'get_escrow_summary' : ActorMethod<[bigint], EscrowSummary>,
  'get_icp_transfer' : ActorMethod<[bigint], [] | [ICPTransfer]>,
  'get_icp_transfers_by_user' : ActorMethod<
    [[] | [Principal]],
    Array<ICPTransfer>
  >,
  'get_my_profile' : ActorMethod<[], [] | [RegisteredUser]>,
  'is_registered' : ActorMethod<[[] | [Principal]], boolean>,
  'refund_campaign' : ActorMethod<
    [bigint],
    { 'Ok' : bigint } |
      { 'Err' : string }
  >,
  'register_user' : ActorMethod<
    [string, string],
    { 'Ok' : null } |
      { 'Err' : string }
  >,
  'release_campaign' : ActorMethod<
    [Principal, bigint],
    { 'Ok' : bigint } |
      { 'Err' : string }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
