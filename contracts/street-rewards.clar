;; Welsh Street Rewards

(use-trait sip-010 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; errors
(define-constant ERR_ZERO_AMOUNT (err u971))
(define-constant ERR_NOT_CONTRACT_OWNER (err u972))
(define-constant ERR_NOT_AUTHORIZED (err u973))
(define-constant ERR_CLEANUP_INTERVAL (err u975))
 
;; constants
(define-constant PRECISION u1000000000)
(define-constant CLEANUP_INTERVAL u144)

;; variables
(define-data-var contract-owner principal tx-sender)
(define-data-var global-index-a uint u0)
(define-data-var global-index-b uint u0)
(define-data-var last-cleanup-block uint u0)
(define-data-var total-distributed-a uint u0)
(define-data-var total-distributed-b uint u0)
(define-data-var total-claimed-a uint u0)
(define-data-var total-claimed-b uint u0)

(define-map users
  { account: principal }
  {
    balance: uint,
    block: uint,
    debt-a: uint,
    debt-b: uint,
    index-a: uint,
    index-b: uint
  }
)

(define-public (claim-rewards)
  (let (
    (balance (unwrap-panic (contract-call? .credit-token get-balance contract-caller)))
    (info (default-to {
      balance: u0,
      block: u0,
      debt-a: u0,
      debt-b: u0,
      index-a: u0,
      index-b: u0}
      (map-get? users { account: contract-caller })))
    (current-global-a (var-get global-index-a))
    (current-global-b (var-get global-index-b))
    (debt-a (get debt-a info))
    (debt-b (get debt-b info))
    (user-index-a (get index-a info))
    (user-index-b (get index-b info))
    (earned-a (/ (* balance (- current-global-a user-index-a)) PRECISION))
    (earned-b (/ (* balance (- current-global-b user-index-b)) PRECISION))
    (unclaimed-a (if (> earned-a debt-a) (- earned-a debt-a) u0))
    (unclaimed-b (if (> earned-b debt-b) (- earned-b debt-b) u0))
  )
    (begin
      (if (> unclaimed-a u0)
        (try! (transformer .welshcorgicoin unclaimed-a contract-caller))
        true
      )
      (if (> unclaimed-b u0)
        (try! (transformer .street-token unclaimed-b contract-caller))
        true
      )
      (var-set total-claimed-a (+ (var-get total-claimed-a) unclaimed-a))
      (var-set total-claimed-b (+ (var-get total-claimed-b) unclaimed-b))
      (map-set users { account: contract-caller } {
        balance: balance,
        block: (get block info),
        debt-a: (+ debt-a unclaimed-a),
        debt-b: (+ debt-b unclaimed-b),
        index-a: user-index-a,
        index-b: user-index-b
        })
      (ok {
        amount-a: unclaimed-a,
        amount-b: unclaimed-b,
        })  
    )
  )
)

(define-private (calculate-cleanup-rewards)
  (let (
    (actual-a (unwrap-panic (contract-call? .welshcorgicoin get-balance .street-rewards)))
    (actual-b (unwrap-panic (contract-call? .street-token get-balance .street-rewards)))
    (claimed-a (var-get total-claimed-a))
    (claimed-b (var-get total-claimed-b))
    (distributed-a (var-get total-distributed-a))
    (distributed-b (var-get total-distributed-b))
    (dust-threshold u10000)
    (outstanding-a (- distributed-a claimed-a))
    (outstanding-b (- distributed-b claimed-b))
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
      cleanup-a: cleanup-a,
      cleanup-b: cleanup-b,
      distributed-a: distributed-a,
      distributed-b: distributed-b,
      outstanding-a: outstanding-a,
      outstanding-b: outstanding-b
    })
  )
)

(define-public (cleanup-rewards)
  (let (
    (cleanup-data (unwrap-panic (calculate-cleanup-rewards)))
    (cleanup-a (get cleanup-a cleanup-data))
    (cleanup-b (get cleanup-b cleanup-data))
    (last-cleanup (var-get last-cleanup-block))
  )
    (begin
      (asserts! (>= burn-block-height (+ last-cleanup CLEANUP_INTERVAL)) 
        ERR_CLEANUP_INTERVAL)
      (if (> cleanup-a u0)
        (try! (as-contract? ()
          (try! (update-rewards-a cleanup-a))))
        true)
      (if (> cleanup-b u0)
        (try! (as-contract? ()
          (try! (update-rewards-b cleanup-b))))
        true)
      (var-set last-cleanup-block burn-block-height)
      (ok {
        amount-a: cleanup-a,
        amount-b: cleanup-b,
      })
    )
  )
)

