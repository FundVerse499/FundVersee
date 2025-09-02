use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::time;
use ic_cdk::{caller, trap};
use ic_cdk_macros::{init, post_upgrade, pre_upgrade, query, update};
use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};

/// ====== Domain Types ======

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq, Eq)]
pub enum Role {
    Admin,
    User,
    Innovator,
}

#[derive(Clone, Debug, CandidType, Deserialize, PartialEq, Eq)]
pub enum IdeaStatus {
    Pending,
    UnderReview,
    Approved,
    Rejected,
    RequiresRevision,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct RegisteredUser {
    pub principal: Principal,
    pub name: String,
    pub email: String,
    pub role: Role,
    pub registered_at_ns: u64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Milestone {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub amount_e8s: u64,
    pub due_date_ns: u64,
    pub completed: bool,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Project {
    pub id: u64,
    pub idea_id: u64,
    pub title: String,
    pub description: String,
    pub funding_goal_e8s: u64,
    pub legal_entity: String,
    pub contact_info: String,
    pub category: String,
    pub business_registration: u8,
    pub submitted_by: Principal,
    pub submitted_at_ns: u64,
    pub status: IdeaStatus,
    pub project_duration_days: u32,
    pub milestones: Vec<Milestone>,
    pub document_ids: Vec<u64>,
    pub admin_notes: Option<String>,
    pub review_date_ns: Option<u64>,
    pub reviewer: Option<Principal>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Idea {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub submitted_by: Principal,
    pub submitted_at_ns: u64,
    pub status: IdeaStatus,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct ApproveRejectResult {
    pub id: u64,
    pub status: IdeaStatus,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub enum AdminError {
    NotAuthorized,
    UserNotFound,
    IdeaNotFound,
    ProjectNotFound,
    AlreadyExists,
    InvalidInput(String),
    InsufficientPermissions,
    InvalidStatusTransition,
}

type Result<T> = std::result::Result<T, AdminError>;

/// ====== State ======

#[derive(Default, CandidType, Deserialize , Clone)]
struct State {
    users: BTreeMap<Principal, RegisteredUser>,
    ideas: BTreeMap<u64, Idea>,
    projects: BTreeMap<u64, Project>,
    next_idea_id: u64,
    next_project_id: u64,
    admins: BTreeSet<Principal>,
    innovators: BTreeSet<Principal>,
}

thread_local! {
    static STATE: RefCell<State> = RefCell::new(State::default());
}

/// Small helpers
fn is_admin(p: Principal) -> bool {
    STATE.with(|s| s.borrow().admins.contains(&p))
}

fn is_innovator(p: Principal) -> bool {
    STATE.with(|s| s.borrow().innovators.contains(&p))
}

fn ensure_admin() -> Result<()> {
    if is_admin(caller()) {
        Ok(())
    } else {
        Err(AdminError::NotAuthorized)
    }
}

fn ensure_admin_or_innovator() -> Result<()> {
    let caller_p = caller();
    if is_admin(caller_p) || is_innovator(caller_p) {
        Ok(())
    } else {
        Err(AdminError::InsufficientPermissions)
    }
}

fn get_user_role(p: Principal) -> Role {
    STATE.with(|s| {
        let st = s.borrow();
        if st.admins.contains(&p) {
            Role::Admin
        } else if st.innovators.contains(&p) {
            Role::Innovator
        } else {
            Role::User
        }
    })
}

/// ====== Lifecycle ======

#[init]
fn init() {
    // The installer becomes the first admin
    let me = caller();
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        st.admins.insert(me);
        // optionally bootstrap a user record for the installer
        st.users.entry(me).or_insert(RegisteredUser {
            principal: me,
            name: "Deployer".to_string(),
            email: "".to_string(),
            role: Role::Admin,
            registered_at_ns: time(),
        });
    });
}

#[pre_upgrade]
fn pre_upgrade() {
    let state = STATE.with(|s| s.borrow().clone());
    ic_cdk::storage::stable_save((state,)).expect("stable_save failed");
}

#[post_upgrade]
fn post_upgrade() {
    let (state,): (State,) = ic_cdk::storage::stable_restore().unwrap_or_default();
    STATE.with(|s| *s.borrow_mut() = state);
}

/// ====== User Management ======

#[update]
fn register_user(name: String, email: String) -> RegisteredUser {
    let me = caller();
    let now = time();
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        let is_admin = st.admins.contains(&me);
        let entry = st.users.entry(me).or_insert(RegisteredUser {
            principal: me,
            name: name.clone(),
            email: email.clone(),
            role: if is_admin { Role::Admin } else { Role::User },
            registered_at_ns: now,
        });
        // allow update of name/email but keep original timestamp & role
        entry.name = name;
        entry.email = email;
        entry.clone()
    })
}

#[update]
fn add_admin(p: Principal) -> Result<()> {
    ensure_admin()?;
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        st.admins.insert(p);
        // ensure user exists and has role Admin
        let now = time();
        st.users
            .entry(p)
            .and_modify(|u| u.role = Role::Admin)
            .or_insert(RegisteredUser {
                principal: p,
                name: "Admin".into(),
                email: "".into(),
                role: Role::Admin,
                registered_at_ns: now,
            });
    });
    Ok(())
}

