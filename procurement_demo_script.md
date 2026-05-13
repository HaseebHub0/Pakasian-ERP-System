# Pakasian ERP - Procurement Module Demo Script

Yeh document client ko Procurement Module ka demo dene ke liye ek step-by-step guide hai. Demo ko smooth banane ke liye ensure karein ke system mein dummy data mojood hai.

## 🚀 Pre-requisite: Seed Dummy Data
Demo start karne se pehle system mein kuch basic data (Suppliers, Items, POs) hona zaroori hai. Iske liye terminal mein yeh command run karein:
```bash
cd erp_system
..\.venv\Scripts\python.exe ..\seed_data.py
```

---

## 🎬 Step-by-Step Demo Flow

### Step 1: Master Data (Buniyaad)
**Navigation:** `Master Data` > `Suppliers` & `Raw Materials`
* **Kya Dikhana Hai:** Supplier list aur Raw Materials ki list.
* **Client ko kya batana hai:** 
  > "Sir, yahan hum apne tamam suppliers aur unse khareede jane wale raw materials (jaise Palm Oil, Salt) ko register karte hain. Yahan hum payment terms, credit limits, aur suppliers ka lead time bhi define kar sakte hain taake system smart decisions le sake."

### Step 2: Zaroorat / Demand (Purchase Requisition - PR)
**Navigation:** `Procurement` > `Requisitions`
* **Kya Dikhana Hai:** Ek bani hui Purchase Requisition.
* **Client ko kya batana hai:** 
  > "Jab factory mein ya kisi department ko kisi item ki zaroorat hoti hai, toh yahan ek Requisition banti hai. Aap isme dekh sakte hain ke kis department ne kya manga hai. Yeh request seedha procurement manager ke paas approval ke liye aati hai."

### Step 3: Rates Mangwana (RFQ & Quotations)
**Navigation:** `Procurement` > `RFQ` aur `Quotations`
* **Kya Dikhana Hai:** RFQ details aur Suppliers ke rates.
* **Client ko kya batana hai:** 
  > "Approved Requisition ke baad, hum is system se mukhtalif suppliers ko Request For Quotation (RFQ) bhejte hain ke rate dein. Phir suppliers ki aayi hui Quotations yahan enter hoti hain taake hum compare kar sakein ke sab se behtareen rate aur quality kon de raha hai."

### Step 4: Order Bhejna (Purchase Order - PO)
**Navigation:** `Procurement` > `Purchase Orders`
* **Kya Dikhana Hai:** Ek Approved Purchase Order ka format.
* **Client ko kya batana hai:** 
  > "Supplier final hone ke baad, hum yahan se direct Purchase Order (PO) generate karte hain. Isme items, unki final amount, tax, aur delivery date lock ho jati hai. Yeh PO pdf ban kar supplier ko automated chala jata hai." *(Aap yahan ek naya PO create karke bhi dikha sakte hain)*.

### Step 5: Samaan Receive Karna (GRN & QC)
**Navigation:** `Procurement` > `GRN` aur uske baad `QC`
* **Kya Dikhana Hai:** Receiving ka process aur Quality check.
* **Client ko kya batana hai:** 
  > "Jab supplier gaari le kar aata hai, toh gate par Goods Receipt Note (GRN) banti hai. System sirf wahi items aur utni hi quantity allow karta hai jo PO mein approved thi. Uske baad Quality Control (QC) wali team aakar usko pass ya fail karti hai. Agar samaan pass ho jaye toh usay ek unique Batch Number mil jata hai."

### Step 6: Payment (Accounts Payable)
**Navigation:** `Procurement` > `Accounts Payable`
* **Kya Dikhana Hai:** Pending aur Paid bills ki list.
* **Client ko kya batana hai:** 
  > "QC pass hone ke baad, bill seedha accounts department ke paas dashboard mein aa jata hai. Yahan woh invoice ki due dates track kar sakte hain aur supplier ki terms (e.g. Net 30 days) ke hisaab se payment mark kar sakte hain."

### Step 7: Reports (Procurement Analytics)
**Navigation:** `Procurement` > `Procurement Analytics`
* **Kya Dikhana Hai:** Graphs aur metrics.
* **Client ko kya batana hai:** 
  > "Aakhir mein, top management is dashboard ke zariye reports dekh sakti hai ke kis supplier ko kitna order gaya, humara total kharcha kitna hua, aur PO fulfillment cycle kitna waqt le raha hai. Yeh business planning mein bohat madad karta hai."

---
*Tip: Demo ke doran hamesha confident rahein aur agar client koi aisi requirement bataye jo system mein nahi hai, toh usay note kar lein aur bolein "Yeh custom feature hum easily add kar denge."*
