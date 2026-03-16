;; Welsh Street Credit Controller

;; errors
(define-constant ERR_ZERO_AMOUNT (err u911))
(define-constant ERR_NOT_CONTRACT_OWNER (err u912))
(define-constant ERR_NOT_TOKEN_OWNER (err u913))
(define-constant ERR_BALANCE (err u914))

;; variables
(define-data-var contract-owner principal tx-sender)

(define-public (transfer
    (amount uint) 
    (sender principal) 
    (recipient principal)
    (memo (optional (buff 34)))
    )
  (let (
      (sender-balance (unwrap-panic (contract-call? .credit-token get-balance sender)))
    )
    (begin
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (asserts! (is-eq contract-caller sender) ERR_NOT_TOKEN_OWNER)
      (asserts! (>= sender-balance amount) ERR_BALANCE)
      (try! (as-contract? ()
        (unwrap-panic (contract-call? .credit-token transfer amount sender recipient memo))))
      (try! (contract-call? .street-rewards decrease-rewards sender amount))
      (try! (contract-call? .street-rewards increase-rewards recipient amount))
      (begin
        (match memo content (print content) 0x)
        (ok {
          amount: amount
        })
      )
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

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))