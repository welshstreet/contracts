;; Welsh Street Market

(use-trait sip-010 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

;; errors
(define-constant ERR_ZERO_AMOUNT (err u951))
(define-constant ERR_NOT_CONTRACT_OWNER (err u952))
(define-constant ERR_NOT_INITIALIZED (err u953))
(define-constant ERR_INITIALIZED (err u954))
(define-constant ERR_INVALID_AMOUNT (err u955))

;; constants
(define-constant BASIS u10000)
(define-constant FEE u100)
(define-constant TAX u100)

;; variables
(define-data-var contract-owner principal tx-sender)
(define-data-var locked-a uint u0)
(define-data-var locked-b uint u0)
(define-data-var reserve-a uint u0)
(define-data-var reserve-b uint u0)

(define-public (burn-liquidity (amount uint))
  (begin
    (asserts! (> amount u0) ERR_ZERO_AMOUNT)
    (try! (contract-call? .credit-token transfer amount contract-caller .street-market none))
    (try! (contract-call? .street-rewards decrease-rewards contract-caller amount))
    (try! (as-contract? ((with-ft .credit-token "credit" amount))
      (try! (contract-call? .credit-token burn amount))))
    (ok {
      amount-lp: amount,
    })
  )
)

(define-public (lock-liquidity (amount-a uint))
  (let (
    (lock-a (var-get locked-a))
    (lock-b (var-get locked-b))
    (res-a  (var-get reserve-a))
    (res-b  (var-get reserve-b))
  )
    (begin
      (asserts! (> amount-a u0) ERR_ZERO_AMOUNT)
      (asserts! (and (> res-a u0) (> res-b u0)) ERR_NOT_INITIALIZED)
      (let ((amount-b (/ (* amount-a res-b) res-a)))
        (begin
          (asserts! (> amount-b u0) ERR_ZERO_AMOUNT)
          (try! (contract-call? .welshcorgicoin transfer amount-a contract-caller .street-market none))
          (try! (contract-call? .street-token transfer amount-b contract-caller .street-market none))
          (var-set locked-a (+ lock-a amount-a))
          (var-set locked-b (+ lock-b amount-b))
          (var-set reserve-a (+ res-a amount-a))
          (var-set reserve-b (+ res-b amount-b))
          (ok { 
            amount-a: amount-a, 
            amount-b: amount-b 
          })
        )
      )
    )
  )
)

(define-public (initial-liquidity (amount-a uint) (amount-b uint))
  (let (
    (lock-a (var-get locked-a))
    (lock-b (var-get locked-b))
    (res-a (var-get reserve-a))
    (res-b (var-get reserve-b))
    (total-lp (unwrap-panic (contract-call? .credit-token get-total-supply)))
    (amount-lp (sqrti (* amount-a amount-b)))
  )
  (begin
    (asserts! (> amount-a u0) ERR_ZERO_AMOUNT)
    (asserts! (> amount-b u0) ERR_ZERO_AMOUNT)
    (asserts! (is-eq contract-caller (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
    (asserts! (or
      (and (is-eq res-a u0) (is-eq res-b u0))
      (is-eq total-lp u0))
      ERR_INITIALIZED)
    (try! (contract-call? .welshcorgicoin transfer amount-a contract-caller .street-market none))
    (try! (contract-call? .street-token transfer amount-b contract-caller .street-market none))
    (try! (contract-call? .credit-token mint amount-lp))
    (try! (contract-call? .street-rewards increase-rewards contract-caller amount-lp))
    (var-set reserve-a (+ lock-a amount-a))
    (var-set reserve-b (+ lock-b amount-b))
    (ok {
      amount-a: amount-a,
      amount-b: amount-b,
      amount-lp: amount-lp
      })
    )
  )
)

(define-public (provide-liquidity (amount-a uint))
  (let (
    (lock-a (var-get locked-a))
    (lock-b (var-get locked-b))
    (res-a  (var-get reserve-a))
    (res-b  (var-get reserve-b))
    (avail-a (if (>= res-a lock-a) (- res-a lock-a) u0))
    (avail-b (if (>= res-b lock-b) (- res-b lock-b) u0))
    (total-lp (unwrap-panic (contract-call? .credit-token get-total-supply)))
  )
    (begin
      (asserts! (> amount-a u0) ERR_ZERO_AMOUNT)
      (asserts! (> total-lp u0) ERR_NOT_INITIALIZED)
      (asserts! (and (> avail-a u0) (> avail-b u0)) ERR_NOT_INITIALIZED)
      (let (
        (amount-b (/ (* amount-a avail-b) avail-a))
        (lp-from-a (/ (* amount-a total-lp) avail-a))
        (lp-from-b (/ (* amount-b total-lp) avail-b))
        (amount-lp (if (< lp-from-a lp-from-b) lp-from-a lp-from-b))
      )
        (begin
          (try! (contract-call? .welshcorgicoin transfer amount-a contract-caller .street-market none))
          (try! (contract-call? .street-token transfer amount-b contract-caller .street-market none))
          (try! (contract-call? .credit-token mint amount-lp))
          (try! (contract-call? .street-rewards increase-rewards contract-caller amount-lp))
          (var-set reserve-a (+ res-a amount-a))
          (var-set reserve-b (+ res-b amount-b))
          (ok { 
            amount-a: amount-a, 
            amount-b: amount-b, 
            amount-lp: amount-lp 
            })
        )
      )
    )
  )
)

(define-public (remove-liquidity (amount-lp uint))
  (let (
    (lock-a (var-get locked-a))
    (lock-b (var-get locked-b))
    (res-a (var-get reserve-a))
    (res-b (var-get reserve-b))
    (avail-a (if (>= res-a lock-a) (- res-a lock-a) u0))
    (avail-b (if (>= res-b lock-b) (- res-b lock-b) u0))
    (total-lp (unwrap-panic (contract-call? .credit-token get-total-supply)))
  )
    (begin
      (asserts! (> amount-lp u0) ERR_ZERO_AMOUNT)
      (asserts! (> total-lp u0) ERR_NOT_INITIALIZED)
      (let (
        (remove-a (/ (* amount-lp avail-a) total-lp))
        (remove-b (/ (* amount-lp avail-b) total-lp))
        (tax-a (/ (* remove-a TAX) BASIS))
        (tax-b (/ (* remove-b TAX) BASIS))
        (amount-a (- remove-a tax-a))
        (amount-b (- remove-b tax-b))
      )
        (begin
          (try! (contract-call? .credit-token transfer amount-lp contract-caller .street-market none))
          (try! (transformer .welshcorgicoin amount-a contract-caller))
          (try! (transformer .street-token amount-b contract-caller))
          (try! (contract-call? .street-rewards decrease-rewards contract-caller amount-lp))
          (try! (as-contract? ((with-ft .credit-token "credit" amount-lp))
            (try! (contract-call? .credit-token burn amount-lp))))
          (var-set reserve-a (if (>= res-a amount-a) (- res-a amount-a) u0))
          (var-set reserve-b (if (>= res-b amount-b) (- res-b amount-b) u0))
          (var-set locked-a (+ lock-a tax-a))
          (var-set locked-b (+ lock-b tax-b))
          (ok {
            amount-a: amount-a,
            amount-b: amount-b,
            amount-lp: amount-lp,
            tax-a: tax-a,
            tax-b: tax-b
          })
        )
      )
    )
  )
)

(define-public (swap-a-b (amount-a uint))
  (let (
    (lock-a (var-get locked-a))
    (lock-b (var-get locked-b))
    (res-a (var-get reserve-a))
    (res-b (var-get reserve-b))
    (fee-a (/ (* amount-a FEE) BASIS))
    (amount-a-net (- amount-a fee-a))
    (num (* amount-a-net res-b))
    (den (+ res-a amount-a-net))
    (amount-b (/ num den))
    (res-a-new (+ res-a amount-a-net))
    (res-b-new (- res-b amount-b))
    (lock-a-new (if (> res-a u0) (/ (* lock-a res-a-new) res-a) lock-a))
    (lock-b-new (if (> res-b u0) (/ (* lock-b res-b-new) res-b) lock-b))
  )
    (begin
      (asserts! (> amount-a u0) ERR_ZERO_AMOUNT)
      (asserts! (> amount-b u0) ERR_INVALID_AMOUNT)
      (asserts! (and (> res-a u0) (> res-b u0)) ERR_NOT_INITIALIZED)
      (try! (contract-call? .welshcorgicoin transfer amount-a contract-caller .street-market none))
      (try! (transformer .welshcorgicoin fee-a .street-rewards))
      (try! (transformer .street-token amount-b contract-caller))
      (try! (contract-call? .street-rewards update-rewards-a fee-a))
      (var-set reserve-a res-a-new)
      (var-set reserve-b res-b-new)
      (var-set locked-a lock-a-new)
      (var-set locked-b lock-b-new)
      (ok {
        amount-a: amount-a,
        amount-b: amount-b,
        fee-a: fee-a,
        res-a: res-a,
        res-a-new: res-a-new,
        res-b: res-b,
        res-b-new: res-b-new
      })
    )
  )
)

(define-public (swap-b-a (amount-b uint))
  (let (
    (lock-a (var-get locked-a))
    (lock-b (var-get locked-b))
    (res-a (var-get reserve-a))
    (res-b (var-get reserve-b))
    (fee-b (/ (* amount-b FEE) BASIS))
    (amount-b-net (- amount-b fee-b))
    (num (* amount-b-net res-a))
    (den (+ res-b amount-b-net))
    (amount-a (/ num den))
    (res-a-new (- res-a amount-a))
    (res-b-new (+ res-b amount-b-net))
    (lock-a-new (if (> res-a u0) (/ (* lock-a res-a-new) res-a) lock-a))
    (lock-b-new (if (> res-b u0) (/ (* lock-b res-b-new) res-b) lock-b))
  )
    (begin
      (asserts! (> amount-b u0) ERR_ZERO_AMOUNT)
      (asserts! (> amount-a u0) ERR_INVALID_AMOUNT)
      (asserts! (and (> res-a u0) (> res-b u0)) ERR_NOT_INITIALIZED)
      (try! (contract-call? .street-token transfer amount-b contract-caller .street-market none))
      (try! (transformer .street-token fee-b .street-rewards))
      (try! (transformer .welshcorgicoin amount-a contract-caller))
      (try! (contract-call? .street-rewards update-rewards-b fee-b))
      (var-set reserve-a res-a-new)
      (var-set reserve-b res-b-new)
      (var-set locked-a lock-a-new)
      (var-set locked-b lock-b-new)
      (ok {
        amount-a: amount-a,
        amount-b: amount-b,
        fee-b: fee-b,
        res-a: res-a,
        res-a-new: res-a-new,
        res-b: res-b,
        res-b-new: res-b-new
      })
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

(define-private (transformer
    (token <sip-010>)
    (amount uint)
    (recipient principal)
  )
  (as-contract? ((with-ft (contract-of token) "*" amount))
    (try! (contract-call? token transfer amount tx-sender recipient none))
  )
)

(define-read-only (get-blocks)
  (ok {
    bitcoin-block: burn-block-height,
    stacks-block: stacks-block-height
  }))

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))

(define-read-only (get-market-info)
  (let (
    (lock-a (var-get locked-a))
    (lock-b (var-get locked-b))
    (res-a (var-get reserve-a))
    (res-b (var-get reserve-b))
  )
    (ok {
      avail-a: (if (>= res-a lock-a) (- res-a lock-a) u0),
      avail-b: (if (>= res-b lock-b) (- res-b lock-b) u0),
      fee: FEE,
      locked-a: lock-a,
      locked-b: lock-b,
      reserve-a: res-a,
      reserve-b: res-b,
      tax: TAX
    })
  )
)