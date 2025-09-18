//! PaymentGateway canister for FundVerse
//! - stores user payment method references (masked) isolated in its own canister
//! - provides register/get/deactivate APIs
//! - performs basic validation (length, Luhn for cards, simple IBAN-ish checks)
//! Security: DO NOT store full card numbers or CVV. Only masked strings are stored.

use ic_cdk::api;
use bincode;
use ic_cdk_macros::{init, query, update};
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    storable::Bound,
    DefaultMemoryImpl, StableBTreeMap, Storable,
};
use candid::{CandidType, Decode, Encode, Principal};
use serde::Deserialize;

use std::borrow::Cow;
use std::cell::RefCell;

type Memory = VirtualMemory<DefaultMemoryImpl>;
const MAX_VALUE_SIZE: u32 = 8 * 1024;

// -------- Newtype Wrapper --------
#[derive(Clone, Debug, Default)]
pub struct U64Vec(pub Vec<u64>);

impl Storable for U64Vec {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(
            bincode::serialize(&self.0)
                .expect("failed to serialize Vec<u64>")
        )
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        if bytes.is_empty() {
            return U64Vec(Vec::new());
        }
        U64Vec(
            bincode::deserialize::<Vec<u64>>(&bytes)
                .expect("failed to deserialize Vec<u64>")
        )
    }

    const BOUND: Bound = Bound::Unbounded;
}

// -------- Thread Locals --------
thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static PAYMENT_METHODS: RefCell<StableBTreeMap<u64, PaymentMethodDetail, Memory>> =
        RefCell::new(MEMORY_MANAGER.with(|mm| {
            StableBTreeMap::init(mm.borrow().get(MemoryId::new(0)))
        }));

    static USER_INDEX: RefCell<StableBTreeMap<Vec<u8>, U64Vec, Memory>> =
        RefCell::new(MEMORY_MANAGER.with(|mm| {
            StableBTreeMap::init(mm.borrow().get(MemoryId::new(1)))
        }));
}

// -------- Helpers --------
fn next_payment_method_id() -> u64 {
    PAYMENT_METHODS.with(|m| (m.borrow().len() as u64) + 1)
}

fn now_ns() -> u64 {
    api::time()
}

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct PaymentMethodDetail {
    pub id: u64,
    pub owner: Principal,
    pub method_type: String,    // "Card", "Wallet", "Bank", "Fawry", "PayMob", "Other"
    pub provider: String,       // e.g., "Visa", "VodafoneCash", "BankName"
    pub masked_account: String, // masked form only
    pub currency: String,       // "EGP", "USD", ...
    pub is_active: bool,
    pub created_at_ns: u64,
}

impl Storable for PaymentMethodDetail {
    fn to_bytes(&self) -> Cow<[u8]> {
        Cow::Owned(Encode!(self).expect("encode PaymentMethodDetail"))
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        Decode!(bytes.as_ref(), Self).expect("decode PaymentMethodDetail")
    }

    const BOUND: Bound = Bound::Bounded {
        max_size: MAX_VALUE_SIZE,
        is_fixed_size: false,
    };
}

fn mask_account_identifier(method_type: &str, identifier: &str) -> String {
    let s = identifier.trim();
    if s.len() <= 4 {
        return "****".to_string();
    }
    match method_type.to_lowercase().as_str() {
        "card" => {
            let last = &s[s.len().saturating_sub(4)..];
            format!("************{}", last)
        }
        "wallet" => {
            let last = &s[s.len().saturating_sub(3)..];
            format!("******{}", last)
        }
        _ => {
            let last = &s[s.len().saturating_sub(4)..];
            format!("****{}", last)
        }
    }
}

