import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type AdminError = { 'InvalidStatusTransition' : null } |
  { 'InvalidInput' : string } |
  { 'IdeaNotFound' : null } |
  { 'NotAuthorized' : null } |
  { 'AlreadyExists' : null } |
  { 'InsufficientPermissions' : null } |
  { 'ProjectNotFound' : null } |
  { 'UserNotFound' : null };
export interface ApproveRejectResult { 'id' : bigint, 'status' : IdeaStatus }
export interface Idea {
  'id' : bigint,
  'status' : IdeaStatus,
  'title' : string,
  'submitted_at_ns' : bigint,
  'description' : string,
  'submitted_by' : Principal,
}
export type IdeaStatus = { 'RequiresRevision' : null } |
  { 'UnderReview' : null } |
  { 'Approved' : null } |
  { 'Rejected' : null } |
  { 'Pending' : null };
export interface Milestone {
  'id' : bigint,
  'title' : string,
  'completed' : boolean,
  'description' : string,
  'amount_e8s' : bigint,
  'due_date_ns' : bigint,
}
export interface Project {
  'id' : bigint,
  'business_registration' : number,
  'status' : IdeaStatus,
  'title' : string,
  'document_ids' : BigUint64Array | bigint[],
  'submitted_at_ns' : bigint,
  'project_duration_days' : number,
  'description' : string,
  'idea_id' : bigint,
  'legal_entity' : string,
  'funding_goal_e8s' : bigint,
  'review_date_ns' : [] | [bigint],
  'contact_info' : string,
  'category' : string,
  'admin_notes' : [] | [string],
  'reviewer' : [] | [Principal],
  'submitted_by' : Principal,
  'milestones' : Array<Milestone>,
}
export interface RegisteredUser {
  _0_ : Principal,
  'registered_at_ns' : bigint,
  'name' : string,
  'role' : Role,
  'email' : string,
}
export type Role = { 'Innovator' : null } |
  { 'User' : null } |
  { 'Admin' : null };
export interface _SERVICE {
  'add_admin' : ActorMethod<
    [Principal],
    { 'Ok' : null } |
      { 'Err' : AdminError }
  >,
  'add_innovator' : ActorMethod<
    [Principal],
    { 'Ok' : null } |
      { 'Err' : AdminError }
  >,
  'approve_idea' : ActorMethod<
    [bigint],
    { 'Ok' : ApproveRejectResult } |
      { 'Err' : AdminError }
  >,
  'get_idea' : ActorMethod<[bigint], [] | [Idea]>,
  'get_ideas' : ActorMethod<[], Array<Idea>>,
  'get_innovators' : ActorMethod<[], Array<RegisteredUser>>,
  'get_my_projects' : ActorMethod<[], Array<Project>>,
  'get_my_role' : ActorMethod<[], Role>,
  'get_project' : ActorMethod<[bigint], [] | [Project]>,
  'get_projects' : ActorMethod<[], Array<Project>>,
  'get_projects_by_status' : ActorMethod<[IdeaStatus], Array<Project>>,
  /**
   * User Queries
   */
  'get_users' : ActorMethod<[], Array<RegisteredUser>>,
  'is_innovator_check' : ActorMethod<[Principal], boolean>,
  /**
   * User Management
   */
  'register_user' : ActorMethod<[string, string], RegisteredUser>,
  'reject_idea' : ActorMethod<
    [bigint],
    { 'Ok' : ApproveRejectResult } |
      { 'Err' : AdminError }
  >,
  'remove_admin' : ActorMethod<
    [Principal],
    { 'Ok' : null } |
      { 'Err' : AdminError }
  >,
  'remove_innovator' : ActorMethod<
    [Principal],
    { 'Ok' : null } |
      { 'Err' : AdminError }
  >,
  'review_project' : ActorMethod<
    [bigint, IdeaStatus, [] | [string]],
    { 'Ok' : Project } |
      { 'Err' : AdminError }
  >,
  'set_role' : ActorMethod<
    [Principal, Role],
    { 'Ok' : null } |
      { 'Err' : AdminError }
  >,
  /**
   * Idea Management
   */
  'submit_idea' : ActorMethod<
    [string, string],
    { 'Ok' : Idea } |
      { 'Err' : AdminError }
  >,
  /**
   * Project Management
   */
  'submit_project' : ActorMethod<
    [
      string,
      string,
      bigint,
      string,
      string,
      string,
      number,
      number,
      Array<[string, string, bigint, bigint]>,
      BigUint64Array | bigint[],
    ],
    { 'Ok' : Project } |
      { 'Err' : AdminError }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
