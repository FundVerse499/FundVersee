use candid::{CandidType, Deserialize, Principal};
use ic_cdk_macros::{update, query, init};
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct DealTerms {
    pub startup_id: String,
    pub equity_percent: u8,
    pub total_raise: u64,
    pub fraction_price: u64,
    pub spv_canister: Option<Principal>,
    pub spv_token_canister: Option<Principal>,
    pub payment_gateway_canister: Option<Principal>,
}

static mut DEALS: Option<HashMap<u64, DealTerms>> = None;
static mut DEAL_COUNTER: u64 = 0;
static mut PAYMENT_GATEWAY: Option<Principal> = None;

#[init]
fn init() {
    unsafe {
        DEALS = Some(HashMap::new());
    }
}

#[update]
fn set_payment_gateway(payment_gateway: Principal) {
    unsafe {
        PAYMENT_GATEWAY = Some(payment_gateway);
    }
}

#[update]
fn create_spv(startup_id: String, equity_percent: u8, total_raise: u64, fraction_price: u64) -> u64 {
    unsafe {
        let deal_id = DEAL_COUNTER + 1;
        let terms = DealTerms {
            startup_id,
            equity_percent,
            total_raise,
            fraction_price,
            spv_canister: None, // to be set when SPV deployed
            spv_token_canister: None, // to be set when SPV Token deployed
            payment_gateway_canister: PAYMENT_GATEWAY,
        };
        DEALS.get_or_insert(HashMap::new()).insert(deal_id, terms);
        DEAL_COUNTER = deal_id;
        deal_id
    }
}

#[update]
fn set_spv_canisters(deal_id: u64, spv_canister: Principal, spv_token_canister: Principal) -> Result<(), String> {
    unsafe {
        if let Some(deals) = DEALS.as_mut() {
            if let Some(deal) = deals.get_mut(&deal_id) {
                deal.spv_canister = Some(spv_canister);
                deal.spv_token_canister = Some(spv_token_canister);
                Ok(())
            } else {
                Err("Deal not found".into())
            }
        } else {
            Err("Deals not initialized".into())
        }
    }
}

#[update]
fn invest_in_spv(
    deal_id: u64,
    investor: Principal,
    amount: u64,
    payment_method_id: u64,
) -> Result<u64, String> {
    unsafe {
        // Get deal information
        let deal = DEALS
            .as_ref()
            .unwrap()
            .get(&deal_id)
            .ok_or("Deal not found")?;
        
        let payment_gateway = deal.payment_gateway_canister
            .ok_or("Payment gateway not configured")?;
        
        // Calculate fractions
        let fractions = amount / deal.fraction_price;
        if fractions == 0 {
            return Err("Investment amount too small".into());
        }
        
        // For now, just return a mock payment ID
        // In a real implementation, this would call the PaymentGateway
        let payment_id = 1000 + deal_id; // Mock payment ID
        ic_cdk::println!("Investment initiated for deal {}: {} EGP", deal_id, amount);
        
        Ok(payment_id)
    }
}

#[update]
fn complete_investment(deal_id: u64, payment_id: u64) -> Result<(), String> {
    unsafe {
        // Get deal information
        let deal = DEALS
            .as_ref()
            .unwrap()
            .get(&deal_id)
            .ok_or("Deal not found")?;
        
        // For now, just simulate successful completion
        // In a real implementation, this would verify payment and mint certificates
        ic_cdk::println!("Investment completed for deal {} with payment ID {}", deal_id, payment_id);
        
        Ok(())
    }
}

#[query]
fn list_deals() -> Vec<(u64, DealTerms)> {
    unsafe {
        DEALS
            .as_ref()
            .unwrap_or(&HashMap::new())
            .iter()
            .map(|(k, v)| (*k, v.clone()))
            .collect()
    }
}
