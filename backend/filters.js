// A:\5.Projects & Information\12.notifybu\backend\filters.js

function setFilter(cat, btn, type) { 
    const cls = type === 'student' ? '.filter-btn-student' : '.filter-btn-admin'; 
    if(type === 'student') currentFilterStudent = cat; else currentFilterAdmin = cat; 
    document.querySelectorAll(cls).forEach(b => { 
        b.classList.remove('bg-orange-600', 'text-white', 'border-orange-600'); 
        b.classList.add('bg-white', 'text-slate-700', 'border-slate-200'); 
    }); 
    btn.classList.remove('bg-white', 'text-slate-700', 'border-slate-200'); 
    btn.classList.add('bg-orange-600', 'text-white', 'border-orange-600'); 
    runFilters(type); 
}

function runFilters(type) { 
    const q = document.getElementById(type === 'student' ? 'search-updates-student' : 'search-updates-admin').value.toLowerCase(); 
    const cat = type === 'student' ? currentFilterStudent : currentFilterAdmin; 
    const feed = document.getElementById(type === 'student' ? 'student-posts' : 'admin-posts'); 
    if(!feed) return; 
    feed.querySelectorAll('.post-card').forEach(card => { 
        const catMatch = cat === 'all' || card.dataset.category === cat; 
        const searchMatch = card.querySelector('.post-content-text').innerText.toLowerCase().includes(q); 
        card.style.display = (catMatch && searchMatch) ? 'block' : 'none'; 
    }); 
}