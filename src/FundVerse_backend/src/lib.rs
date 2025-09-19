// FundVerse_backend/src/lib.rs

//! FundVerse Backend: Campaigns with integrated idea data
//! Now supports ICP coin funding via Fund_Flow canister integration

use std::{borrow::Cow, cell::RefCell};

use candid::{CandidType, Decode, Encode, Deserialize, Principal};
use ic_cdk::{self};
use ic_cdk_macros::{query, update};

// ---- Stable storage (Campaigns) ----
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, storable::Bound , Storable};
use std::collections::HashMap;

type Memory = VirtualMemory<DefaultMemoryImpl>;

const MAX_VALUE_SIZE: u32 = 20 * 1024 * 1024; // 20MB per value

// Global memory manager + stable map for campaigns
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static DOCS: std::cell::RefCell<HashMap<u64, Doc>> = Default::default();
    static CAMPAIGN_COUNTER: std::cell::RefCell<u64> = std::cell::RefCell::new(0);
    static DOC_COUNTER: std::cell::RefCell<u64> = std::cell::RefCell::new(0);

    static CAMPAIGNS: RefCell<StableBTreeMap<u64, Campaign, Memory>> = RefCell::new(
        // Use memory 0 for campaigns map
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|mm| mm.borrow().get(MemoryId::new(0)))
        )
    );
    
    // ICP contributions tracking: campaign_id -> total ICP amount in e8s
    static ICP_CONTRIBUTIONS: RefCell<HashMap<u64, u64>> = RefCell::new(HashMap::new());
    
    // Traditional payment contributions tracking: campaign_id -> total amount
    static TRADITIONAL_CONTRIBUTIONS: RefCell<HashMap<u64, u64>> = RefCell::new(HashMap::new());
    
    // SPV contributions tracking: campaign_id -> total SPV amount
    static SPV_CONTRIBUTIONS: RefCell<HashMap<u64, u64>> = RefCell::new(HashMap::new());
    
    // SPV deal mappings: campaign_id -> deal_id
    static CAMPAIGN_SPV_DEALS: RefCell<HashMap<u64, u64>> = RefCell::new(HashMap::new());
    
    // Canister references
    static CONTROLLER_CANISTER: RefCell<Option<Principal>> = RefCell::new(None);
    static PAYMENT_GATEWAY_CANISTER: RefCell<Option<Principal>> = RefCell::new(None);
    static ADMIN_CANISTER: RefCell<Option<Principal>> = RefCell::new(None);
}

// ------------- Data Models -------------


#[derive(CandidType, Deserialize, Clone)]
pub struct Doc {
    pub id: u64,
    pub campaign_id: u64,   // which campaign this belongs to
    pub name: String,       // original filename
    pub content_type: String, // e.g., "application/pdf"
    pub data: Vec<u8>,        // raw file bytes
    pub uploaded_at: u64,
}

// Store Campaign in stable memory by encoding/decoding with candid.
impl Storable for Campaign {
    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(self).expect("encode Campaign"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).expect("decode Campaign")
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: MAX_VALUE_SIZE,
        is_fixed_size: false,
    };
}