(define-public (decrease-rewards (user principal) (amount uint))
  (let (
    (balance (unwrap-panic (contract-call? .credit-token get-balance user)))
    (block stacks-block-height)
    (global-a (var-get global-index-a))
    (global-b (var-get global-index-b))
    (info (unwrap-panic (map-get? users { account: user })))
    (total-lp (unwrap-panic (contract-call? .credit-token get-total-supply)))
    (old-balance (+ balance amount))
    (other-lp (- total-lp old-balance))
  )
    (begin
      (asserts! (or (is-eq contract-caller .credit-controller)
                    (is-eq contract-caller .street-market)) ERR_NOT_AUTHORIZED)
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (let (
        (debt-a (get debt-a info))
        (debt-b (get debt-b info))
        (index-a (get index-a info))
        (index-b (get index-b info))
        (earned-a (/ (* old-balance (- global-a index-a)) PRECISION))
        (earned-b (/ (* old-balance (- global-b index-b)) PRECISION))
        (unclaimed-a (if (> earned-a debt-a) (- earned-a debt-a) u0))
        (unclaimed-b (if (> earned-b debt-b) (- earned-b debt-b) u0))
        (forfeit-a (/ (* unclaimed-a amount) old-balance))
        (forfeit-b (/ (* unclaimed-b amount) old-balance))
        (redistributed-a (if (> other-lp u0)
                      (/ (* forfeit-a PRECISION) other-lp)
                      u0))
        (redistributed-b (if (> other-lp u0)
                      (/ (* forfeit-b PRECISION) other-lp)
                      u0))
      )
        (begin
          (if (> forfeit-a u0)
            (begin
              (var-set global-index-a (+ global-a redistributed-a)))
            true)
          (if (> forfeit-b u0)
            (begin
              (var-set global-index-b (+ global-b redistributed-b)))
            true)
          (map-delete users { account: user })
          (let (
            (new-global-a (var-get global-index-a))
            (new-global-b (var-get global-index-b))
            (preserve-a (- unclaimed-a forfeit-a))
            (preserve-b (- unclaimed-b forfeit-b))
            (preserve-idx-a (if (and (> balance u0) (> preserve-a u0))
                        (- new-global-a (/ (* preserve-a PRECISION) balance))
                        new-global-a))
            (preserve-idx-b (if (and (> balance u0) (> preserve-b u0))
                        (- new-global-b (/ (* preserve-b PRECISION) balance))
                        new-global-b))
          )
            (if (> balance u0)
              (map-set users
                { account: user }
                { balance: balance,
                  block: block,
                  debt-a: u0,
                  debt-b: u0, 
                  index-a: preserve-idx-a,
                  index-b: preserve-idx-b
                })
              true)
            )
          (ok true)
        )
      )
    )
  )
)

(define-public (donate-rewards (amount-a uint) (amount-b uint))
    (begin
      (if (> amount-a u0)
      (begin
        (try! (contract-call? .welshcorgicoin transfer amount-a contract-caller .street-rewards none))
        (try! (as-contract? ()
          (try! (update-rewards-a amount-a))))
      )
        true
      )
      (if (> amount-b u0)
      (begin
        (try! (contract-call? .street-token transfer amount-b contract-caller .street-rewards none))
        (try! (as-contract? ()
          (try! (update-rewards-b amount-b))))
      )
        true
      )
    (ok {
      amount-a: amount-a,
      amount-b: amount-b
    })
  )
)

(define-public (increase-rewards (user principal) (amount uint))
  (let (
    (balance (unwrap-panic (contract-call? .credit-token get-balance user)))
    (block stacks-block-height)
    (global-a (var-get global-index-a))
    (global-b (var-get global-index-b))
    (info (map-get? users { account: user }))
    (old-balance (- balance amount))
  )
    (begin
      (asserts! (or (is-eq contract-caller .credit-controller)
                    (is-eq contract-caller .street-market)) ERR_NOT_AUTHORIZED)
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (if (is-some info)
        (let (
          (data (unwrap-panic info))
          (debt-a (get debt-a data))
          (debt-b (get debt-b data))
          (index-a (get index-a data))
          (index-b (get index-b data))
          (earned-a (/ (* old-balance (- global-a index-a)) PRECISION))
          (earned-b (/ (* old-balance (- global-b index-b)) PRECISION))
          (unclaimed-a (if (> earned-a debt-a) (- earned-a debt-a) u0))
          (unclaimed-b (if (> earned-b debt-b) (- earned-b debt-b) u0))
        )
          (if (is-eq contract-caller .street-market)
            (let (
              (new-earned-a (/ (* balance (- global-a index-a)) PRECISION))
              (new-earned-b (/ (* balance (- global-b index-b)) PRECISION))
              (preserve-debt-a (if (> new-earned-a unclaimed-a) (- new-earned-a unclaimed-a) u0))
              (preserve-debt-b (if (> new-earned-b unclaimed-b) (- new-earned-b unclaimed-b) u0))
            )
              (map-set users { account: user } {
                balance: balance,
                block: block,
                debt-a: preserve-debt-a,
                debt-b: preserve-debt-b,
                index-a: index-a,
                index-b: index-b
              })
            )
            (let (
              (preserve-idx-a (if (> unclaimed-a u0)
                                (- global-a (/ (* unclaimed-a PRECISION) balance))
                                global-a))
              (preserve-idx-b (if (> unclaimed-b u0)
                                (- global-b (/ (* unclaimed-b PRECISION) balance))
                                global-b))
            )
              (map-set users { account: user } {
                balance: balance,
                block: block,
                debt-a: u0,
                debt-b: u0,
                index-a: preserve-idx-a,
                index-b: preserve-idx-b
              })
            )
          )
        )
        (map-set users { account: user } {
          balance: balance,
          block: block,
          debt-a: u0,
          debt-b: u0,
          index-a: global-a,
          index-b: global-b
        })
      )
      (ok true)
    )
  )
)

