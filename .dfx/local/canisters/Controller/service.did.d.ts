import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface DealTerms {
  'equity_percent' : number,
  'startup_id' : string,
  'spv_canister' : [] | [Principal],
  'total_raise' : bigint,
  'fraction_price' : bigint,
}
export interface _SERVICE {
  'create_spv' : ActorMethod<[string, number, bigint, bigint], bigint>,
  'list_deals' : ActorMethod<[], Array<[bigint, DealTerms]>>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