#[derive(CandidType, Deserialize, serde::Serialize, Clone, Debug)]
pub struct Campaign {
    pub id: u64,
    pub title: String,
    pub description: String,
    pub funding_goal: u64,
    pub current_funding: u64,
    pub legal_entity: String,
    pub status: Option<String>, // e.g., "pending", "approved", "rejected"
    pub contact_info: String,
    pub category: String,       // e.g., "technology", "healthcare", "education"
    pub business_registration: u8,
    pub created_at: u64,        // ns since epoch
    pub updated_at: u64,        // ns since epoch
    pub doc_ids: Vec<u64>,      // IDs of uploaded documents
    pub amount_raised: u64,
    pub goal: u64,
    pub end_date: u64,     // seconds since Unix epoch
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct CampaignCard {
    pub id: u64,
    pub title: String,     // from Campaign
    pub category: String,  // from Campaign
    pub amount_raised: u64,
    pub goal: u64,
    pub end_date: u64,
    pub days_left: i64,    // negative => ended
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum CampaignStatus {
    Active,
    Ended,
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct CampaignWithDetails {
    pub campaign: CampaignCard,
    pub details: Campaign,
}

// New struct for Fund_Flow canister integration
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct CampaignMeta {
    pub campaign_id: u64,
    pub goal: u64,
    pub amount_raised: u64,
    pub end_date_secs: u64, // seconds since epoch
}

// Unified funding tracking structure
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct UnifiedFunding {
    pub total_goal: u64,
    pub icp_raised: u64,
    pub traditional_raised: u64,
    pub spv_raised: u64,
    pub total_raised: u64, // computed field
}

// SPV deal information
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct SPVDealInfo {
    pub deal_id: u64,
    pub campaign_id: u64,
    pub equity_percent: u8,
    pub total_raise: u64,
    pub fraction_price: u64,
    pub spv_canister: Option<Principal>,
    pub spv_token_canister: Option<Principal>,
}

// Payment method detail (from PaymentGateway)
#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct PaymentMethodDetail {
    pub id: u64,
    pub owner: Principal,
    pub method_type: String,
    pub provider: String,
    pub masked_account: String,
    pub currency: String,
    pub is_active: bool,
    pub created_at_ns: u64,
}

// ------------- Helpers -------------

fn now_secs() -> u64 {
    // ic_cdk::api::time returns ns
    ic_cdk::api::time() / 1_000_000_000
}

fn to_card(c: &Campaign) -> CampaignCard {
    let now = now_secs() as i64;
    let days_left = ((c.end_date as i64) - now) / 86_400;
    
    CampaignCard {
        id: c.id,
        title: c.title.clone(),
        category: c.category.clone(),
        amount_raised: c.amount_raised,
        goal: c.goal,
        end_date: c.end_date,
        days_left,
    }
}


fn get_campaign(id: u64) -> Option<Campaign> {
    CAMPAIGNS.with(|map| map.borrow().get(&id))
}

fn update_campaign_amount(campaign_id: u64, new_amount: u64) {
    CAMPAIGNS.with(|map| {
        if let Some(mut campaign) = map.borrow_mut().get(&campaign_id) {
            campaign.amount_raised = new_amount;
            campaign.updated_at = ic_cdk::api::time();
            map.borrow_mut().insert(campaign_id, campaign);
        }
    });
}

// Chunked upload structures
#[derive(CandidType, Deserialize, Clone)]
pub struct UploadChunk {
    pub doc_id: u64,
    pub chunk_index: u32,
    pub data: Vec<u8>,
    pub is_final: bool,
}

// Temporary storage for chunks during upload
thread_local! {
    static UPLOAD_CHUNKS: RefCell<HashMap<u64, Vec<Option<Vec<u8>>>>> = RefCell::new(HashMap::new());
}

const CHUNK_SIZE: usize = 1_500_000; // 1.5MB chunks to stay under 2MB limit

/// Start a chunked upload for a document. Returns a doc_id for tracking chunks.
#[update]
fn start_chunked_upload(campaign_id: u64, name: String, content_type: String, total_chunks: u32, uploaded_at: u64) -> Option<u64> {
    if !CAMPAIGNS.with(|campaigns| campaigns.borrow().contains_key(&campaign_id)) {
        return None; // campaign doesn't exist
    }

    DOC_COUNTER.with(|c| {
        let mut c = c.borrow_mut();
        *c += 1;
        let doc_id = *c;

        // Initialize chunk storage
        UPLOAD_CHUNKS.with(|chunks| {
            let mut chunks = chunks.borrow_mut();
            chunks.insert(doc_id, vec![None; total_chunks as usize]);
        });

        // Create a temporary doc entry
        let doc = Doc {
            id: doc_id,
            campaign_id,
            name,
            content_type,
            data: vec![], // Will be filled when all chunks are received
            uploaded_at,
        };

        DOCS.with(|docs| docs.borrow_mut().insert(doc_id, doc));

        Some(doc_id)
    })
}

/// Upload a chunk of a document.
#[update]
fn upload_chunk(chunk: UploadChunk) -> Result<(), String> {
    UPLOAD_CHUNKS.with(|chunks| {
        let mut chunks = chunks.borrow_mut();
        
        if let Some(chunk_vec) = chunks.get_mut(&chunk.doc_id) {
            if chunk.chunk_index as usize >= chunk_vec.len() {
                return Err("Invalid chunk index".to_string());
            }
            
            chunk_vec[chunk.chunk_index as usize] = Some(chunk.data);
            
            // If this is the final chunk, reconstruct the document
            if chunk.is_final {
                // Check if all chunks are present
                let all_chunks_present = chunk_vec.iter().all(|c| c.is_some());
                if !all_chunks_present {
                    return Err("Not all chunks received".to_string());
                }
                
                // Reconstruct the document
                let mut full_data = Vec::new();
                for chunk_data in chunk_vec.iter() {
                    if let Some(data) = chunk_data {
                        full_data.extend_from_slice(data);
                    }
                }
                
                // Update the document with the full data
                DOCS.with(|docs| {
                    if let Some(doc) = docs.borrow().get(&chunk.doc_id) {
                        let mut updated_doc = doc.clone();
                        updated_doc.data = full_data;
                        docs.borrow_mut().insert(chunk.doc_id, updated_doc);
                    }
                });
                
                // Attach to campaign
                DOCS.with(|docs| {
                    if let Some(doc) = docs.borrow().get(&chunk.doc_id) {
                        CAMPAIGNS.with(|campaigns| {
                            let mut campaigns_mut = campaigns.borrow_mut();
                            if let Some(campaign) = campaigns_mut.get(&doc.campaign_id) {
                                let mut campaign_clone = campaign.clone();
                                campaign_clone.doc_ids.push(chunk.doc_id);
                                campaign_clone.updated_at = ic_cdk::api::time();
                                campaigns_mut.insert(doc.campaign_id, campaign_clone);
                            }
                        });
                    }
                });
                
                // Clean up chunk storage
                chunks.remove(&chunk.doc_id);
            }
            
            Ok(())
        } else {
            Err("Document upload not found".to_string())
        }
    })
}

/// Upload a document for a Campaign. Returns the new doc_id or None if campaign doesn't exist.
/// This is the legacy method for small files.
#[update]
fn upload_doc(campaign_id: u64, name: String, content_type: String, data: Vec<u8>, uploaded_at: u64) -> Option<u64> {
    // Check file size limit (1.5MB for safety)
    if data.len() > CHUNK_SIZE {
        ic_cdk::trap("File size exceeds 1.5MB limit. Use chunked upload for larger files.");
    }
    
    if !CAMPAIGNS.with(|campaigns| campaigns.borrow().contains_key(&campaign_id)) {
        return None; // campaign doesn't exist
    }

    DOC_COUNTER.with(|c| {
        let mut c = c.borrow_mut();
        *c += 1;
        let doc_id = *c;

        let doc = Doc {
            id: doc_id,
            campaign_id,
            name,
            content_type,
            data,
            uploaded_at,
        };

        DOCS.with(|docs| docs.borrow_mut().insert(doc_id, doc));

        // attach to campaign
        CAMPAIGNS.with(|campaigns| {
            let mut campaigns_mut = campaigns.borrow_mut();
            if let Some(campaign) = campaigns_mut.get(&campaign_id) {
                let mut campaign_clone = campaign.clone();
                campaign_clone.doc_ids.push(doc_id);
                campaign_clone.updated_at = ic_cdk::api::time();
                campaigns_mut.insert(campaign_id, campaign_clone);
            }
        });

        Some(doc_id)
    })
}

// ------------- Public API -------------

/// Create a Campaign and persist it in stable storage. Returns the new campaign_id.
#[update]
fn create_campaign(
    title: String,
    description: String,
    funding_goal: u64,
    legal_entity: String,
    contact_info: String,
    category: String,
    business_registration: u8,
    goal: u64,
    end_date: u64,
) -> u64 {
    if title.is_empty()
        || description.is_empty()
        || funding_goal == 0
        || legal_entity.is_empty()
        || contact_info.is_empty()
        || category.is_empty()
        || goal == 0
    {
        ic_cdk::trap(
            "Invalid input: all fields must be provided and funding_goal/goal must be > 0.",
        );
    }

    let now = ic_cdk::api::time();
    let campaign = Campaign {
        id: 0, // Will be set below
        title,
        description,
        funding_goal,
        current_funding: 0,
        legal_entity,
        status: Some("pending".to_string()),
        contact_info,
        doc_ids: vec![],
        category,
        business_registration,
        created_at: now,
        updated_at: now,
        amount_raised: 0,
        goal,
        end_date,
    };

    // Generate new campaign ID
    CAMPAIGN_COUNTER.with(|counter| {
        let mut counter = counter.borrow_mut();
        *counter += 1;
        let id = *counter;
        
        let mut campaign_with_id = campaign;
        campaign_with_id.id = id;
        
        CAMPAIGNS.with(|campaigns| {
            campaigns.borrow_mut().insert(id, campaign_with_id);
        });
        
        id
    })
}


/// Return all campaign cards.
#[query]
fn get_campaign_cards() -> Vec<CampaignCard> {
    CAMPAIGNS.with(|map| {
        map.borrow()
            .iter()
            .map(|(_, campaign)| to_card(&campaign))
            .collect()
    })
}

///return docs with campaign_id
#[query]
fn get_doc(doc_id: u64) -> Option<Doc> {
    DOCS.with(|docs| docs.borrow().get(&doc_id).cloned())
}

/// Return cards filtered by status (Active/Ended).
#[query]
fn get_campaign_cards_by_status(status: CampaignStatus) -> Vec<CampaignCard> {
    let now = now_secs() as i64;
    CAMPAIGNS.with(|map| {
        map.borrow()
            .iter()
            .map(|(_, campaign)| to_card(&campaign))
            .filter(|card| match status {
                CampaignStatus::Active => card.days_left >= 0 && (card.end_date as i64) >= now,
                CampaignStatus::Ended => card.days_left < 0 || (card.end_date as i64) < now,
            })
            .collect()
    })
}

/// Fetch a single campaign with its details.
#[query]
fn get_campaign_with_details(campaign_id: u64) -> Option<CampaignWithDetails> {
    get_campaign(campaign_id).map(|campaign| CampaignWithDetails {
        campaign: to_card(&campaign),
        details: campaign,
    })
}

/// Convenience: fetch a campaign by id
#[query]
fn get_campaign_by_id(campaign_id: u64) -> Option<Campaign> {
    get_campaign(campaign_id)
}

// ------------- Fund_Flow Integration Methods -------------

/// Get campaign metadata for Fund_Flow canister
#[query]
fn get_campaign_meta(campaign_id: u64) -> Option<CampaignMeta> {
    get_campaign(campaign_id).map(|campaign| CampaignMeta {
        campaign_id: campaign.id,
        goal: campaign.goal,
        amount_raised: campaign.amount_raised,
        end_date_secs: campaign.end_date,
    })
}

/// Receive ICP contribution from Fund_Flow canister
#[update]
fn receive_icp_contribution(campaign_id: u64, amount_e8s: u64) -> Result<(), String> {
    // Verify campaign exists
    let Some(campaign) = get_campaign(campaign_id) else {
        return Err("Campaign not found".into());
    };
    
    // Update ICP contributions tracking
    ICP_CONTRIBUTIONS.with(|contributions| {
        let mut contributions = contributions.borrow_mut();
        let current = contributions.get(&campaign_id).unwrap_or(&0).clone();
        contributions.insert(campaign_id, current + amount_e8s);
    });
    
    // Update campaign amount raised
    let new_amount = campaign.amount_raised + amount_e8s;
    update_campaign_amount(campaign_id, new_amount);
    
    // Update the campaign's current funding as well
    CAMPAIGNS.with(|campaigns| {
        if let Some(mut campaign) = campaigns.borrow_mut().get(&campaign_id) {
            campaign.current_funding = campaign.current_funding.saturating_add(amount_e8s);
            campaign.updated_at = ic_cdk::api::time();
            campaigns.borrow_mut().insert(campaign_id, campaign);
        }
    });
    
    Ok(())
}

/// Receive payout notification from Fund_Flow canister
#[update]
fn receive_payout(campaign_id: u64, total_amount: u64) -> Result<(), String> {
    // This method is called when Fund_Flow releases funds to project owner
    // For now, we just log the payout. In a real implementation, you might:
    // - Transfer ICP to project owner's wallet
    // - Update campaign status
    // - Send notifications
    
    ic_cdk::println!("Payout received for campaign {}: {} e8s", campaign_id, total_amount);
    
    // Update campaign status or mark as completed
    // You could add a status field to Campaign struct for this
    
    Ok(())
}

/// Get ICP contribution amount for a campaign
#[query]
fn get_icp_contribution(campaign_id: u64) -> u64 {
    ICP_CONTRIBUTIONS.with(|contributions| {
        contributions.borrow().get(&campaign_id).unwrap_or(&0).clone()
    })
}

/// Get total funding (ICP + other methods) for a campaign
#[query]
fn get_campaign_total_funding(campaign_id: u64) -> u64 {
    let campaign_amount = get_campaign(campaign_id).map(|c| c.amount_raised).unwrap_or(0);
    let icp_amount = get_icp_contribution(campaign_id);
    campaign_amount + icp_amount
}






// ------------- Canister Setup Methods -------------

/// Set the Controller canister principal for SPV integration
#[update]
fn set_controller_canister(controller: Principal) {
    let caller = ic_cdk::api::caller();
    if caller != ic_cdk::api::id() {
        ic_cdk::trap("Only admin can set controller canister");
    }
    CONTROLLER_CANISTER.with(|cell| {
        *cell.borrow_mut() = Some(controller);
    });
}

/// Set the PaymentGateway canister principal
#[update]
fn set_payment_gateway_canister(payment_gateway: Principal) {
    let caller = ic_cdk::api::caller();
    if caller != ic_cdk::api::id() {
        ic_cdk::trap("Only admin can set payment gateway canister");
    }
    PAYMENT_GATEWAY_CANISTER.with(|cell| {
        *cell.borrow_mut() = Some(payment_gateway);
    });
}

/// Set the Admin canister principal
#[update]
fn set_admin_canister(admin: Principal) {
    let caller = ic_cdk::api::caller();
    if caller != ic_cdk::api::id() {
        ic_cdk::trap("Only admin can set admin canister");
    }
    ADMIN_CANISTER.with(|cell| {
        *cell.borrow_mut() = Some(admin);
    });
}

// ------------- SPV Integration Methods -------------

/// Create an SPV deal for a campaign
#[update]
async fn create_spv_deal(campaign_id: u64, equity_percent: u8, total_raise: u64, fraction_price: u64) -> Result<u64, String> {
    // Verify campaign exists
    let Some(_campaign) = get_campaign(campaign_id) else {
        return Err("Campaign not found".into());
    };
    
    // Get controller canister
    let controller = CONTROLLER_CANISTER.with(|cell| cell.borrow().clone())
        .ok_or("Controller canister not set")?;
    
    // Call controller to create SPV deal
    let startup_id = format!("campaign_{}", campaign_id);
    let result: Result<(u64,), _> = ic_cdk::call(controller, "create_spv", (startup_id, equity_percent, total_raise, fraction_price)).await;
    
    match result {
        Ok((deal_id,)) => {
            // Map campaign to SPV deal
            CAMPAIGN_SPV_DEALS.with(|deals| {
                deals.borrow_mut().insert(campaign_id, deal_id);
            });
            Ok(deal_id)
        },
        Err(e) => Err(format!("Failed to create SPV deal: {:?}", e))
    }
}

/// Get SPV deals for a campaign
#[query]
fn get_spv_deals_for_campaign(campaign_id: u64) -> Vec<u64> {
    CAMPAIGN_SPV_DEALS.with(|deals| {
        deals.borrow().get(&campaign_id).map(|deal_id| vec![*deal_id]).unwrap_or_default()
    })
}

/// Link campaign to existing SPV deal
#[update]
fn link_campaign_to_spv(campaign_id: u64, deal_id: u64) -> Result<(), String> {
    // Verify campaign exists
    let Some(_campaign) = get_campaign(campaign_id) else {
        return Err("Campaign not found".into());
    };
    
    // Map campaign to SPV deal
    CAMPAIGN_SPV_DEALS.with(|deals| {
        deals.borrow_mut().insert(campaign_id, deal_id);
    });
    
    Ok(())
}

/// Get SPV deal information for a campaign
#[query]
fn get_spv_deal_info(campaign_id: u64) -> Option<SPVDealInfo> {
    let deal_id = CAMPAIGN_SPV_DEALS.with(|deals| {
        deals.borrow().get(&campaign_id).cloned()
    })?;
    
    let _controller = CONTROLLER_CANISTER.with(|cell| cell.borrow().clone())?;
    
    // This would need to be implemented as an async call in a real scenario
    // For now, return basic info
    Some(SPVDealInfo {
        deal_id,
        campaign_id,
        equity_percent: 0, // Would need to fetch from controller
        total_raise: 0,
        fraction_price: 0,
        spv_canister: None,
        spv_token_canister: None,
    })
}

/// Receive SPV contribution notification
#[update]
fn receive_spv_contribution(campaign_id: u64, amount: u64) -> Result<(), String> {
    // Verify campaign exists
    let Some(_campaign) = get_campaign(campaign_id) else {
        return Err("Campaign not found".into());
    };
    
    // Update SPV contributions tracking
    SPV_CONTRIBUTIONS.with(|contributions| {
        let mut contributions = contributions.borrow_mut();
        let current = contributions.get(&campaign_id).unwrap_or(&0).clone();
        contributions.insert(campaign_id, current + amount);
    });
    
    // Update campaign amount raised
    let campaign_amount = get_campaign(campaign_id).map(|c| c.amount_raised).unwrap_or(0);
    let new_amount = campaign_amount + amount;
    update_campaign_amount(campaign_id, new_amount);
    
    Ok(())
}

// ------------- PaymentGateway Integration Methods -------------

/// Get user payment methods from PaymentGateway
#[update]
async fn get_user_payment_methods(user: Option<Principal>) -> Result<Vec<PaymentMethodDetail>, String> {
    let payment_gateway = PAYMENT_GATEWAY_CANISTER.with(|cell| cell.borrow().clone())
        .ok_or("PaymentGateway canister not set")?;
    
    let who = user.unwrap_or(ic_cdk::api::caller());
    let result: Result<(Vec<PaymentMethodDetail>,), _> = ic_cdk::call(payment_gateway, "get_user_payment_methods", (Some(who),)).await;
    
    match result {
        Ok((methods,)) => Ok(methods),
        Err(e) => Err(format!("Failed to get payment methods: {:?}", e))
    }
}

/// Process traditional payment through PaymentGateway
#[update]
fn process_traditional_payment(campaign_id: u64, _payment_method_id: u64, amount: u64) -> Result<u64, String> {
    // Verify campaign exists
    let Some(_campaign) = get_campaign(campaign_id) else {
        return Err("Campaign not found".into());
    };
    
    let _payment_gateway = PAYMENT_GATEWAY_CANISTER.with(|cell| cell.borrow().clone())
        .ok_or("PaymentGateway canister not set")?;
    
    // For now, simulate payment processing
    // In a real implementation, this would call PaymentGateway methods
    let payment_id = ic_cdk::api::time(); // Use timestamp as payment ID
    
    // Update traditional contributions tracking
    TRADITIONAL_CONTRIBUTIONS.with(|contributions| {
        let mut contributions = contributions.borrow_mut();
        let current = contributions.get(&campaign_id).unwrap_or(&0).clone();
        contributions.insert(campaign_id, current + amount);
    });
    
    // Update campaign amount raised
    let campaign_amount = get_campaign(campaign_id).map(|c| c.amount_raised).unwrap_or(0);
    let new_amount = campaign_amount + amount;
    update_campaign_amount(campaign_id, new_amount);
    
    Ok(payment_id)
}

// ------------- Unified Funding Methods -------------

/// Get unified funding information for a campaign
#[query]
fn get_unified_funding(campaign_id: u64) -> Option<UnifiedFunding> {
    let campaign = get_campaign(campaign_id)?;
    
    let icp_raised = ICP_CONTRIBUTIONS.with(|contributions| {
        contributions.borrow().get(&campaign_id).unwrap_or(&0).clone()
    });
    
    let traditional_raised = TRADITIONAL_CONTRIBUTIONS.with(|contributions| {
        contributions.borrow().get(&campaign_id).unwrap_or(&0).clone()
    });
    
    let spv_raised = SPV_CONTRIBUTIONS.with(|contributions| {
        contributions.borrow().get(&campaign_id).unwrap_or(&0).clone()
    });
    
    let total_raised = icp_raised + traditional_raised + spv_raised;
    
    Some(UnifiedFunding {
        total_goal: campaign.goal,
        icp_raised,
        traditional_raised,
        spv_raised,
        total_raised,
    })
}

/// Get traditional payment contribution amount for a campaign
#[query]
fn get_traditional_contribution(campaign_id: u64) -> u64 {
    TRADITIONAL_CONTRIBUTIONS.with(|contributions| {
        contributions.borrow().get(&campaign_id).unwrap_or(&0).clone()
    })
}

/// Get SPV contribution amount for a campaign
#[query]
fn get_spv_contribution(campaign_id: u64) -> u64 {
    SPV_CONTRIBUTIONS.with(|contributions| {
        contributions.borrow().get(&campaign_id).unwrap_or(&0).clone()
    })
}

// ------------- Admin Integration Methods -------------

/// Submit campaign for admin approval
#[update]
async fn submit_campaign_for_approval(campaign_id: u64) -> Result<(), String> {
    // Verify campaign exists
    let Some(mut campaign) = get_campaign(campaign_id) else {
        return Err("Campaign not found".into());
    };
    
    // Update campaign status to pending approval
    campaign.status = Some("pending_approval".to_string());
    campaign.updated_at = ic_cdk::api::time();
    
    CAMPAIGNS.with(|campaigns| {
        campaigns.borrow_mut().insert(campaign_id, campaign);
    });
    
    // Notify admin canister if set
    if let Some(admin) = ADMIN_CANISTER.with(|cell| cell.borrow().clone()) {
        let _: Result<((),), _> = ic_cdk::call(admin, "notify_campaign_submission", (campaign_id,)).await;
    }
    
    Ok(())
}

/// Get campaign approval status
#[query]
fn get_campaign_approval_status(campaign_id: u64) -> Option<String> {
    get_campaign(campaign_id).and_then(|c| c.status)
}

/// Approve campaign (admin only)
#[update]
fn approve_campaign(campaign_id: u64) -> Result<(), String> {
    let caller = ic_cdk::api::caller();
    
    // Check if caller is admin canister
    let is_admin = ADMIN_CANISTER.with(|cell| {
        cell.borrow().as_ref().map(|admin| *admin == caller).unwrap_or(false)
    });
    
    if !is_admin {
        return Err("Only admin can approve campaigns".into());
    }
    
    // Verify campaign exists
    let Some(mut campaign) = get_campaign(campaign_id) else {
        return Err("Campaign not found".into());
    };
    
    // Update campaign status to approved
    campaign.status = Some("approved".to_string());
    campaign.updated_at = ic_cdk::api::time();
    
    CAMPAIGNS.with(|campaigns| {
        campaigns.borrow_mut().insert(campaign_id, campaign);
    });
    
    Ok(())
}

// Export Candid for tooling & UI integration
ic_cdk::export_candid!();
