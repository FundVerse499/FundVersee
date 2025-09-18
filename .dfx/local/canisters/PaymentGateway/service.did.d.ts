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
export interface _SERVICE {
  'deactivate_payment_method' : ActorMethod<
    [bigint],
    { 'Ok' : null } |
      { 'Err' : string }
  >,
  'get_payment_method' : ActorMethod<[bigint], [] | [PaymentMethodDetail]>,
  'get_user_payment_methods' : ActorMethod<
    [[] | [Principal]],
    Array<PaymentMethodDetail>
  >,
  'register_payment_method' : ActorMethod<
    [string, string, string, string],
    { 'Ok' : bigint } |
      { 'Err' : string }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
