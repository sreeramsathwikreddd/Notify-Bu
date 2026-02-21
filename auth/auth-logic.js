// A:\5.Projects & Information\12.notifybu\auth\auth-logic.js

function togglePassVisibility(id, el) { 
    const input = document.getElementById(id); 
    if (input.type === 'password') { 
        input.type = 'text'; 
        el.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L4.512 4.512M12 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>`; 
    } else { 
        input.type = 'password'; 
        el.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>`; 
    } 
}
// A:\5.Projects & Information\12.notifybu\auth\auth-logic.js

// Auth state listener to handle routing and role-based UI
auth.onAuthStateChanged(async (user) => {
    // Strictly force hide management sidebars on every attempt
    document.getElementById('headadmin-sidebars').classList.add('hidden');
    
    if (user) {
        // Fetch authorization lists
        const adminDoc = await db.collection('settings').doc('admins').get();
        const admins = adminDoc.exists ? adminDoc.data().adminList || [] : [];
        const isAuthA = admins.find(a => a.email === user.email);
        
        const studentDoc = await db.collection('settings').doc('students').get();
        const students = studentDoc.exists ? studentDoc.data().studentList || [] : [];
        const isAuthS = students.find(s => s.email === user.email);

        // Security check for unauthorized access
        if (user.email !== 'headadmin@bennett.edu.in' && !isAuthA && !isAuthS) {
            alert("Go to Admin and Ask him to revoke you."); 
            auth.signOut(); 
            return;
        }

        // Final role assignment
        userRole = (user.email === 'headadmin@bennett.edu.in' || isAuthA) ? 'admin' : 'student';
        
        // UI Preparation
        document.getElementById('nav-user-area').classList.remove('hidden');
        document.getElementById('display-email').innerText = user.email;
        document.getElementById('profile-icon').innerText = user.email[0].toUpperCase();

        if (userRole === 'admin') {
            // ONLY reveal management sidebars for the Head Admin
            if(user.email === 'headadmin@bennett.edu.in') {
                document.getElementById('headadmin-sidebars').classList.remove('hidden');
                loadAuthorizedAdmins('admins'); 
                loadAuthorizedAdmins('students');
            }
            showView('admin-dashboard');
        } else { 
            showView('student-dashboard'); 
        }
        
        // Trigger the feed logic once auth is confirmed
        listenToPosts();
        
    } else { 
        userRole = null; 
        document.getElementById('nav-user-area').classList.add('hidden'); 
        document.getElementById('profile-modal').classList.add('hidden'); 
        showView('login-card'); 
    }
});

// Logic for Head Admin to create Direct Login accounts
async function addUser(type) {
    const eId = type === 'admins' ? 'subadmin-email-input' : 'student-email-input';
    const pId = type === 'admins' ? 'subadmin-pass-input' : 'student-pass-input';
    const email = document.getElementById(eId).value.trim();
    const password = document.getElementById(pId).value;
    
    if(!email || !password) return;
    
    const ref = db.collection('settings').doc(type);
    const doc = await ref.get();
    const field = type === 'admins' ? 'adminList' : 'studentList';
    let list = doc.exists ? doc.data()[field] || [] : [];
    
    if(!list.find(u => u.email === email)) {
        list.push({ email, password });
        await ref.set({ [field]: list });
        try {
            // Silently create the background account for Direct Login
            const secondaryApp = firebase.initializeApp(firebaseConfig, "secondary" + Date.now());
            await secondaryApp.auth().createUserWithEmailAndPassword(email, password);
            await secondaryApp.delete();
        } catch(e) { console.log("Direct login account created."); }
    }
    loadAuthorizedAdmins(type);
}

// UI Helper functions for auth views
function showView(id) { 
    ['login-card', 'signup-card', 'student-dashboard', 'admin-dashboard'].forEach(v => document.getElementById(v).classList.add('hidden')); 
    document.getElementById(id).classList.remove('hidden'); 
}

document.getElementById('go-to-signup').onclick = () => showView('signup-card');
document.getElementById('go-to-login').onclick = () => showView('login-card');

// Global Login submission
document.getElementById('login-form').onsubmit = async (e) => { 
    e.preventDefault(); 
    try { 
        await auth.signInWithEmailAndPassword(document.getElementById('email').value, document.getElementById('password').value); 
    } catch(err) { 
        alert("Invalid details."); 
    } 
};

// UI loading for authorized lists
async function loadAuthorizedAdmins(type) {
    const doc = await db.collection('settings').doc(type).get();
    const listEl = document.getElementById(type === 'admins' ? 'admin-list' : 'student-auth-list');
    listEl.innerHTML = '';
    if(doc.exists) {
        const field = type === 'admins' ? 'adminList' : 'studentList';
        const items = doc.data()[field] || [];
        items.forEach(item => {
            listEl.innerHTML += `<div class="flex justify-between bg-slate-50 p-2 rounded mb-1 border items-center"><span>${item.email}</span><button onclick="removeUser('${item.email}', '${type}')" class="text-red-500 font-bold p-1">×</button></div>`;
        });
    }
}

async function removeUser(email, type) {
    if(!confirm("Revoke access?")) return;
    const ref = db.collection('settings').doc(type);
    const doc = await ref.get();
    const field = type === 'admins' ? 'adminList' : 'studentList';
    const list = doc.data()[field].filter(u => u.email !== email);
    await ref.set({ [field]: list });
    loadAuthorizedAdmins(type);
}

function toggleProfileModal() { document.getElementById('profile-modal').classList.toggle('hidden'); }
function closePostModal() { document.getElementById('post-modal').classList.add('hidden'); }
// Add these to the bottom of A:\5.Projects & Information\12.notifybu\auth\auth-logic.js

function openPostModal() { 
    document.getElementById('modal-title').innerText = "New Announcement"; 
    document.getElementById('edit-post-id').value = ""; 
    document.getElementById('post-content').value = ""; 
    document.getElementById('schedule-toggle').checked = false; 
    toggleScheduleFields(); 
    if(userRole === 'admin') { 
        document.getElementById('scheduler-toggle-area').classList.remove('hidden'); 
    } 
    document.getElementById('post-modal').classList.remove('hidden'); 
}

function toggleScheduleFields() { 
    const active = document.getElementById('schedule-toggle').checked; 
    document.getElementById('schedule-fields').classList.toggle('hidden', !active); 
    document.getElementById('publish-btn').innerText = active ? "Schedule Post" : "Publish Now"; 
}