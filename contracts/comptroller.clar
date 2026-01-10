;; Welsh Street Comptroller
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

;; errors
(define-constant ERR_ZERO_AMOUNT (err u500))
(define-constant ERR_NOT_CONTRACT_OWNER (err u501))
(define-constant ERR_NOT_TOKEN_OWNER (err u502))
(define-constant ERR_INSUFFICIENT_BALANCE (err u503))
(define-constant ERR_INVALID_PRINCIPAL (err u504))

;; variables
(define-data-var contract-owner principal tx-sender)

(define-public (transfer-credit 
    (amount uint) 
    (sender principal) 
    (recipient principal))
  (let (
    (sender-balance (unwrap! (contract-call? .credit get-balance sender) ERR_INSUFFICIENT_BALANCE))
  )
    (begin
      (asserts! (> amount u0) ERR_ZERO_AMOUNT)
      (asserts! (is-eq tx-sender sender) ERR_NOT_TOKEN_OWNER)
      (asserts! (>= sender-balance amount) ERR_INSUFFICIENT_BALANCE)
      (try! (as-contract (contract-call? .credit transfer amount sender recipient none)))
      (try! (as-contract (contract-call? .rewards update-sender-rewards sender amount)))
      (try! (as-contract (contract-call? .rewards update-recipient-rewards recipient amount)))
      (ok true)
    )
  )
)

;; custom read-only
(define-public (set-contract-owner (new-owner principal))
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_NOT_CONTRACT_OWNER)
    (asserts! (not (is-eq new-owner (var-get contract-owner))) ERR_INVALID_PRINCIPAL)
    (var-set contract-owner new-owner)
    (ok true)
  )
)

(define-read-only (get-contract-owner)
  (ok (var-get contract-owner)))