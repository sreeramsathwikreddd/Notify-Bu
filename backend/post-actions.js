// A:\5.Projects & Information\12.notifybu\backend\post-actions.js

/**
 * Handles the creation of new posts and updates to existing ones.
 * Maintains "Master Freshness" by updating lastActive on every edit.
 */
async function publishPost() {
    const btn = document.getElementById('publish-btn'); 
    const content = document.getElementById('post-content').value;
    
    // Safety check to prevent empty posts
    if(!content) return; 
    
    btn.disabled = true;
    const editId = document.getElementById('edit-post-id').value;
    
    const postData = { 
        content, 
        category: document.getElementById('post-category-select').value, 
        author: auth.currentUser.email, 
        scheduledFor: document.getElementById('schedule-toggle').checked ? 
            firebase.firestore.Timestamp.fromDate(new Date(document.getElementById('schedule-time').value)) : null 
    };

    try {
        if(editId) {
            // REFINEMENT: Handling Head Admin edits on Sub-Admin posts
            const oldDoc = await db.collection('posts').doc(editId).get();
            const oldData = oldDoc.data();
            
            let updatePayload = { 
                content: postData.content, 
                category: postData.category, 
                editedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastActive: firebase.firestore.FieldValue.serverTimestamp() // Master Freshness fix
            };
            
            // Attribution logic: If editor is not the author, track the editor
            if(oldData.author !== auth.currentUser.email) {
                updatePayload.lastEditor = auth.currentUser.email;
            }
            
            await db.collection('posts').doc(editId).update(updatePayload);
        } else {
            // New Post Logic
            postData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            postData.lastActive = firebase.firestore.FieldValue.serverTimestamp(); // Freshness for new posts
            await db.collection('posts').add(postData);
        }
        
        // UI cleanup after successful operation
        closePostModal(); 
    } catch (error) {
        console.error("Post Action Failed:", error);
        alert("Action failed. Please check your connection.");
    } finally {
        btn.disabled = false;
    }
}

/**
 * Prepares the modal with existing post data for editing.
 */
async function triggerEdit(id) { 
    const doc = await db.collection('posts').doc(id).get(); 
    const p = doc.data(); 
    
    document.getElementById('modal-title').innerText = "Edit Announcement"; 
    document.getElementById('edit-post-id').value = id; 
    document.getElementById('post-content').value = p.content; 
    
    // Hide scheduler area during edits as per locked logic
    document.getElementById('scheduler-toggle-area').classList.add('hidden'); 
    document.getElementById('post-modal').classList.remove('hidden'); 
}

/**
 * Removes a post from the database after confirmation.
 */
async function deletePost(id) { 
    if(confirm("Delete post?")) {
        await db.collection('posts').doc(id).delete(); 
    }
}