(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq contract-caller (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
    (var-set contract-owner new-owner)
    (ok true)
  )
)

(define-public (update-rewards-a (amount uint))
  (let (
  (total-lp (unwrap-panic (contract-call? .credit-token get-total-supply)))
      (current-index (var-get global-index-a))
      (index-increment (if (> total-lp u0)
        (/ (* amount PRECISION) total-lp)
        u0))
      (new-index (+ current-index index-increment))
      (new-rewards (+ (var-get total-distributed-a) amount))
    )
    (begin
      (asserts! (or (is-eq contract-caller .street-controller)
                    (is-eq contract-caller .street-market)
                    (is-eq contract-caller .street-rewards)) ERR_NOT_AUTHORIZED)
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (var-set global-index-a new-index)
      (var-set total-distributed-a new-rewards)
      (ok true)
    )
  )
)

(define-public (update-rewards-b (amount uint))
  (let (
  (total-lp (unwrap-panic (contract-call? .credit-token get-total-supply)))
      (current-index (var-get global-index-b))
      (index-increment (if (> total-lp u0)
        (/ (* amount PRECISION) total-lp)
        u0))
      (new-index (+ current-index index-increment))
      (new-rewards (+ (var-get total-distributed-b) amount))
    )
    (begin
      (asserts! (or (is-eq contract-caller .street-market)
                    (is-eq contract-caller .street-rewards)
                    (is-eq contract-caller .emission-controller)) ERR_NOT_AUTHORIZED)
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (var-set global-index-b new-index)
      (var-set total-distributed-b new-rewards)
      (ok true)
    )
  )
)

(define-private (transformer
    (token <sip-010>)
    (amount uint)
    (recipient principal)
  )
  (as-contract? ((with-ft (contract-of token) "*" amount))
    (try! (contract-call? token transfer amount tx-sender recipient none))
  )
)

(define-read-only (get-cleanup-rewards)
  (calculate-cleanup-rewards))

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))

(define-read-only (get-reward-pool-info)
    (ok {
      global-index-a: (var-get global-index-a),
      global-index-b: (var-get global-index-b),
  rewards-a: (unwrap-panic (contract-call? .welshcorgicoin get-balance .street-rewards)),
  rewards-b: (unwrap-panic (contract-call? .street-token get-balance .street-rewards)),
    })
)

(define-read-only (get-reward-user-info (user principal))
  (let (
    (balance (unwrap-panic (contract-call? .credit-token get-balance user)))
    (info (default-to {
      balance: u0,
      block: u0,
      debt-a: u0,
      debt-b: u0,
      index-a: u0,
      index-b: u0}
      (map-get? users { account: user })))
    (current-global-a (var-get global-index-a))
    (current-global-b (var-get global-index-b))
    (debt-a (get debt-a info))
    (debt-b (get debt-b info))
    (user-index-a (get index-a info))
    (user-index-b (get index-b info))
    (earned-a (/ (* balance (- current-global-a user-index-a)) PRECISION))
    (earned-b (/ (* balance (- current-global-b user-index-b)) PRECISION))
    (unclaimed-a (if (> earned-a debt-a) (- earned-a debt-a) u0))
    (unclaimed-b (if (> earned-b debt-b) (- earned-b debt-b) u0))
  )
    (ok {
      balance: balance,
      block: (get block info),
      debt-a: debt-a,
      debt-b: debt-b,
      index-a: user-index-a,
      index-b: user-index-b,
      unclaimed-a: unclaimed-a,
      unclaimed-b: unclaimed-b
    })
  )
)