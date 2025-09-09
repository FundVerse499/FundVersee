export const idlFactory = ({ IDL }) => {
  const AdminError = IDL.Variant({
    'InvalidStatusTransition' : IDL.Null,
    'InvalidInput' : IDL.Text,
    'IdeaNotFound' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'AlreadyExists' : IDL.Null,
    'InsufficientPermissions' : IDL.Null,
    'ProjectNotFound' : IDL.Null,
    'UserNotFound' : IDL.Null,
  });
  const IdeaStatus = IDL.Variant({
    'RequiresRevision' : IDL.Null,
    'UnderReview' : IDL.Null,
    'Approved' : IDL.Null,
    'Rejected' : IDL.Null,
    'Pending' : IDL.Null,
  });
  const ApproveRejectResult = IDL.Record({
    'id' : IDL.Nat64,
    'status' : IdeaStatus,
  });
  const Idea = IDL.Record({
    'id' : IDL.Nat64,
    'status' : IdeaStatus,
    'title' : IDL.Text,
    'submitted_at_ns' : IDL.Nat64,
    'description' : IDL.Text,
    'submitted_by' : IDL.Principal,
  });
  const Role = IDL.Variant({
    'Innovator' : IDL.Null,
    'User' : IDL.Null,
    'Admin' : IDL.Null,
  });
  const RegisteredUser = IDL.Record({
    _0_ : IDL.Principal,
    'registered_at_ns' : IDL.Nat64,
    'name' : IDL.Text,
    'role' : Role,
    'email' : IDL.Text,
  });
  const Milestone = IDL.Record({
    'id' : IDL.Nat64,
    'title' : IDL.Text,
    'completed' : IDL.Bool,
    'description' : IDL.Text,
    'amount_e8s' : IDL.Nat64,
    'due_date_ns' : IDL.Nat64,
  });
  const Project = IDL.Record({
    'id' : IDL.Nat64,
    'business_registration' : IDL.Nat8,
    'status' : IdeaStatus,
    'title' : IDL.Text,
    'document_ids' : IDL.Vec(IDL.Nat64),
    'submitted_at_ns' : IDL.Nat64,
    'project_duration_days' : IDL.Nat32,
    'description' : IDL.Text,
    'idea_id' : IDL.Nat64,
    'legal_entity' : IDL.Text,
    'funding_goal_e8s' : IDL.Nat64,
    'review_date_ns' : IDL.Opt(IDL.Nat64),
    'contact_info' : IDL.Text,
    'category' : IDL.Text,
    'admin_notes' : IDL.Opt(IDL.Text),
    'reviewer' : IDL.Opt(IDL.Principal),
    'submitted_by' : IDL.Principal,
    'milestones' : IDL.Vec(Milestone),
  });
  return IDL.Service({
    'add_admin' : IDL.Func(
        [IDL.Principal],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : AdminError })],
        [],
      ),
    'add_innovator' : IDL.Func(
        [IDL.Principal],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : AdminError })],
        [],
      ),
    'approve_idea' : IDL.Func(
        [IDL.Nat64],
        [IDL.Variant({ 'Ok' : ApproveRejectResult, 'Err' : AdminError })],
        [],
      ),
    'get_idea' : IDL.Func([IDL.Nat64], [IDL.Opt(Idea)], ['query']),
    'get_ideas' : IDL.Func([], [IDL.Vec(Idea)], ['query']),
    'get_innovators' : IDL.Func([], [IDL.Vec(RegisteredUser)], ['query']),
    'get_my_projects' : IDL.Func([], [IDL.Vec(Project)], ['query']),
    'get_my_role' : IDL.Func([], [Role], ['query']),
    'get_project' : IDL.Func([IDL.Nat64], [IDL.Opt(Project)], ['query']),
    'get_projects' : IDL.Func([], [IDL.Vec(Project)], ['query']),
    'get_projects_by_status' : IDL.Func(
        [IdeaStatus],
        [IDL.Vec(Project)],
        ['query'],
      ),
    'get_users' : IDL.Func([], [IDL.Vec(RegisteredUser)], ['query']),
    'is_innovator_check' : IDL.Func([IDL.Principal], [IDL.Bool], ['query']),
    'register_user' : IDL.Func([IDL.Text, IDL.Text], [RegisteredUser], []),
    'reject_idea' : IDL.Func(
        [IDL.Nat64],
        [IDL.Variant({ 'Ok' : ApproveRejectResult, 'Err' : AdminError })],
        [],
      ),
    'remove_admin' : IDL.Func(
        [IDL.Principal],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : AdminError })],
        [],
      ),
    'remove_innovator' : IDL.Func(
        [IDL.Principal],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : AdminError })],
        [],
      ),
    'review_project' : IDL.Func(
        [IDL.Nat64, IdeaStatus, IDL.Opt(IDL.Text)],
        [IDL.Variant({ 'Ok' : Project, 'Err' : AdminError })],
        [],
      ),
    'set_role' : IDL.Func(
        [IDL.Principal, Role],
        [IDL.Variant({ 'Ok' : IDL.Null, 'Err' : AdminError })],
        [],
      ),
    'submit_idea' : IDL.Func(
        [IDL.Text, IDL.Text],
        [IDL.Variant({ 'Ok' : Idea, 'Err' : AdminError })],
        [],
      ),
    'submit_project' : IDL.Func(
        [
          IDL.Text,
          IDL.Text,
          IDL.Nat64,
          IDL.Text,
          IDL.Text,
          IDL.Text,
          IDL.Nat8,
          IDL.Nat32,
          IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text, IDL.Nat64, IDL.Nat64)),
          IDL.Vec(IDL.Nat64),
        ],
        [IDL.Variant({ 'Ok' : Project, 'Err' : AdminError })],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
