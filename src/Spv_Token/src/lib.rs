use candid::{CandidType, Deserialize, Principal};
use ic_cdk_macros::{update, query};
use std::collections::HashMap;

static mut BALANCES: Option<HashMap<Principal, u64>> = None;

#[update]
fn mint(to: Principal, amount: u64) {
    unsafe {
        let balances = BALANCES.get_or_insert(HashMap::new());
        let entry = balances.entry(to).or_insert(0);
        *entry += amount;
    }
}

#[query]
fn balance_of(owner: Principal) -> u64 {
    unsafe {
        BALANCES
            .as_ref()
            .unwrap()
            .get(&owner)
            .cloned()
            .unwrap_or(0)
    }
}
