/**
 * RPT Collection Logic
 * Based on Assessment Value (No reassessment)
 * Automatic computation based on Transaction Date
 */

function calculateTax() {
    // 1. Get Inputs
    const assessedValue = parseFloat(document.getElementById('assessedValue').value) || 0;
    const dateInput = document.getElementById('txnDate').value;
    
    // Rates (Standard 1% Basic + 1% SEF)
    const basicRate = 0.01;
    const sefRate = 0.01;

    // 2. Calculate Base Tax
    const basicTax = assessedValue * basicRate;
    const sefTax = assessedValue * sefRate;
    const grossTax = basicTax + sefTax;

    // 3. Date Logic (The Core Request)
    let adjustment = 0;
    let totalAmount = 0;
    let statusText = "";
    let statusClass = "";
    let labelText = "Adjustment:";

    if (dateInput) {
        const txnDate = new Date(dateInput);
        const month = txnDate.getMonth(); // 0 = Jan, 1 = Feb, ... 11 = Dec
        const year = txnDate.getFullYear();

        // LOGIC FOR YEAR 2026
        if (year === 2026) {
            
            // Q1: January (0) to March (2) -> DISCOUNT PERIOD
            if (month <= 2) { 
                // 20% Prompt Payment Discount (Standard)
                const discountRate = 0.20; 
                adjustment = -(grossTax * discountRate); // Negative because it reduces tax
                
                labelText = "Less: 20% Discount";
                statusText = "Prompt Payment Discount Applied (Q1)";
                statusClass = "discount-msg";
            
            // Q2-Q4: April (3) onwards -> PENALTY PERIOD
            } else {
                // Count months of delay starting from April
                // April (3) = 1 month late (2%)
                // May (4) = 2 months late (4%)
                const monthsLate = month - 2; 
                const penaltyRate = 0.02 * monthsLate; // 2% per month
                
                adjustment = grossTax * penaltyRate; // Positive because it adds to tax
                
                labelText = `Add: Penalty (${monthsLate * 2}%)`;
                statusText = `Late Payment: ${monthsLate} month(s) interest applied`;
                statusClass = "penalty-msg";
            }

        } else if (year < 2026) {
             statusText = "Warning: Date is in the past.";
        } else {
             statusText = "Warning: Future tax year.";
        }
    }

    // 4. Final Total
    totalAmount = grossTax + adjustment;

    // 5. Update UI
    document.getElementById('basicVal').textContent = formatMoney(basicTax);
    document.getElementById('sefVal').textContent = formatMoney(sefTax);
    
    // Update Adjustment Row
    document.getElementById('adjLabel').textContent = labelText;
    document.getElementById('adjVal').textContent = formatMoney(adjustment);
    
    // Color coding for discount vs penalty
    const adjValElement = document.getElementById('adjVal');
    if (adjustment < 0) adjValElement.style.color = "#27ae60"; // Green for discount
    else if (adjustment > 0) adjValElement.style.color = "#c0392b"; // Red for penalty
    else adjValElement.style.color = "#333";

    document.getElementById('totalDue').textContent = formatMoney(totalAmount);
    
    // Status Message
    const msgEl = document.getElementById('statusMessage');
    msgEl.textContent = statusText;
    msgEl.className = "status-msg " + statusClass;
}

// Helper for Peso formatting
function formatMoney(amount) {
    return '₱ ' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Set default date to today automatically when page loads
document.addEventListener("DOMContentLoaded", function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('txnDate').value = today;
    calculateTax(); // Run once on load
});
