// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, 
  signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { 
  getFirestore, doc, setDoc, getDoc, getDocs, collection, deleteDoc 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyAeZMi0NUy_nK_MnIPLsLrBsWMfEmSnpdI",
  authDomain: "tayabastrack-e35e8.firebaseapp.com",
  projectId: "tayabastrack-e35e8",
  storageBucket: "tayabastrack-e35e8.appspot.com", 
  messagingSenderId: "1061725769501",
  appId: "1:1061725769501:web:93fd6c6524faba052d5bf4",
  measurementId: "G-XRP91VJK3G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 🔑 Login (Super Admin or Admin)
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 🔍 Get user doc from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      alert("No user profile found in Firestore.");
      await signOut(auth);
      return;
    }

    const userData = userDoc.data();
    const role = userData.role || userData.position; // accept either field

    // 🔒 Role-based redirects
    if (role === "super" || role === "Super Admin") {
      window.location.href = "dashboard.html";
    } else if (role === "admin" || role === "Admin") {
      window.location.href = "ad_dashboard.html";
    } else {
      alert("Access denied. Not authorized.");
      await signOut(auth);
    }

  } catch (error) {
    alert("Login failed: " + error.message);
  }
});

// Add User
async function saveUser() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const address = document.getElementById("address").value;
  const phonenumber = document.getElementById("contact").value;
  const role = document.getElementById("role")?.value || "super";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    await setDoc(doc(db, "users", newUser.uid), {
      name, email, password, address, phonenumber, role
    });

    alert("✅ User added successfully");
    loadUsers();
    closeModal();
  } catch (error) {
    alert("Error adding user: " + error.message);
  }
}
window.saveUser = saveUser;

// Load Users
async function loadUsers() {
  const tableBody = document.getElementById("userTableBody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  try {
    const snapshot = await getDocs(collection(db, "users"));
    if (snapshot.empty) {
      tableBody.innerHTML = `<tr><td colspan="7">No users found.</td></tr>`;
      return;
    }

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const row = `
        <tr>
          <td>${data.name || ""}</td>
          <td>${data.email || ""}</td>
          <td>${data.password || ""}</td>
          <td>${data.address || ""}</td>
          <td>${data.phonenumber || ""}</td>
          <td>${data.role || ""}</td>
          <td>
            <button onclick="deleteUser('${docSnap.id}')">Delete</button>
          </td>
        </tr>`;
      tableBody.innerHTML += row;
    });
  } catch (error) {
    console.error("Error loading users:", error);
    tableBody.innerHTML = `<tr><td colspan="7">Error loading users</td></tr>`;
  }
}
window.loadUsers = loadUsers;

// Delete User
async function deleteUser(uid) {
  if (confirm("Are you sure you want to delete this user?")) {
    await deleteDoc(doc(db, "users", uid));
    alert("✅ User deleted");
    loadUsers();
  }
}
window.deleteUser = deleteUser;

// Logout
async function logout() {
  await signOut(auth);
  window.location.href = "index.html";
}
window.logout = logout;

// Show logged-in user's name
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const nameEl = document.querySelector(".dashboard-user-info strong");
      if (nameEl) nameEl.textContent = userDoc.data().name || "No Name";
    }
    loadUsers();
  } else {
    // redirect to login if logged out
    if (!window.location.href.includes("index.html")) {
      window.location.href = "index.html";
    }
  }
});

// Highlight active menu
const currentPage = window.location.pathname.split("/").pop();
document.querySelectorAll(".dashboard-menu li a").forEach(link => {
  if (link.getAttribute("href") === currentPage) {
    link.parentElement.classList.add("dashboard-active");
  } else {
    link.parentElement.classList.remove("dashboard-active");
  }
});