#[update]
fn remove_admin(p: Principal) -> Result<()> {
    ensure_admin()?;
    let caller_p = caller();
    // Prevent removing the last admin or self-locking
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        if !st.admins.contains(&p) {
            return;
        }
        if st.admins.len() == 1 && st.admins.contains(&p) {
            trap("Cannot remove the last admin");
        }
        // avoid removing yourself if you'd become non-admin and there's no other admin left
        if p == caller_p && st.admins.len() == 1 {
            trap("Cannot remove yourself as the only admin");
        }
        st.admins.remove(&p);
        if let Some(u) = st.users.get_mut(&p) {
            u.role = Role::User;
        }
    });
    Ok(())
}

#[update]
fn set_role(p: Principal, role: Role) -> Result<()> {
    ensure_admin()?;
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        let user = st.users.get_mut(&p).ok_or(AdminError::UserNotFound)?;
        user.role = role.clone();
        match role {
            Role::Admin => { 
                st.admins.insert(p); 
                st.innovators.remove(&p);
            }
            Role::Innovator => { 
                st.innovators.insert(p); 
                st.admins.remove(&p);
            }
            Role::User => { 
                st.admins.remove(&p); 
                st.innovators.remove(&p);
            }
        }
        Ok(())
    })
}

#[update]
fn add_innovator(p: Principal) -> Result<()> {
    ensure_admin()?;
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        st.innovators.insert(p);
        // ensure user exists and has role Innovator
        let now = time();
        st.users
            .entry(p)
            .and_modify(|u| u.role = Role::Innovator)
            .or_insert(RegisteredUser {
                principal: p,
                name: "Innovator".into(),
                email: "".into(),
                role: Role::Innovator,
                registered_at_ns: now,
            });
    });
    Ok(())
}

#[update]
fn remove_innovator(p: Principal) -> Result<()> {
    ensure_admin()?;
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        st.innovators.remove(&p);
        if let Some(u) = st.users.get_mut(&p) {
            u.role = Role::User;
        }
    });
    Ok(())
}

#[query]
fn get_users() -> Vec<RegisteredUser> {
    STATE.with(|s| s.borrow().users.values().cloned().collect())
}

#[query]
fn get_my_role() -> Role {
    get_user_role(caller())
}

#[query]
fn get_innovators() -> Vec<RegisteredUser> {
    STATE.with(|s| {
        s.borrow()
            .users
            .values()
            .filter(|u| u.role == Role::Innovator)
            .cloned()
            .collect()
    })
}

#[query]
fn is_innovator_check(p: Principal) -> bool {
    is_innovator(p)
}

/// ====== Idea Management ======

#[update]
fn submit_idea(title: String, description: String) -> Result<Idea> {
    if title.trim().is_empty() || description.trim().len() < 10 {
        return Err(AdminError::InvalidInput(
            "Title required and description >= 10 chars".into(),
        ));
    }
    let me = caller();
    let now = time();
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        let id = st.next_idea_id;
        st.next_idea_id = id.saturating_add(1);
        let idea = Idea {
            id,
            title,
            description,
            submitted_by: me,
            submitted_at_ns: now,
            status: IdeaStatus::Pending,
        };
        st.ideas.insert(id, idea.clone());
        Ok(idea)
    })
}

/// ====== Project Management ======

