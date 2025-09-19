import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface PaymentMethodDetail {
  'id' : bigint,
  'provider' : string,
  'owner' : Principal,
  'created_at_ns' : bigint,
  'method_type' : string,
  'currency' : string,
  'is_active' : boolean,
  'masked_account' : string,
}
export type PaymentStatus = { 'Failed' : null } |
  { 'Refunded' : null } |
  { 'Verified' : null } |
  { 'Pending' : null };
export interface PaymentVerification {
  'status' : PaymentStatus,
  'verified_at_ns' : [] | [bigint],
  'created_at_ns' : bigint,
  'payment_method_id' : bigint,
  'deal_id' : bigint,
  'spv_id' : bigint,
  'payment_id' : bigint,
  'amount' : bigint,
  'investor' : Principal,
}
export interface _SERVICE {
  'deactivate_payment_method' : ActorMethod<
    [bigint],
    { 'Ok' : null } |
      { 'Err' : string }
  >,
  'get_investor_payments' : ActorMethod<
    [Principal],
    Array<PaymentVerification>
  >,
  'get_payment_method' : ActorMethod<[bigint], [] | [PaymentMethodDetail]>,
  'get_payment_verification' : ActorMethod<
    [bigint],
    [] | [PaymentVerification]
  >,
  'get_user_payment_methods' : ActorMethod<
    [[] | [Principal]],
    Array<PaymentMethodDetail>
  >,
  'init' : ActorMethod<[], undefined>,
  'initiate_payment' : ActorMethod<
    [bigint, bigint, bigint, bigint],
    { 'Ok' : bigint } |
      { 'Err' : string }
  >,
  'register_payment_method' : ActorMethod<
    [string, string, string, string],
    { 'Ok' : bigint } |
      { 'Err' : string }
  >,
  'set_spv_token_canister' : ActorMethod<[Principal], undefined>,
  'verify_payment' : ActorMethod<
    [bigint],
    { 'Ok' : null } |
      { 'Err' : string }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
