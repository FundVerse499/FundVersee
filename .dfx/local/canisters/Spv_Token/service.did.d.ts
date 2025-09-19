import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface CertificateMetadata {
  'image_url' : string,
  'name' : string,
  'description' : string,
  'attributes' : Array<[string, string]>,
}
export interface InvestmentCertificate {
  'token_id' : bigint,
  'owner' : Principal,
  'created_at' : bigint,
  'investment_amount' : bigint,
  'is_transferable' : boolean,
  'deal_id' : bigint,
  'spv_id' : bigint,
  'fractions' : bigint,
}
export interface _SERVICE {
  'balance_of' : ActorMethod<[Principal], bigint>,
  'get_certificate' : ActorMethod<[bigint], [] | [InvestmentCertificate]>,
  'get_certificate_metadata' : ActorMethod<
    [bigint],
    [] | [CertificateMetadata]
  >,
  'get_owner_certificates' : ActorMethod<
    [Principal],
    Array<InvestmentCertificate>
  >,
  'init' : ActorMethod<[], undefined>,
  'mint' : ActorMethod<[Principal, bigint], undefined>,
  'mint_certificate' : ActorMethod<
    [Principal, bigint, bigint, bigint, bigint],
    { 'Ok' : bigint } |
      { 'Err' : string }
  >,
  'set_spv_canister' : ActorMethod<[Principal], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