fn validate_account_identifier(method_type: &str, identifier: &str) -> bool {
    let s = identifier.trim();
    if s.is_empty() {
        return false;
    }
    match method_type.to_lowercase().as_str() {
        "card" => {
            if !s.chars().all(|c| c.is_ascii_digit()) {
                return false;
            }
            let len = s.len();
            if len < 13 || len > 19 {
                return false;
            }
            luhn_check(s)
        }
        "wallet" => {
            let len = s.len();
            s.chars().all(|c| c.is_ascii_digit()) && (len >= 7 && len <= 15)
        }
        "iban" | "bank" => {
            let len = s.len();
            s.chars().all(|c| c.is_ascii_alphanumeric()) && (len >= 8 && len <= 34)
        }
        _ => true,
    }
}

fn luhn_check(number: &str) -> bool {
    let mut sum = 0;
    let mut alt = false;
    for ch in number.chars().rev() {
        if let Some(d) = ch.to_digit(10) {
            let mut d = d as u32;
            if alt {
                d *= 2;
                if d > 9 {
                    d -= 9;
                }
            }
            sum += d;
            alt = !alt;
        } else {
            return false;
        }
    }
    sum % 10 == 0
}

// -------- API --------
#[update]
fn register_payment_method(
    method_type: String,
    provider: String,
    account_identifier: String,
    currency: String,
) -> Result<u64, String> {
    let caller = api::caller();
    if method_type.trim().is_empty() || provider.trim().is_empty() || currency.trim().is_empty() {
        return Err("method_type, provider and currency are required".into());
    }
    if !validate_account_identifier(&method_type, &account_identifier) {
        return Err("account_identifier validation failed".into());
    }

    let masked = mask_account_identifier(&method_type, &account_identifier);
    let id = next_payment_method_id();
    let detail = PaymentMethodDetail {
        id,
        owner: caller,
        method_type: method_type.clone(),
        provider: provider.clone(),
        masked_account: masked,
        currency: currency.clone(),
        is_active: true,
        created_at_ns: now_ns(),
    };

    // store detail
    PAYMENT_METHODS.with(|m| {
        m.borrow_mut().insert(id, detail.clone());
    });

    // store id inside user index
    let key = caller.as_slice().to_vec();
    USER_INDEX.with(|idx| {
        let mut map = idx.borrow_mut();
        let mut values = map.get(&key).map(|v| v.0.clone()).unwrap_or_default();
        values.push(id);
        map.insert(key, U64Vec(values));
    });

    Ok(id)
}

#[query]
fn get_user_payment_methods(p: Option<Principal>) -> Vec<PaymentMethodDetail> {
    let who = p.unwrap_or(api::caller());
    let key = who.as_slice().to_vec();
    let mut res: Vec<PaymentMethodDetail> = Vec::new();
    USER_INDEX.with(|idx| {
        let map = idx.borrow();
        if let Some(ids) = map.get(&key) {
            PAYMENT_METHODS.with(|pm| {
                for id in &ids.0 {
                    if let Some(d) = pm.borrow().get(&id) {
                        res.push(d.clone());
                    }
                }
            });
        }
    });
    res
}

#[update]
fn deactivate_payment_method(id: u64) -> Result<(), String> {
    let caller = api::caller();
    let detail_opt = PAYMENT_METHODS.with(|pm| pm.borrow().get(&id).map(|d| d.clone()));
    if let Some(mut detail) = detail_opt {
        if detail.owner == caller {
            detail.is_active = false;
            PAYMENT_METHODS.with(|pm| pm.borrow_mut().insert(id, detail));
            return Ok(());
        }
    }
    Err("not found or not owner".into())
}

#[query]
fn get_payment_method(id: u64) -> Option<PaymentMethodDetail> {
    PAYMENT_METHODS.with(|pm| pm.borrow().get(&id).map(|d| d.clone()))
}

#[init]
fn init() {
    ic_cdk::println!("PaymentGateway initialized");
}

#[cfg(test)]
mod tests {
    use super::*;
    use ic_cdk::export_candid;
}

ic_cdk::export_candid!();