use candid::{CandidType, Deserialize, Principal};
use ic_cdk_macros::{update, query};
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct DealTerms {
    pub startup_id: String,
    pub equity_percent: u8,
    pub total_raise: u64,
    pub fraction_price: u64,
    pub spv_canister: Option<Principal>,
}

static mut DEALS: Option<HashMap<u64, DealTerms>> = None;
static mut DEAL_COUNTER: u64 = 0;

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
        };
        DEALS.get_or_insert(HashMap::new()).insert(deal_id, terms);
        DEAL_COUNTER = deal_id;
        deal_id
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