#[update]
fn submit_project(
    title: String,
    description: String,
    funding_goal_e8s: u64,
    legal_entity: String,
    contact_info: String,
    category: String,
    business_registration: u8,
    project_duration_days: u32,
    milestones: Vec<(String, String, u64, u64)>, // (title, description, amount_e8s, due_date_ns)
    document_ids: Vec<u64>,
) -> Result<Project> {
    ensure_admin_or_innovator()?;
    
    if title.trim().is_empty() || description.trim().len() < 10 {
        return Err(AdminError::InvalidInput(
            "Title required and description >= 10 chars".into(),
        ));
    }
    
    if funding_goal_e8s == 0 {
        return Err(AdminError::InvalidInput("Funding goal must be greater than 0".into()));
    }
    
    if project_duration_days == 0 {
        return Err(AdminError::InvalidInput("Project duration must be greater than 0".into()));
    }
    
    let me = caller();
    let now = time();
    
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        let project_id = st.next_project_id;
        st.next_project_id = project_id.saturating_add(1);
        
        // Create milestones
        let project_milestones: Vec<Milestone> = milestones
            .into_iter()
            .enumerate()
            .map(|(index, (title, description, amount_e8s, due_date_ns))| Milestone {
                id: index as u64,
                title,
                description,
                amount_e8s,
                due_date_ns,
                completed: false,
            })
            .collect();
        
        let project = Project {
            id: project_id,
            idea_id: 0, // Will be set when idea is created
            title,
            description,
            funding_goal_e8s,
            legal_entity,
            contact_info,
            category,
            business_registration,
            submitted_by: me,
            submitted_at_ns: now,
            status: IdeaStatus::Pending,
            project_duration_days,
            milestones: project_milestones,
            document_ids,
            admin_notes: None,
            review_date_ns: None,
            reviewer: None,
        };
        
        st.projects.insert(project_id, project.clone());
        Ok(project)
    })
}

#[update]
fn review_project(project_id: u64, status: IdeaStatus, notes: Option<String>) -> Result<Project> {
    ensure_admin()?;
    
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        let project = st.projects.get_mut(&project_id).ok_or(AdminError::ProjectNotFound)?;
        
        // Validate status transition
        match (project.status.clone(), status.clone()) {
            (IdeaStatus::Pending, IdeaStatus::UnderReview) |
            (IdeaStatus::UnderReview, IdeaStatus::Approved) |
            (IdeaStatus::UnderReview, IdeaStatus::Rejected) |
            (IdeaStatus::UnderReview, IdeaStatus::RequiresRevision) |
            (IdeaStatus::RequiresRevision, IdeaStatus::UnderReview) => {
                // Valid transitions
            }
            _ => {
                return Err(AdminError::InvalidStatusTransition);
            }
        }
        
        project.status = status;
        project.admin_notes = notes;
        project.review_date_ns = Some(time());
        project.reviewer = Some(caller());
        
        Ok(project.clone())
    })
}

#[query]
fn get_projects() -> Vec<Project> {
    STATE.with(|s| s.borrow().projects.values().cloned().collect())
}

#[query]
fn get_projects_by_status(status: IdeaStatus) -> Vec<Project> {
    STATE.with(|s| {
        s.borrow()
            .projects
            .values()
            .filter(|p| p.status == status)
            .cloned()
            .collect()
    })
}

#[query]
fn get_my_projects() -> Vec<Project> {
    let me = caller();
    STATE.with(|s| {
        s.borrow()
            .projects
            .values()
            .filter(|p| p.submitted_by == me)
            .cloned()
            .collect()
    })
}

#[query]
fn get_project(project_id: u64) -> Option<Project> {
    STATE.with(|s| s.borrow().projects.get(&project_id).cloned())
}

#[update]
fn approve_idea(id: u64) -> Result<ApproveRejectResult> {
    ensure_admin()?;
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        let idea = st.ideas.get_mut(&id).ok_or(AdminError::IdeaNotFound)?;
        idea.status = IdeaStatus::Approved;
        Ok(ApproveRejectResult {
            id,
            status: idea.status.clone(),
        })
    })
}

#[update]
fn reject_idea(id: u64) -> Result<ApproveRejectResult> {
    ensure_admin()?;
    STATE.with(|s| {
        let mut st = s.borrow_mut();
        let idea = st.ideas.get_mut(&id).ok_or(AdminError::IdeaNotFound)?;
        idea.status = IdeaStatus::Rejected;
        Ok(ApproveRejectResult {
            id,
            status: idea.status.clone(),
        })
    })
}

#[query]
fn get_ideas() -> Vec<Idea> {
    STATE.with(|s| s.borrow().ideas.values().cloned().collect())
}

#[query]
fn get_idea(id: u64) -> Option<Idea> {
    STATE.with(|s| s.borrow().ideas.get(&id).cloned())
}

ic_cdk::export_candid!();

