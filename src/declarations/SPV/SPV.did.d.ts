import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Investor {
  'investor_principal' : Principal,
  'fractions' : bigint,
}
export interface _SERVICE {
  'add_investor' : ActorMethod<
    [Principal, bigint],
    { 'Ok' : null } |
      { 'Err' : string }
  >,
  'distribute_exit' : ActorMethod<[bigint], Array<[Principal, bigint]>>,
  'init_spv' : ActorMethod<[bigint, bigint], undefined>,
  'investor_balance' : ActorMethod<[Principal], bigint>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
