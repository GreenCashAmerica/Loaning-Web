// dashboard.js
import { db } from "./firebaseConfig.js";
import { doc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";

// Get user data from session storage
const userId = sessionStorage.getItem("userId");

// Redirect if not logged in
if (!userId) {
    window.location.href = "login.html";
}

// Firestore reference to the user
const userRef = doc(db, "users", userId);

// Display User Info and Loans
async function loadUserData() {
    const userSnapshot = await getDoc(userRef);
    if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        sessionStorage.setItem("userData", JSON.stringify(userData));

        document.getElementById("user-name").textContent = userData.name;
        document.getElementById("user-email").textContent = userData.email;
        document.getElementById("user-balance").textContent = userData.accountBalance;

        // Clear old loan data
        loanList.innerHTML = "";
        loanSelect.innerHTML = "";

        // Populate Loans
        userData.loans.forEach((loan, index) => {
            const li = document.createElement("li");
            li.textContent = `Loan Amount: $${loan.amount}, Interest: ${loan.interest}%, Due: ${loan.dueDate}, Status: ${loan.status}`;
            loanList.appendChild(li);

            if (loan.status === "active") {
                const option = document.createElement("option");
                option.value = index;
                option.textContent = `Loan: $${loan.amount}`;
                loanSelect.appendChild(option);
            }
        });
    } else {
        console.error("No such document!");
    }
}

// Call the loader initially
loadUserData();

// Populate Loans
const loanList = document.getElementById("loan-list");
const loanSelect = document.getElementById("loan-select");
const repaymentForm = document.getElementById("repayment-form");
const repayMessage = document.getElementById("repay-message");

// 🔄 **Repayment Logic**
repaymentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const repayAmount = parseFloat(document.getElementById("repay-amount").value);
    const selectedLoanIndex = parseInt(loanSelect.value);
    
    // Get latest data from Firestore
    const userSnapshot = await getDoc(userRef);
    const userData = userSnapshot.data();
    const selectedLoan = userData.loans[selectedLoanIndex];

    if (repayAmount > 0 && selectedLoan.status === "active") {
        selectedLoan.amount -= repayAmount;

        if (selectedLoan.amount <= 0) {
            selectedLoan.status = "paid";
            repayMessage.textContent = "Loan fully paid!";
        } else {
            repayMessage.textContent = `You have repaid $${repayAmount}. Remaining balance: $${selectedLoan.amount}`;
        }

        // Update Firestore
        await updateDoc(userRef, {
            loans: userData.loans,
            accountBalance: userData.accountBalance - repayAmount // 🔄 Reduce balance on repay
        });

        // Reload data to reflect changes
        loadUserData();
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

    // Add to Firestore
    await updateDoc(userRef, {
        loans: arrayUnion(newLoan)
    });

    loanMessage.textContent = "Loan successfully applied!";
    loadUserData();  // Reload data to show the new loan
    loanApplicationForm.reset();
});
