// dashboard.js
import { db } from "./firebaseConfig.js";
import { doc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";

// Get user data from session storage
const userData = JSON.parse(sessionStorage.getItem("userData"));
const userId = sessionStorage.getItem("userId");

if (!userData) {
    window.location.href = "login.html"; // Redirect if not logged in
}

// Display User Info
document.getElementById("user-name").textContent = userData.name;
document.getElementById("user-email").textContent = userData.email;
document.getElementById("user-balance").textContent = userData.accountBalance;

// Populate Loans
const loanList = document.getElementById("loan-list");
const loanSelect = document.getElementById("loan-select");

userData.loans.forEach((loan, index) => {
    const li = document.createElement("li");
    li.textContent = `Loan Amount: $${loan.amount}, Due: ${loan.dueDate}, Status: ${loan.status}`;
    loanList.appendChild(li);

    if (loan.status === "active") {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = `Loan: $${loan.amount}`;
        loanSelect.appendChild(option);
    }
});

const repaymentForm = document.getElementById("repayment-form");
const repayMessage = document.getElementById("repay-message");

// Repayment Logic
repaymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const repayAmount = parseFloat(document.getElementById("repay-amount").value);
    const selectedLoanIndex = parseInt(loanSelect.value);
    const selectedLoan = userData.loans[selectedLoanIndex];

    if (repayAmount > 0) {
        selectedLoan.amount -= repayAmount;

        if (selectedLoan.amount <= 0) {
            selectedLoan.status = "paid";
            repayMessage.textContent = "Loan fully paid!";
        } else {
            repayMessage.textContent = `You have repaid $${repayAmount}. Remaining balance: $${selectedLoan.amount}`;
        }

        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            loans: userData.loans,
            accountBalance: userData.accountBalance + repayAmount
        });

        userData.accountBalance += repayAmount;
        document.getElementById("user-balance").textContent = userData.accountBalance;
        repaymentForm.reset();
    }
});

// Loan Application Form Logic
const loanApplicationForm = document.getElementById("loan-application-form");
const loanMessage = document.getElementById("loan-message");

loanApplicationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const loanAmount = parseFloat(document.getElementById("loan-amount").value);
    const loanInterest = parseFloat(document.getElementById("loan-interest").value);
    const loanDueDate = document.getElementById("loan-due-date").value;

    const newLoan = {
        amount: loanAmount,
        interest: loanInterest,
        dueDate: loanDueDate,
        status: "active"
    };

    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
        loans: arrayUnion(newLoan)
    });

    loanMessage.textContent = "Loan successfully applied!";
    loanApplicationForm.reset();
});
