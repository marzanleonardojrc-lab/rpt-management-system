/**
 * Real Property Tax (RPT) Calculator
 * Designed for: Municipal Treasurer's Office usage
 * Tax Year: 2026
 */

// Configuration: Adjust these constants based on your local ordinance
const RPT_CONFIG = {
    basicRate: 0.01,       // 1% Basic Tax for Province/Municipality (Use 0.02 for Cities)
    sefRate: 0.01,         // 1% Special Education Fund (Fixed)
    penaltyRate: 0.02,     // 2% Interest per month of delay
    maxPenaltyMonths: 36,  // Max 36 months (72%) cap usually
    discountRate: 0.20     // 20% Prompt Payment Discount (Common for Jan-Mar payments)
};

function calculateRPT() {
    // 1. Get Input Values
    // Use parseFloat to ensure we are doing math, not string concatenation
    const fmv = parseFloat(document.getElementById('fmv').value) || 0; 
    const assessmentLevel = parseFloat(document.getElementById('assessmentLevel').value) || 0;
    const isEarlyPayment = document.getElementById('availDiscount').checked; // Checkbox for discount
    const monthsDelayed = parseFloat(document.getElementById('monthsDelayed').value) || 0; // 0 if current

    // 2. Compute Assessed Value
    // Formula: Fair Market Value * Assessment Level
    const assessedValue = fmv * assessmentLevel;

    // 3. Compute Gross Tax (Basic + SEF)
    // Note: Basic and SEF are usually computed separately for accounting, but summed for the payer
    const basicTax = assessedValue * RPT_CONFIG.basicRate;
    const sefTax = assessedValue * RPT_CONFIG.sefRate;
    const grossTax = basicTax + sefTax;

    // 4. Compute Deductions (Discount) or Additions (Penalties)
    let discountAmount = 0;
    let penaltyAmount = 0;

    if (isEarlyPayment) {
        // Apply Discount if paid within Q1 2026
        discountAmount = grossTax * RPT_CONFIG.discountRate;
    } else if (monthsDelayed > 0) {
        // Apply Penalty if late
        // Cap the months at the maximum allowed (usually 36 months)
        const chargeableMonths = Math.min(monthsDelayed, RPT_CONFIG.maxPenaltyMonths);
        penaltyAmount = grossTax * (RPT_CONFIG.penaltyRate * chargeableMonths);
    }

    // 5. Compute Net Payable
    const netPayable = grossTax - discountAmount + penaltyAmount;

    // 6. Display Results (Pushing values back to HTML)
    displayResult('assessedValueDisplay', assessedValue);
    displayResult('basicTaxDisplay', basicTax);
    displayResult('sefTaxDisplay', sefTax);
    displayResult('discountDisplay', discountAmount);
    displayResult('penaltyDisplay', penaltyAmount);
    displayResult('netPayableDisplay', netPayable);
}

// Helper function to format currency (PHP)
function displayResult(elementId, amount) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerText = '₱ ' + amount.toLocaleString('en-PH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
}

// Event Listener: Auto-calculate when inputs change
// You need to ensure your HTML inputs have the class 'rpt-input'
const inputs = document.querySelectorAll('.rpt-input');
inputs.forEach(input => {
    input.addEventListener('input', calculateRPT);
});