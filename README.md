# CampusSplit — Group Expense Management & Fair Settlement

CampusSplit is a full-stack MERN application built for college students traveling for hackathons, technical fests, or trips to track shared group expenses, accurately derive net balances without floating-point errors, and minimize repayment transactions using a Greedy Debt-Simplification Algorithm.

---

## Architecture Overview

```
 ┌─────────────────────────────────────────────────────────────┐
 │                      React 19 Frontend                      │
 │    Dashboard │ Members │ Expense Form │ Balances │ Settle   │
 └──────────────────────────────┬──────────────────────────────┘
                                │ HTTP / JSON (Vite Proxy: /api)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                      Express.js Server                      │
 │  Routes ──► Controllers ──► Calculation Engine (Pure Logic) │
 └──────────────────────────────┬──────────────────────────────┘
                                │ Mongoose ODM
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                       MongoDB Database                      │
 │      groups  │  participants  │  expenses  │  settlements   │
 └─────────────────────────────────────────────────────────────┘
```

---

## Key Features

1. **Group Management**: Create multiple trip/event groups with custom names and descriptions.
2. **Member Management**: Add participants to groups with unique name constraints.
3. **Expense Tracking**:
   - Total amount in INR.
   - Payer selection (a payer does not have to be a beneficiary).
   - Beneficiary selection with interactive multi-select checkboxes and "Select All" / "Clear" buttons.
   - Real-time split preview (e.g. ₹900 split 3 ways = ₹300.00 each).
   - Category tags: Food, Travel, Accommodation, Tickets, Other.
   - Edit and delete expenses with automated ledger recalculation.
4. **Authoritative Calculation Engine**:
   - **Integer Paise Arithmetic**: Eliminates IEEE 754 floating-point drift (`0.1 + 0.2 !== 0.3`).
   - **Fair Remainder Distribution**: Indivisible paise (e.g. ₹100 / 3) are distributed 1-by-1 to ensure total beneficiary share matches total paid exactly.
   - **Zero-Sum Mathematical Invariant**: $\sum \text{Net Balances} \equiv 0$.
5. **Greedy Debt Simplification (Settlement Generator)**:
   - Matches largest debtor with largest creditor.
   - Guarantees resolution in at most $N - 1$ transactions for $N$ participants.
6. **Payment Tracking**:
   - Mark suggested settlements as completed/paid with a single click.
   - Preserves completed settlement history with timestamps.

---

## How to Run the Application Locally

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 1. Start the Backend Server
```bash
cd server
npm install
npm start
# Server runs on: http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### 2. Start the Frontend Client
```bash
cd client
npm install
npm run dev
# Frontend runs on: http://localhost:5173
```

### 3. Run Automated Tests
```bash
# In the server directory:
npm test
# Runs 16 automated unit test cases using Node.js's native test runner

# Run the end-to-end integration verification:
node tests/e2e-verify.js
```

---

## Reference Scenario Verified

- **Participants**: Asha, Bala, Charan
- **Expense 1**: Asha pays ₹900 (Tickets) shared by Asha, Bala, Charan.
- **Expense 2**: Bala pays ₹300 (Food) shared by Bala, Charan.
- **Calculated Balances**:
  - Asha: Paid ₹900.00, Share ₹300.00 $\rightarrow$ **Net +₹600.00** (Creditor)
  - Bala: Paid ₹300.00, Share ₹450.00 $\rightarrow$ **Net −₹150.00** (Debtor)
  - Charan: Paid ₹0.00, Share ₹450.00 $\rightarrow$ **Net −₹450.00** (Debtor)
- **Settlement Transactions**:
  1. Charan pays Asha ₹450.00
  2. Bala pays Asha ₹150.00
