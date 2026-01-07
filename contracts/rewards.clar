;; Welsh Street Rewards
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

(use-trait sip-010 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; errors
(define-constant ERR_ZERO_AMOUNT (err u800))
(define-constant ERR_NOT_CONTRACT_OWNER (err u801))
(define-constant ERR_EMISSION_INTERVAL (err u802))
(define-constant ERR_NOT_AUTHORIZED (err u803))
(define-constant ERR_INVALID_PRINCIPAL (err u804))

;; metadata
(define-constant PRECISION u1000000000)
(define-constant EMISSION_AMOUNT u10000000000)

;; variables
(define-data-var contract-owner principal tx-sender)
(define-data-var global-index-a uint u0)
(define-data-var global-index-b uint u0)
(define-data-var last-mint-epoch uint u0)
(define-data-var total-distributed-a uint u0)
(define-data-var total-distributed-b uint u0)
(define-data-var total-claimed-a uint u0)
(define-data-var total-claimed-b uint u0)

(define-map user-rewards
  { account: principal }
  {
    balance-lp: uint,
    block-lp: uint,
    debt-a: uint,
    debt-b: uint,
    index-a: uint,
    index-b: uint
  }
)

(define-public (claim-rewards)
  (let (
    (balance-lp (unwrap-panic (contract-call? .credit get-balance tx-sender)))
    (info (default-to {
      balance-lp: u0,
      block-lp: u0,
      debt-a: u0,
      debt-b: u0,
      index-a: u0,
      index-b: u0}
      (map-get? user-rewards { account: tx-sender })))
    (current-global-a (var-get global-index-a))
    (current-global-b (var-get global-index-b))
    (user-index-a (get index-a info))
    (user-index-b (get index-b info))
    (earned-a (/ (* balance-lp (- current-global-a user-index-a)) PRECISION))
    (earned-b (/ (* balance-lp (- current-global-b user-index-b)) PRECISION))
    (deb-a (get debt-a info))
    (deb-b (get debt-b info))
    (claimed-a (if (> earned-a deb-a) (- earned-a deb-a) u0))
    (claimed-b (if (> earned-b deb-b) (- earned-b deb-b) u0))
  )
    (begin
      (if (> claimed-a u0)
        (try! (transformer .welshcorgicoin claimed-a tx-sender))
        true
      )
      (if (> claimed-b u0)
        (try! (transformer .street claimed-b tx-sender))
        true
      )
      (var-set total-claimed-a (+ (var-get total-claimed-a) claimed-a))
      (var-set total-claimed-b (+ (var-get total-claimed-b) claimed-b))
      (map-set user-rewards { account: tx-sender } {
        balance-lp: balance-lp,
        block-lp: (get block-lp info),
        debt-a: (+ deb-a claimed-a),
        debt-b: (+ deb-b claimed-b),
        index-a: user-index-a,
        index-b: user-index-b
        })
      (ok {
        balance-lp: balance-lp,
        block-lp: (get block-lp info),
        claimed-a: claimed-a,
        claimed-b: claimed-b,
        debt-a: (+ deb-a claimed-a),
        debt-b: (+ deb-b claimed-b),
        global-index-a: current-global-a,
        global-index-b: current-global-b,
        index-a: user-index-a,
        index-b: user-index-b
        })
    )
  )
)

(define-public (cleanup-rewards)
  (let (
    (actual-a (unwrap-panic (contract-call? .welshcorgicoin get-balance .rewards)))
    (actual-b (unwrap-panic (contract-call? .street get-balance .rewards)))
    (distributed-a (var-get total-distributed-a))
    (distributed-b (var-get total-distributed-b))
    (claimed-a (var-get total-claimed-a))
    (claimed-b (var-get total-claimed-b))
    (outstanding-a (- distributed-a claimed-a))
    (outstanding-b (- distributed-b claimed-b))
    (dust-threshold u10000)
    (cleanup-a (if (> actual-a outstanding-a)
                  (- actual-a outstanding-a)
                  (if (and (is-eq actual-a outstanding-a)
                          (< outstanding-a dust-threshold))
                      actual-a
                      u0)))
    (cleanup-b (if (> actual-b outstanding-b)
                  (- actual-b outstanding-b)
                  (if (and (is-eq actual-b outstanding-b)
                          (< outstanding-b dust-threshold))
                      actual-b
                      u0)))
  )
    (begin
      (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
      (if (> cleanup-a u0)
        (try! (as-contract (update-rewards-a cleanup-a)))
        true)
      (if (> cleanup-b u0)
        (try! (as-contract (update-rewards-b cleanup-b)))
        true)
      (ok {
        cleanup-a: cleanup-a,
        cleanup-b: cleanup-b,
      })
    )
  )
)

;; #[allow(unchecked_data)]
(define-public (donate-rewards (amount-a uint) (amount-b uint))
    (begin
      (if (> amount-a u0)
      (begin
        (try! (contract-call? .welshcorgicoin transfer amount-a tx-sender .rewards none))
        (try! (as-contract (update-rewards-a amount-a)))
      )
        true
      )
      (if (> amount-b u0)
      (begin
        (try! (contract-call? .street transfer amount-b tx-sender .rewards none))
        (try! (as-contract (update-rewards-b amount-b)))
      )
        true
      )
    (ok {
      donate-a: amount-a,
      donate-b: amount-b
    })
  )
)

;; #[allow(unchecked_data)]
(define-public (update-emission-rewards)
  (let (
      (current-epoch (unwrap-panic (contract-call? .street get-current-epoch)))
      (last-mint (var-get last-mint-epoch))
      (current-index (var-get global-index-b))
      (total-lp (unwrap-panic (contract-call? .credit get-total-supply)))
      (index-increment (if (> total-lp u0)
        (/ (* EMISSION_AMOUNT PRECISION) total-lp)
        u0))
      (new-index (+ current-index index-increment))
      (new-rewards (+ (var-get total-distributed-b) EMISSION_AMOUNT))
    )
    (begin
      (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
      (asserts! (> current-epoch last-mint) ERR_EMISSION_INTERVAL)
      (var-set total-distributed-b new-rewards)
      (var-set global-index-b new-index)
      (var-set last-mint-epoch current-epoch)
      (ok {
        emitted-amount: EMISSION_AMOUNT,
        global-index-b: new-index
      })
    )
  )
)

;; #[allow(unchecked_data)]
(define-public (update-rewards-a (amount uint))
  (let (
      (current-index (var-get global-index-a))
      (total-lp (unwrap-panic (contract-call? .credit get-total-supply)))
      (index-increment (if (> total-lp u0)
        (/ (* amount PRECISION) total-lp)
        u0))
      (new-index (+ current-index index-increment))
      (new-rewards (+ (var-get total-distributed-a) amount))
    )
    (begin
      (asserts! (or (is-eq contract-caller .exchange) (is-eq contract-caller .rewards)) ERR_NOT_AUTHORIZED)
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (var-set total-distributed-a new-rewards)
      (var-set global-index-a new-index)
      (ok true)
    )
  )
)

;; #[allow(unchecked_data)]
(define-public (update-rewards-b (amount uint))
  (let (
      (current-index (var-get global-index-b))
      (total-lp (unwrap-panic (contract-call? .credit get-total-supply)))
      (index-increment (if (> total-lp u0)
        (/ (* amount PRECISION) total-lp)
        u0))
      (new-index (+ current-index index-increment))
      (new-rewards (+ (var-get total-distributed-b) amount))
    )
    (begin
      (asserts! (or (is-eq contract-caller .exchange) (is-eq contract-caller .rewards)) ERR_NOT_AUTHORIZED)
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (var-set total-distributed-b new-rewards)
      (var-set global-index-b new-index)
      (ok true)
    )
  )
)

;; #[allow(unchecked_data)]
(define-public (update-user-rewards (user principal))
  (let (
    (current-lp-balance (unwrap-panic (contract-call? .credit get-balance user)))
    (current-global-index-a (var-get global-index-a))
    (current-global-index-b (var-get global-index-b))
    (current-block stacks-block-height)
    (existing-info (map-get? user-rewards { account: user }))
    (initial-debt-a (/ (* current-lp-balance current-global-index-a) PRECISION))
    (initial-debt-b (/ (* current-lp-balance current-global-index-b) PRECISION))
  )
    (begin
      (asserts! (is-eq contract-caller .exchange) ERR_NOT_AUTHORIZED)
      (map-set user-rewards { account: user } {
        balance-lp: current-lp-balance,
        block-lp: (if (is-some existing-info) (get block-lp (unwrap-panic existing-info)) current-block),
        debt-a: (if (is-some existing-info) (get debt-a (unwrap-panic existing-info)) u0),
        debt-b: (if (is-some existing-info) (get debt-b (unwrap-panic existing-info)) u0),
        index-a: current-global-index-a,
        index-b: current-global-index-b
      })
      (ok true)
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

(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq contract-caller (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
    (asserts! (not (is-eq new-owner (var-get contract-owner))) ERR_INVALID_PRINCIPAL)
    (var-set contract-owner new-owner)
    (ok true)
  )
)

(define-read-only (get-cleanup-rewards)
  (let (
    (actual-a (unwrap-panic (contract-call? .welshcorgicoin get-balance .rewards)))
    (actual-b (unwrap-panic (contract-call? .street get-balance .rewards)))
    (distributed-a (var-get total-distributed-a))
    (distributed-b (var-get total-distributed-b))
    (claimed-a (var-get total-claimed-a))
    (claimed-b (var-get total-claimed-b))
    (outstanding-a (- distributed-a claimed-a))
    (outstanding-b (- distributed-b claimed-b))
    (dust-threshold u10000)
    (cleanup-a (if (> actual-a outstanding-a)
                    (- actual-a outstanding-a)
                    (if (and (is-eq actual-a outstanding-a)
                            (< outstanding-a dust-threshold))
                        actual-a
                        u0)))
    (cleanup-b (if (> actual-b outstanding-b)
                    (- actual-b outstanding-b)
                    (if (and (is-eq actual-b outstanding-b)
                            (< outstanding-b dust-threshold))
                        actual-b
                        u0)))
  )
    (ok {
      actual-a: actual-a,
      actual-b: actual-b,
      claimed-a: claimed-a,
      claimed-b: claimed-b,
      distributed-a: distributed-a,
      distributed-b: distributed-b,
      outstanding-a: outstanding-a,
      outstanding-b: outstanding-b,
      cleanup-a: cleanup-a,
      cleanup-b: cleanup-b
    })
  )
)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))

(define-read-only (get-reward-pool-info)
    (ok {
      global-index-a: (var-get global-index-a),
      global-index-b: (var-get global-index-b),
      rewards-a: (unwrap-panic (contract-call? .welshcorgicoin get-balance .rewards)),
      rewards-b: (unwrap-panic (contract-call? .street get-balance .rewards)),
    })
)

(define-read-only (get-reward-user-info (user principal))
  (let (
    (balance-lp (unwrap-panic (contract-call? .credit get-balance user)))
    (info (default-to {
      balance-lp: u0,
      block-lp: u0,
      debt-a: u0,
      debt-b: u0,
      index-a: u0,
      index-b: u0}
      (map-get? user-rewards { account: user })))
    (current-global-a (var-get global-index-a))
    (current-global-b (var-get global-index-b))
    (user-index-a (get index-a info))
    (user-index-b (get index-b info))
    (earned-a (/ (* balance-lp (- current-global-a user-index-a)) PRECISION))
    (earned-b (/ (* balance-lp (- current-global-b user-index-b)) PRECISION))
    (deb-a (get debt-a info))
    (deb-b (get debt-b info))
    (unclaimed-a (if (> earned-a deb-a) (- earned-a deb-a) u0))
    (unclaimed-b (if (> earned-b deb-b) (- earned-b deb-b) u0))
  )
    (ok {
      balance-lp: balance-lp,
      block-lp: (get block-lp info),
      debt-a: deb-a,
      debt-b: deb-b,
      earned-a: earned-a,
      earned-b: earned-b,
      index-a: user-index-a,
      index-b: user-index-b,
      unclaimed-a: unclaimed-a,
      unclaimed-b: unclaimed-b,
    })
  )
)