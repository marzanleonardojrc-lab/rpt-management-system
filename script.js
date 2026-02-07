// Set defaults on load
document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    document.getElementById('txnDate').valueAsDate = today;
    document.getElementById('taxYear').value = today.getFullYear();
    computeTax();
});

function computeTax() {
    // 1. Get Inputs
    const assessedVal = parseFloat(document.getElementById('assessedVal').value) || 0;
    const taxYear = parseInt(document.getElementById('taxYear').value);
    const txnDateVal = document.getElementById('txnDate').value;
    
    if (!txnDateVal || !taxYear) return;

    // 2. Constants
    const BASIC_RATE = 0.01;
    const SEF_RATE = 0.01;
    const MAX_PENALTY_MONTHS = 36;
    const PENALTY_RATE_PER_MONTH = 0.02;
    const DISCOUNT_RATE = 0.20; // 20% if paid early

    // 3. Compute Base Tax
    const basicTax = assessedVal * BASIC_RATE;
    const sefTax = assessedVal * SEF_RATE;
    const grossTax = basicTax + sefTax;

    // 4. Time Logic
    const txnDate = new Date(txnDateVal);
    const txnYear = txnDate.getFullYear();
    const txnMonth = txnDate.getMonth(); // 0 = Jan, 11 = Dec

    let adjustment = 0;
    let label = "Adjustment";
    let statusMsg = "";
    let statusType = ""; // 'status-penalty' or 'status-discount'

    // LOGIC START
    
    // Case A: Paying for a Future Year (Advance Payment) -> Max Discount
    if (taxYear > txnYear) {
        adjustment = -(grossTax * DISCOUNT_RATE);
        label = "Less: Advance Discount (20%)";
        statusMsg = "Advance Payment for " + taxYear;
        statusType = "status-discount";
    }
    
    // Case B: Paying for Current Year (e.g., Tax Year 2026, Txn Year 2026)
    else if (taxYear === txnYear) {
        // Q1 (Jan-Mar) -> Discount
        if (txnMonth <= 2) { 
            adjustment = -(grossTax * DISCOUNT_RATE);
            label = "Less: Prompt Discount (20%)";
            statusMsg = "Prompt Payment (Q1)";
            statusType = "status-discount";
        } 
        // Q2 onwards -> Penalty starts
        else {
            // April is month 3. 
            // If month is 3 (April), penalty is 2% (1 month)?? 
            // Usually: End of March is deadline. April 1 starts penalty?
            // Standard: April = 2% interest.
            // Formula: (Month Index - 2) * 2%
            // April (3) - 2 = 1 * 2% = 2%
            const monthsLate = txnMonth - 2; 
            adjustment = grossTax * (monthsLate * PENALTY_RATE_PER_MONTH);
            label = `Add: Penalty (${monthsLate * 2}%)`;
            statusMsg = `Current Year Delinquency: ${monthsLate} month(s)`;
            statusType = "status-penalty";
        }
    }

    // Case C: Paying for PAST Years (DELINQUENCY)
    // This handles your 36-month cap request
    else {
        // Calculate total months difference
        // From January 1 of TaxYear to TxnDate
        // Actually, penalty usually starts counting from April of the Tax Year??
        // SIMPLIFIED GOVERNMENT RULE:
        // Delinquency starts from January 1 of the NEXT year? 
        // OR does it accumulate from the tax year itself?
        
        // STANDARD INTERPRETATION:
        // If 2024 Tax is unpaid, and you pay in Jan 2026:
        // 2024 (Jan-Dec) + 2025 (Jan-Dec) + 2026 (Jan)
        
        // Let's use the standard "Month Counting" formula used in Treasuries:
        // (TxnYear - TaxYear) * 12 + (TxnMonth - StartingPenaltyMonth)
        // But usually, prior years are fully 24% per year?
        
        // Let's do the rigorous count:
        // Total Months = (TxnYear - TaxYear) * 12 + txnMonth
        // But we must subtract the "grace period" (Jan-Mar of the tax year)
        // Actually, for past years, the entire year is usually considered late.
        
        // Let's stick to your specific rule: "2% per month, max 72%"
        // We count months from January 1 of the Tax Year? Or April? 
        // Usually, penalty accrues from the time it was due.
        
        // Implementation:
        // We calculate months elapsed since March 31 of the Tax Year.
        const deadline = new Date(taxYear, 2, 31); // March 31 of Tax Year
        
        // Difference in months
        let monthsLate = (txnYear - taxYear) * 12 + (txnMonth - 2);
        
        // Cap at 36 months (72%)
        if (monthsLate > MAX_PENALTY_MONTHS) {
            monthsLate = MAX_PENALTY_MONTHS;
            statusMsg = "Max Penalty Reached (36 Months / 72%)";
        } else {
            statusMsg = `Past Year Delinquency: ${monthsLate} Months`;
        }

        if (monthsLate < 0) monthsLate = 0; // Just in case
        
        const penaltyRate = monthsLate * PENALTY_RATE_PER_MONTH;
        adjustment = grossTax * penaltyRate;
        
        label = `Add: Penalty (${(penaltyRate * 100).toFixed(0)}%)`;
        statusType = "status-penalty";
    }

    // 5. Final Calculation
    const totalDue = grossTax + adjustment;

    // 6. Display
    document.getElementById('basicTxt').textContent = formatVal(basicTax);
    document.getElementById('sefTxt').textContent = formatVal(sefTax);
    document.getElementById('grossTxt').textContent = formatVal(grossTax);
    
    document.getElementById('adjLabel').textContent = label;
    document.getElementById('adjTxt').textContent = formatVal(adjustment);
    document.getElementById('totalTxt').textContent = formatVal(totalDue);
    
    // Status Box
    const box = document.getElementById('statusBox');
    box.style.display = 'block';
    box.textContent = statusMsg;
    box.className = "status-box " + statusType;
}

function formatVal(num) {
    return '₱ ' + num.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}
