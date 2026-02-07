document.addEventListener('DOMContentLoaded', () => {
    // Default to today
    const today = new Date();
    document.getElementById('txnDate').valueAsDate = today;
    document.getElementById('taxYear').value = today.getFullYear();
    compute();
});

function compute() {
    // 1. Get Values
    const assessedVal = parseFloat(document.getElementById('assessedVal').value) || 0;
    const targetTaxYear = parseInt(document.getElementById('taxYear').value); // The year being paid for
    const txnDateVal = document.getElementById('txnDate').value;

    if (!txnDateVal || !targetTaxYear) return;

    // 2. Constants
    const BASIC_RATE = 0.01;
    const SEF_RATE = 0.01;
    const ADVANCE_DISCOUNT = 0.20; // 20% for Advance
    const PROMPT_DISCOUNT = 0.10;  // 10% for Prompt (Jan-Mar)
    const PENALTY_RATE = 0.02;     // 2% per month
    const MAX_PENALTY_MONTHS = 36; // Cap at 72%

    // 3. Dates
    const txnDate = new Date(txnDateVal);
    const txnYear = txnDate.getFullYear();
    const txnMonth = txnDate.getMonth(); // 0 = Jan, 11 = Dec

    // 4. Base Tax Calculation
    const basicTax = assessedVal * BASIC_RATE;
    const sefTax = assessedVal * SEF_RATE;
    const grossTax = basicTax + sefTax;

    // 5. Logic Branching
    let adjustment = 0;
    let label = "Adjustment";
    let statusText = "";
    let statusClass = "";

    // SCENARIO A: ADVANCE PAYMENT (Paying for Future Year)
    // Rule: Transaction Year is strictly LESS than Tax Year
    if (txnYear < targetTaxYear) {
        adjustment = -(grossTax * ADVANCE_DISCOUNT);
        label = `Less: Advance Discount (20%)`;
        statusText = `ADVANCE PAYMENT (Applied to ${targetTaxYear})`;
        statusClass = "bg-advance";
    }

    // SCENARIO B: CURRENT YEAR PAYMENT
    // Rule: Transaction Year is EQUAL to Tax Year
    else if (txnYear === targetTaxYear) {
        
        // Jan (0) to March (2) -> Prompt Payment 10%
        if (txnMonth <= 2) { 
            adjustment = -(grossTax * PROMPT_DISCOUNT);
            label = `Less: Prompt Discount (10%)`;
            statusText = `PROMPT PAYMENT (Q1 ${targetTaxYear})`;
            statusClass = "bg-prompt";
        } 
        // April (3) onwards -> Penalty
        else {
            // April is month 3. It is considered 1 month late? 
            // Usually deadline is March 31. April 1 starts penalty.
            // Formula: Month Index - 2. (April=3, 3-2=1)
            const monthsLate = txnMonth - 2; 
            adjustment = grossTax * (monthsLate * PENALTY_RATE);
            label = `Add: Penalty (${monthsLate * 2}%)`;
            statusText = `LATE PAYMENT (${monthsLate} months)`;
            statusClass = "bg-penalty";
        }
    }

    // SCENARIO C: DELINQUENCY (Paying for Past Year)
    // Rule: Transaction Year is GREATER than Tax Year
    else {
        // Calculate months from Jan 1 of Tax Year? 
        // Or Jan 1 of year following tax year?
        // Standard: Penalty usually accrues from the time it was due.
        // Simple logic: Count total months difference from March 31 of Tax Year.
        
        let monthsLate = ((txnYear - targetTaxYear) * 12) + (txnMonth - 2);
        
        // Cap at 36 months
        if (monthsLate > MAX_PENALTY_MONTHS) {
            monthsLate = MAX_PENALTY_MONTHS;
            statusText = `DELINQUENT (${targetTaxYear}) - Max Penalty Reached`;
        } else {
            statusText = `DELINQUENT (${targetTaxYear}) - ${monthsLate} Months Late`;
        }
        
        // Ensure no negative months (just in case)
        if (monthsLate < 0) monthsLate = 0;

        adjustment = grossTax * (monthsLate * PENALTY_RATE);
        label = `Add: Penalty (${(monthsLate * 2).toFixed(0)}%)`;
        statusClass = "bg-penalty";
    }

    // 6. Compute Total
    const totalDue = grossTax + adjustment;

    // 7. Update UI
    document.getElementById('dispTaxYear').textContent = targetTaxYear;
    document.getElementById('dispAssessed').textContent = formatMoney(assessedVal);
    document.getElementById('dispBasic').textContent = formatMoney(basicTax);
    document.getElementById('dispSef').textContent = formatMoney(sefTax);
    
    document.getElementById('adjLabel').textContent = label;
    document.getElementById('adjAmount').textContent = formatMoney(adjustment);
    
    // Color coding adjustment amount
    const adjElem = document.getElementById('adjAmount');
    if (adjustment < 0) adjElem.style.color = "#16a085"; // Green
    else if (adjustment > 0) adjElem.style.color = "#c0392b"; // Red
    else adjElem.style.color = "#333";

    document.getElementById('dispTotal').textContent = formatMoney(totalDue);

    // Status Badge
    const badge = document.getElementById('statusBadge');
    badge.style.display = 'block';
    badge.className = "status-badge " + statusClass;
    badge.textContent = statusText;
}

function formatMoney(num) {
    return '₱ ' + num.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}
