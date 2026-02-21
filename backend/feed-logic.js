// A:\5.Projects & Information\12.notifybu\backend\feed-logic.js

function listenToPosts() {
    // Sort by lastActive (Freshness) instead of createdAt to keep edited posts on top
    db.collection('posts').orderBy('lastActive', 'desc').onSnapshot(snap => {
        const studentFeed = document.getElementById('student-posts'); 
        const adminFeed = document.getElementById('admin-posts');
        
        studentFeed.innerHTML = ''; 
        adminFeed.innerHTML = ''; 
        const now = new Date();

        snap.forEach(doc => {
            const post = doc.data(); 
            const isSched = post.scheduledFor && post.scheduledFor.toDate() > now;
            
            // Logic to strictly use Delivery Time for scheduled/new posts
            let timeSource = (isSched || !post.createdAt) ? post.scheduledFor : (post.editedAt || post.createdAt);
            let time = timeSource ? timeSource.toDate().toLocaleDateString() + ' ' + timeSource.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : "Just now";
            
            let editedTag = post.editedAt ? `<span class="text-[8px] text-orange-500 font-bold ml-1 uppercase italic">(Edited)</span>` : "";
            
            let authorDisplay = post.author;
            if(post.lastEditor && post.lastEditor !== post.author) {
                authorDisplay = `${post.author} <span class="text-blue-500">(edited by ${post.lastEditor})</span>`;
            }

            const controls = (userRole === 'admin' && (auth.currentUser.email === 'headadmin@bennett.edu.in' || auth.currentUser.email === post.author)) ? `<button onclick="triggerEdit('${doc.id}')" class="text-blue-500 text-[10px] font-bold hover:underline">Edit</button><button onclick="deletePost('${doc.id}')" class="text-red-500 text-[10px] font-bold hover:underline">Delete</button>` : '';
            
            // Both students and admins now see the ${isSched ? '(Scheduled)' : ''} tag
            const cardHtml = `
                <div class="post-card p-5 border rounded-xl bg-white shadow-sm mb-4" data-category="${post.category}">
                    <div class="flex justify-between items-center mb-2">
                        <span class="px-2 py-1 bg-orange-50 text-orange-600 text-[10px] font-bold uppercase rounded">${post.category} ${isSched ? '(Scheduled)' : ''}</span>
                        <span class="text-[10px] text-slate-400 font-medium">${time} ${editedTag}</span>
                    </div>
                    <p class="text-slate-700 text-sm font-medium post-content-text">${post.content}</p>
                    <div class="flex justify-between items-center border-t pt-3 mt-4">
                        <p class="text-[9px] text-slate-400 italic font-bold">Author: ${authorDisplay}</p>
                        <div class="flex gap-2">${controls}</div>
                    </div>
                </div>`;

            if (!isSched) studentFeed.innerHTML += cardHtml; 
            adminFeed.innerHTML += cardHtml;
        });
        
        // Refresh filters to ensure the search/category state is maintained
        runFilters('student'); 
        runFilters('admin');
    });
}