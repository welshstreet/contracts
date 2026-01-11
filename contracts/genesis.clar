;; Welsh Street Liquidity Generation Event (Genesis)
;;
;; -------------------------------------------------------------------------
;; SMART CONTRACT DISCLAIMER: READ BEFORE USE
;; -------------------------------------------------------------------------
;; This smart contract is provided on an AS-IS, AS-AVAILABLE basis with
;; no warranties of any kind. By interacting with this contract, you agree
;; to the following terms and conditions:
;;
;; 1. NO INVESTMENT OR FINANCIAL PRODUCT
;;    - This contract, its tokens, and all related functionality are NOT
;;      financial products and are NOT designed or intended for investment,
;;      speculation, or financial return.
;;    - Nothing in this contract constitutes an offer to sell securities,
;;      investment advice, financial promotion, or solicitation of funds.
;;
;; 2. NO GUARANTEES OR WARRANTIES
;;    - The contract may contain bugs, errors, or unexpected behavior.
;;    - The developers make NO guarantees regarding uptime, security,
;;      performance, token behavior, or continued availability.
;;    - All interactions are irreversible and executed automatically by the
;;      blockchain without developer control.
;;
;; 3. USER RESPONSIBILITY & ASSUMPTION OF RISK
;;    - You acknowledge that interacting with blockchain contracts carries
;;      inherent risks, including loss of tokens, market volatility, and
;;      smart-contract vulnerabilities.
;;    - You are solely responsible for your wallet, private keys, and all
;;      transactions initiated by you or your software.
;;    - You agree that you are using this contract entirely at your own risk.
;;
;; 4. NO DEVELOPER LIABILITY
;;    - The developers, contributors, and associated entities bear NO liability
;;      for any loss, damage, or claim arising from:
;;        - Smart-contract malfunction or exploit
;;        - User error
;;        - Token value fluctuations
;;        - Third-party integrations or UI interactions
;;        - Regulatory actions or changes in law
;;
;; 5. NON-CUSTODIAL & PERMISSIONLESS
;;    - The developers do not custody user funds and cannot intervene,
;;      modify, reverse, or halt transactions.
;;    - All transactions are executed autonomously by the network.
;;
;; 6. COMPLIANCE WITH LOCAL LAWS
;;    - You are solely responsible for ensuring that your use of this contract
;;      complies with all applicable laws, regulations, and tax obligations in
;;      your jurisdiction.
;;
;; 7. USER ACKNOWLEDGEMENT
;;    By using or interacting with this contract, you confirm that:
;;      - You have read and understand this disclaimer.
;;      - You accept all associated risks.
;;      - You do not rely on the developers for financial gain, support,
;;        maintenance, or continued operation of this software.
;;
;; -------------------------------------------------------------------------
;; END OF DISCLAIMER
;; -------------------------------------------------------------------------

(use-trait sip-010 'ST1NXBK3K5YYMD6FD41MVNP3JS1GABZ8TRVX023PT.sip-010-trait-ft-standard.sip-010-trait)

;; welshcorgicoin - use .welshcorgicoin for local devnet
(define-constant WELSH .welshcorgicoin)

;; errors
(define-constant ERR_ZERO_AMOUNT (err u1000))
(define-constant ERR_NOT_CONTRACT_OWNER (err u1001))
(define-constant ERR_NOT_ACTIVE_FUND (err u1002))

;; metadata
(define-constant CONTRACT_OWNER tx-sender)
(define-constant TOTAL_STREET u1000000000000000)

;; variables
(define-data-var claim-active bool false)
(define-data-var contribute-active bool true)
(define-data-var total-contribution uint u0)

(define-map balances
    { address: principal }
    { balance: uint,
    claimed: uint }
)

(define-public (claim)
    (let (
        (user-balance-info (default-to { balance: u0 } (map-get? balances { address: tx-sender })))
        (user-balance (get balance user-balance-info))
        (total-contrib (var-get total-contribution))
        (user-claim (if (> total-contrib u0)
                            (/ (* user-balance TOTAL_STREET) total-contrib)
                            u0))
    )
    (begin
        (asserts! (is-eq (var-get claim-active) true) ERR_NOT_ACTIVE_FUND)
        (asserts! (> user-balance u0) ERR_ZERO_AMOUNT)
        (try! (transformer .street user-claim tx-sender))
        (map-set balances { address: tx-sender } {
            balance: u0,
            claimed: user-claim
            })
        (ok {
            balance: user-balance,
            claimed: user-claim
        })
    )
    )
)

;; #[allow(unchecked_data)]
(define-public (contribute (amount uint))
    (let (
        (current-total (var-get total-contribution))
        (current-balance (default-to { balance: u0 } (map-get? balances { address: tx-sender })))
        (previous-balance (get balance current-balance))
        (new-balance (+ previous-balance amount))
        (new-total (+ current-total amount))
    )
    (begin
        (asserts! (is-eq (var-get contribute-active) true) ERR_NOT_ACTIVE_FUND)
        (asserts! (> amount u0) ERR_ZERO_AMOUNT)
        (try! (contract-call? WELSH transfer amount tx-sender .genesis none))
        (var-set total-contribution new-total)
        (map-set balances { address: tx-sender } {
            balance: new-balance,
            claimed: u0
        })
    (ok {
        amount: amount,
        total: new-total
        })
    )
    )
)

;; #[allow(unchecked_data)]
(define-public (transformer
    (token <sip-010>)
    (amount uint)
    (recipient principal)
    )
    (as-contract (contract-call? token transfer amount tx-sender recipient none))
)

;; #[allow(unchecked_data)]
(define-public (withdrawal)
    (let (
        (balance (unwrap-panic (contract-call? WELSH get-balance .genesis)))
    )
        (begin
            (asserts! (> balance u0) ERR_ZERO_AMOUNT)
            (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_CONTRACT_OWNER)
            (try! (transformer WELSH balance CONTRACT_OWNER))
            (ok balance)
        )
    )
)

;; custom read-only
(define-read-only (get-blocks)
    (ok {
        stacks-block: stacks-block-height,
        bitcoin-block: burn-block-height
    })
)

(define-public (set-claim-active)
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_CONTRACT_OWNER)
        (if (var-get claim-active)
            (begin
                (var-set claim-active false)
            )
            (begin
                (var-set claim-active true)
            )
        )
        (ok (var-get claim-active))
    )
)

(define-public (set-contribute-active)
    (begin
        (asserts! (is-eq tx-sender CONTRACT_OWNER) ERR_NOT_CONTRACT_OWNER)
        (if (var-get contribute-active)
            (begin
                (var-set contribute-active false)
            )
            (begin
                (var-set contribute-active true)
            )
        )
        (ok (var-get contribute-active))
    )
)

(define-read-only (get-claim-active)
    (ok (var-get claim-active))
)

(define-read-only (get-contribute-active)
    (ok (var-get contribute-active))
)

(define-read-only (get-total-contribution)
    (ok (var-get total-contribution))
)

(define-read-only (get-user-balance (address principal))
    (ok (default-to { balance: u0, claimed: u0 } (map-get? balances { address: address }))))