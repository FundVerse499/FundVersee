//! PaymentGateway canister for FundVerse
//! - stores user payment method references (masked) isolated in its own canister
//! - provides register/get/deactivate APIs
//! - performs basic validation (length, Luhn for cards, simple IBAN-ish checks)
//! Security: DO NOT store full card numbers or CVV. Only masked strings are stored.

use candid::{CandidType, Deserialize, Principal};
use ic_cdk_macros::{init, query, update};
use std::collections::HashMap;

// -------- Thread Locals --------
thread_local! {
    static PAYMENT_METHODS: std::cell::RefCell<HashMap<u64, PaymentMethodDetail>> = 
        std::cell::RefCell::new(HashMap::new());
    
    static USER_INDEX: std::cell::RefCell<HashMap<Principal, Vec<u64>>> = 
        std::cell::RefCell::new(HashMap::new());
    
    static ID_COUNTER: std::cell::RefCell<u64> = std::cell::RefCell::new(0);
    
    static PAYMENT_VERIFICATIONS: std::cell::RefCell<HashMap<u64, PaymentVerification>> = 
        std::cell::RefCell::new(HashMap::new());
    
    static SPV_TOKEN_CANISTER: std::cell::RefCell<Option<Principal>> = 
        std::cell::RefCell::new(None);
}

// -------- Helpers --------
fn next_payment_method_id() -> u64 {
    ID_COUNTER.with(|cell| {
        let mut c = cell.borrow_mut();
        *c += 1;
        *c
    })
}

fn now_ns() -> u64 {
    ic_cdk::api::time()
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

#[derive(CandidType, Deserialize, Clone, Debug)]
pub struct PaymentVerification {
    pub payment_id: u64,
    pub investor: Principal,
    pub spv_id: u64,
    pub deal_id: u64,
    pub amount: u64,
    pub payment_method_id: u64,
    pub status: PaymentStatus,
    pub created_at_ns: u64,
    pub verified_at_ns: Option<u64>,
}

#[derive(CandidType, Deserialize, Clone, Debug, PartialEq)]
pub enum PaymentStatus {
    Pending,
    Verified,
    Failed,
    Refunded,
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
    let caller = ic_cdk::api::caller();
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
    USER_INDEX.with(|idx| {
        let mut map = idx.borrow_mut();
        let values = map.entry(caller).or_insert_with(Vec::new);
        values.push(id);
    });

    Ok(id)
}

#[query]
fn get_user_payment_methods(p: Option<Principal>) -> Vec<PaymentMethodDetail> {
    let who = p.unwrap_or(ic_cdk::api::caller());
    let mut res: Vec<PaymentMethodDetail> = Vec::new();
    USER_INDEX.with(|idx| {
        let map = idx.borrow();
        if let Some(ids) = map.get(&who) {
            PAYMENT_METHODS.with(|pm| {
                for id in ids {
                    if let Some(d) = pm.borrow().get(&id) {
                        if d.is_active {
                            res.push(d.clone());
                        }
                    }
                }
            });
        }
    });
    res
}

#[update]
fn deactivate_payment_method(id: u64) -> Result<(), String> {
    let caller = ic_cdk::api::caller();
    let detail_opt = PAYMENT_METHODS.with(|pm| pm.borrow().get(&id).map(|d| d.clone()));
    if let Some(mut detail) = detail_opt {
        if detail.owner != caller {
            return Err("You are not the owner of this payment method".into());
        }
        detail.is_active = false;
        PAYMENT_METHODS.with(|pm| pm.borrow_mut().insert(id, detail));
        return Ok(());
    }
    Err("Payment method not found".into())
}

#[query]
fn get_payment_method(id: u64) -> Option<PaymentMethodDetail> {
    PAYMENT_METHODS.with(|pm| pm.borrow().get(&id).map(|d| d.clone()))
}

#[init]
fn init() {
    ic_cdk::println!("PaymentGateway initialized");
}

#[update]
fn set_spv_token_canister(spv_token_canister: Principal) {
    let caller = ic_cdk::api::caller();
    // Only allow admin or the canister itself to set this
    if caller != ic_cdk::api::id() {
        ic_cdk::trap("Only admin can set SPV token canister");
    }
    
    SPV_TOKEN_CANISTER.with(|cell| {
        *cell.borrow_mut() = Some(spv_token_canister);
    });
}

#[update]
fn initiate_payment(
    spv_id: u64,
    deal_id: u64,
    amount: u64,
    payment_method_id: u64,
) -> Result<u64, String> {
    let caller = ic_cdk::api::caller();
    
    // Verify payment method belongs to caller
    let payment_method = PAYMENT_METHODS.with(|pm| pm.borrow().get(&payment_method_id).cloned());
    if let Some(method) = payment_method {
        if method.owner != caller || !method.is_active {
            return Err("Invalid or inactive payment method".into());
        }
    } else {
        return Err("Payment method not found".into());
    }
    
    let payment_id = next_payment_method_id();
    let verification = PaymentVerification {
        payment_id,
        investor: caller,
        spv_id,
        deal_id,
        amount,
        payment_method_id,
        status: PaymentStatus::Pending,
        created_at_ns: now_ns(),
        verified_at_ns: None,
    };
    
    PAYMENT_VERIFICATIONS.with(|pv| {
        pv.borrow_mut().insert(payment_id, verification);
    });
    
    // In a real implementation, this would trigger external payment processing
    // For now, we'll simulate verification after a delay
    ic_cdk::println!("Payment initiated for payment_id: {}, amount: {}", payment_id, amount);
    
    Ok(payment_id)
}

#[update]
fn verify_payment(payment_id: u64) -> Result<(), String> {
    let verification_opt = PAYMENT_VERIFICATIONS.with(|pv| pv.borrow().get(&payment_id).cloned());
    
    if let Some(mut verification) = verification_opt {
        if verification.status != PaymentStatus::Pending {
            return Err("Payment already processed".into());
        }
        
        // Simulate payment verification (in real implementation, this would check with payment provider)
        verification.status = PaymentStatus::Verified;
        verification.verified_at_ns = Some(now_ns());
        
        PAYMENT_VERIFICATIONS.with(|pv| {
            pv.borrow_mut().insert(payment_id, verification.clone());
        });
        
        // For now, just simulate certificate minting
        // In a real implementation, this would call the SPV Token canister
        let fractions = verification.amount / 1000; // Assuming 1000 EGP per fraction
        let token_id = verification.payment_id + 10000; // Mock token ID
        ic_cdk::println!("Certificate would be minted with token_id: {} for {} fractions", token_id, fractions);
        
        Ok(())
    } else {
        Err("Payment verification not found".into())
    }
}

#[query]
fn get_payment_verification(payment_id: u64) -> Option<PaymentVerification> {
    PAYMENT_VERIFICATIONS.with(|pv| pv.borrow().get(&payment_id).cloned())
}

#[query]
fn get_investor_payments(investor: Principal) -> Vec<PaymentVerification> {
    let mut payments = Vec::new();
    PAYMENT_VERIFICATIONS.with(|pv| {
        for (_, verification) in pv.borrow().iter() {
            if verification.investor == investor {
                payments.push(verification.clone());
            }
        }
    });
    payments
}

#[cfg(test)]
mod tests {
    use super::*;
    use ic_cdk::export_candid;
}

ic_cdk::export_candid!();