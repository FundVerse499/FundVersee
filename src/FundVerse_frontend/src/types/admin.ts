// Simple type definitions for Admin canister
export type IdeaStatus = 'Pending' | 'UnderReview' | 'Approved' | 'Rejected' | 'RequiresRevision';

export interface Project {
  id: bigint;
  idea_id: bigint;
  title: string;
  description: string;
  funding_goal_e8s: bigint;
  legal_entity: string;
  contact_info: string;
  category: string;
  business_registration: number;
  submitted_by: any; // Principal
  submitted_at_ns: bigint;
  status: any; // Candid variant
  project_duration_days: number;
  milestones: any[];
  document_ids: bigint[] | any;
  admin_notes: string[] | any;
  review_date_ns: bigint[] | any;
  reviewer: any[] | any;
}

export interface AdminService {
  get_projects: () => Promise<Project[]>;
  review_project: (projectId: bigint, status: any, notes: string[] | any) => Promise<any>;
  [key: string]: any;
}
