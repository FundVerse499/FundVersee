use candid::{CandidType, Deserialize, Principal};
use ic_cdk_macros::{query, update};
use std::collections::HashMap;

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct Investor {
    pub investor_principal: Principal,
    pub fractions: u64,
}

static mut INVESTORS: Option<HashMap<Principal, u64>> = None;
static mut TOTAL_SUPPLY: u64 = 0;
static mut FRACTION_PRICE: u64 = 0;

#[update]
fn init_spv(total_supply: u64, fraction_price: u64) {
    unsafe {
        TOTAL_SUPPLY = total_supply;
        FRACTION_PRICE = fraction_price;
        INVESTORS = Some(HashMap::new());
    }
}

#[update]
fn add_investor(investor: Principal, amount_in_egp: u64) -> Result<(), String> {
    unsafe {
        let fractions = amount_in_egp / FRACTION_PRICE;
        let inv_map = INVESTORS.as_mut().unwrap();
        let entry = inv_map.entry(investor).or_insert(0);
        *entry += fractions;
        Ok(())
    }
}

#[query]
fn investor_balance(owner: Principal) -> u64 {
    unsafe {
        INVESTORS
            .as_ref()
            .unwrap()
            .get(&owner)
            .cloned()
            .unwrap_or(0)
    }
}

#[update]
fn distribute_exit(total_exit_value: u64) -> HashMap<Principal, u64> {
    unsafe {
        let mut payouts = HashMap::new();
        let inv_map = INVESTORS.as_ref().unwrap();
        for (investor, fractions) in inv_map {
            let payout = (fractions * total_exit_value) / TOTAL_SUPPLY;
            payouts.insert(*investor, payout);
        }
        payouts
    }
}
