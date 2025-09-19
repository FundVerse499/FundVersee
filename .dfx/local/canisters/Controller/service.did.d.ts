import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface DealTerms {
  'equity_percent' : number,
  'startup_id' : string,
  'payment_gateway_canister' : [] | [Principal],
  'spv_canister' : [] | [Principal],
  'total_raise' : bigint,
  'fraction_price' : bigint,
  'spv_token_canister' : [] | [Principal],
}
export interface _SERVICE {
  'complete_investment' : ActorMethod<
    [bigint, bigint],
    { 'Ok' : null } |
      { 'Err' : string }
  >,
  'create_spv' : ActorMethod<[string, number, bigint, bigint], bigint>,
  'init' : ActorMethod<[], undefined>,
  'invest_in_spv' : ActorMethod<
    [bigint, Principal, bigint, bigint],
    { 'Ok' : bigint } |
      { 'Err' : string }
  >,
  'list_deals' : ActorMethod<[], Array<[bigint, DealTerms]>>,
  'set_payment_gateway' : ActorMethod<[Principal], undefined>,
  'set_spv_canisters' : ActorMethod<
    [bigint, Principal, Principal],
    { 'Ok' : null } |
      { 'Err' : string }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
