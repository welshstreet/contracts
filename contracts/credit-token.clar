;; Welsh Street Credit

(impl-trait 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE.sip-010-trait-ft-standard.sip-010-trait)

(define-fungible-token credit)

;; errors
(define-constant ERR_ZERO_AMOUNT (err u921))
(define-constant ERR_NOT_CONTRACT_OWNER (err u922))
(define-constant ERR_NOT_AUTHORIZED (err u923))

;; constants
(define-constant TOKEN_DECIMALS u6)
(define-constant TOKEN_NAME "Welsh Street Credit")
(define-constant TOKEN_SYMBOL "CREDIT")

;; variables
(define-data-var contract-owner principal tx-sender)
(define-data-var token-uri (optional (string-utf8 256)) (some u"https://ipfs.io/ipfs/bafybeiexeg4tyoslafsnfpnob2kihdtl2lnhz4fupldtbtpp3y534ebkty/credit.json"))

(define-public (burn (amount uint))
    (begin
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (asserts! (is-eq contract-caller .street-market) ERR_NOT_AUTHORIZED)
      (try! (ft-burn? credit amount tx-sender))
      (ok {
        amount: amount
      })
    )
)

(define-public (mint (amount uint))
    (begin
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (asserts! (is-eq contract-caller .street-market) ERR_NOT_AUTHORIZED)
      (try! (ft-mint? credit amount tx-sender))
      (ok {
        amount: amount
      })
    )
)

(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq contract-caller (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
    (var-set contract-owner new-owner)
    (ok true)
  )
)

(define-public (set-token-uri (value (string-utf8 256)))
  (begin
    (asserts! (is-eq contract-caller (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
    (var-set token-uri (some value))
    (ok true)
  )
)

(define-public (transfer
    (amount uint)
    (sender principal)
    (recipient principal)
    (memo (optional (buff 34)))
  )
  (begin
    (asserts! (> amount u0) ERR_ZERO_AMOUNT)
    (asserts! (or (is-eq contract-caller .street-market) 
                  (is-eq contract-caller .credit-controller)) ERR_NOT_AUTHORIZED)
    (try! (ft-transfer? credit amount sender recipient))
    (match memo content (print content) 0x)
    (ok true)
  )
)

(define-read-only (get-balance (who principal))
  (ok (ft-get-balance credit who)))

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))

(define-read-only (get-decimals)
  (ok TOKEN_DECIMALS))

(define-read-only (get-name)
  (ok TOKEN_NAME))

(define-read-only (get-symbol)
  (ok TOKEN_SYMBOL))

(define-read-only (get-token-uri)
  (ok (var-get token-uri)))

(define-read-only (get-total-supply)
  (ok (ft-get-supply credit)))