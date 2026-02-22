// A:\5.Projects & Information\12.notifybu\firebase\config.js

const firebaseConfig = { 
    apiKey: "", 
    authDomain: "notifybu.firebaseapp.com", 
    projectId: "notifybu", 
    storageBucket: "notifybu.appspot.com", 
    messagingSenderId: "776366551381", 
    appId: "1:776366551381:web:6564e9a0f44e6677f3e8f6" 
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); 
const db = firebase.firestore(); 
const storage = firebase.storage();
