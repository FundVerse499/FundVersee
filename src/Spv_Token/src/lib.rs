use candid::{CandidType, Deserialize, Principal};
use ic_cdk_macros::{update, query, init};
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct InvestmentCertificate {
    pub token_id: u64,
    pub owner: Principal,
    pub spv_id: u64,
    pub deal_id: u64,
    pub investment_amount: u64,
    pub fractions: u64,
    pub created_at: u64,
    pub is_transferable: bool, // Always false for investment certificates
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct CertificateMetadata {
    pub name: String,
    pub description: String,
    pub image_url: String,
    pub attributes: Vec<(String, String)>,
}

static mut CERTIFICATES: Option<HashMap<u64, InvestmentCertificate>> = None;
static mut OWNER_TOKENS: Option<HashMap<Principal, Vec<u64>>> = None;
static mut TOKEN_COUNTER: u64 = 0;
static mut SPV_CANISTER: Option<Principal> = None;

#[init]
fn init() {
    unsafe {
        CERTIFICATES = Some(HashMap::new());
        OWNER_TOKENS = Some(HashMap::new());
    }
}

#[update]
fn set_spv_canister(spv_canister: Principal) {
    unsafe {
        SPV_CANISTER = Some(spv_canister);
    }
}

#[update]
fn mint_certificate(
    to: Principal,
    spv_id: u64,
    deal_id: u64,
    investment_amount: u64,
    fractions: u64,
) -> Result<u64, String> {
    unsafe {
        let token_id = TOKEN_COUNTER + 1;
        TOKEN_COUNTER = token_id;
        
        let certificate = InvestmentCertificate {
            token_id,
            owner: to,
            spv_id,
            deal_id,
            investment_amount,
            fractions,
            created_at: ic_cdk::api::time(),
            is_transferable: false, // Investment certificates are non-transferable
        };
        
        CERTIFICATES.get_or_insert(HashMap::new()).insert(token_id, certificate);
        
        // Add to owner's token list
        OWNER_TOKENS
            .get_or_insert(HashMap::new())
            .entry(to)
            .or_insert_with(Vec::new)
            .push(token_id);
        
        Ok(token_id)
    }
}

#[query]
fn get_certificate(token_id: u64) -> Option<InvestmentCertificate> {
    unsafe {
        CERTIFICATES
            .as_ref()
            .unwrap()
            .get(&token_id)
            .cloned()
    }
}

#[query]
fn get_owner_certificates(owner: Principal) -> Vec<InvestmentCertificate> {
    unsafe {
        if let Some(owner_tokens) = OWNER_TOKENS.as_ref() {
            if let Some(token_ids) = owner_tokens.get(&owner) {
                let mut certificates = Vec::new();
                if let Some(certs) = CERTIFICATES.as_ref() {
                    for &token_id in token_ids {
                        if let Some(cert) = certs.get(&token_id) {
                            certificates.push(cert.clone());
                        }
                    }
                }
                certificates
            } else {
                Vec::new()
            }
        } else {
            Vec::new()
        }
    }
}

#[query]
fn get_certificate_metadata(token_id: u64) -> Option<CertificateMetadata> {
    unsafe {
        if let Some(cert) = CERTIFICATES.as_ref().unwrap().get(&token_id) {
            Some(CertificateMetadata {
                name: format!("Investment Certificate #{}", token_id),
                description: format!(
                    "Investment certificate for SPV {} - {} fractions worth {} EGP",
                    cert.spv_id, cert.fractions, cert.investment_amount
                ),
                image_url: "https://example.com/certificate.png".to_string(),
                attributes: vec![
                    ("SPV ID".to_string(), cert.spv_id.to_string()),
                    ("Deal ID".to_string(), cert.deal_id.to_string()),
                    ("Investment Amount".to_string(), cert.investment_amount.to_string()),
                    ("Fractions".to_string(), cert.fractions.to_string()),
                    ("Non-Transferable".to_string(), "true".to_string()),
                ],
            })
        } else {
            None
        }
    }
}

#[query]
fn balance_of(owner: Principal) -> u64 {
    unsafe {
        if let Some(owner_tokens) = OWNER_TOKENS.as_ref() {
            if let Some(token_ids) = owner_tokens.get(&owner) {
                token_ids.len() as u64
            } else {
                0
            }
        } else {
            0
        }
    }
}

// Legacy function for backward compatibility
#[update]
fn mint(to: Principal, amount: u64) {
    // This is now deprecated - use mint_certificate instead
    ic_cdk::trap("Use mint_certificate instead of mint");
}
