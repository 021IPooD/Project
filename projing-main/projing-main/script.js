// 1️⃣ Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDj10H-KPaaIV0NnozhYgGZWl2KHr2jP-4",
  authDomain: "test-modull.firebaseapp.com",
  databaseURL: "https://test-modull-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "test-modull",
  storageBucket: "test-modull.firebasestorage.app",
  messagingSenderId: "134374783317",
  appId: "1:134374783317:web:2bb259c0627ec08e1697dc"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();
const messaging = firebase.messaging(); 

let meds = [];
let editIndex = -1;
let soundEnabled = true;

// แสดง/ซ่อนหน้า
function showPage(pageId){
  ['loginPage','registerPage','mainPage','addPage','popupPage'].forEach(p=>{
    document.getElementById(p).classList.add('hidden');
  });
  document.getElementById(pageId).classList.remove('hidden');
}

// 2️⃣ Authentication

function registerUser() {
  const email = document.getElementById("regEmail").value;
  const pass = document.getElementById("regPass").value;
  if(!email||!pass){ alert("กรอกข้อมูลให้ครบ"); return; }

  auth.createUserWithEmailAndPassword(email, pass)
    .then(() => { alert("สมัครสมาชิกสำเร็จ!"); showPage('loginPage'); })
    .catch(error => { alert(error.message); });
}

function loginUser() {
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPass").value;

  auth.signInWithEmailAndPassword(email, pass)
    .then(() => { showPage('mainPage'); loadMedicines(); })
    .catch(error => { alert("อีเมลหรือรหัสผ่านไม่ถูกต้อง: " + error.message); });
}

// 3️⃣ Load Medicines
function loadMedicines() {
  const userId = auth.currentUser.uid;
  database.ref(`users/${userId}/meds`).once('value', snapshot => {
    meds = [];
    snapshot.forEach(child => {
      meds.push({ id: child.key, ...child.val() });
    });
    renderMedicines();
  });
}

// 4️⃣ Render Medicines
function renderMedicines() {
  const list = document.getElementById("reminderList");
  list.innerHTML = "";
  meds.forEach((r,i)=>{
    const div = document.createElement("div");
    div.className="reminder-item";
    div.innerHTML = `<strong>${r.name}</strong> (${r.dosage}) - ${r.time}
      <button onclick="editMedicine(${i})">แก้ไข</button>
      <button onclick="deleteMedicine(${i})">ลบ</button>`;
    list.appendChild(div);
  });
}

// 5️⃣ Add/Edit/Delete
function editMedicine(i){
  editIndex = i;
  document.getElementById("medName").value = meds[i].name;
  document.getElementById("dosage").value = meds[i].dosage;
  document.getElementById("time").value = meds[i].time;
  showPage('addPage');
}

function deleteMedicine(i){
  if(confirm("ลบรายการนี้หรือไม่?")){
    const userId = auth.currentUser.uid;
    const medId = meds[i].id;
    database.ref(`users/${userId}/meds/${medId}`).remove();
    loadMedicines();
  }
}

function saveMedicine(){
  const name = document.getElementById("medName").value;
  const dosage = document.getElementById("dosage").value;
  const time = document.getElementById("time").value;
  const userId = auth.currentUser.uid;

  if(!name||!dosage||!time){ alert("กรอกข้อมูลให้ครบ"); return; }

  const medData = { name, dosage, time, notified:false };

  if(editIndex >= 0){
    const medId = meds[editIndex].id;
    database.ref(`users/${userId}/meds/${medId}`).set(medData);
    editIndex = -1;
  } else {
    const newMedRef = database.ref(`users/${userId}/meds`).push();
    medData.id = newMedRef.key;
    newMedRef.set(medData);
  }

  loadMedicines();
  showPage('mainPage');
}

function cancelAdd(){ editIndex=-1; showPage('mainPage'); }

// 6️⃣ Sound Toggle
function toggleSound(){
  soundEnabled = !soundEnabled;
  document.getElementById("soundToggle").innerText = soundEnabled?"🔊 เปิดเสียงแจ้งเตือน":"🔇 ปิดเสียงแจ้งเตือน";
}

// 7️⃣ ฟังก์ชันพูด (TTS)
function speakText(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "th-TH";
  utter.rate = 1;
  utter.pitch = 1;
  speechSynthesis.speak(utter);
}



// 8️⃣ Popup Notification
function showPopup(r){
  const message = `ถึงเวลาทานยา ${r.name} ปริมาณ ${r.dosage} เวลา ${r.time} แล้วครับ`;
  document.getElementById("popupText").innerText = message;
  document.getElementById("popupPage").classList.remove('hidden');
  
  if(soundEnabled){
    speakText(message);
  }

  // เริ่มฟังเสียงเมื่อ popup เด้ง
  startListening(r);
}

function acknowledgePopup(){
  document.getElementById("popupPage").classList.add('hidden');
}

// 9️⃣ ฟังก์ชันฟังเสียงผู้ใช้ (STT)
function startListening(r) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.log("เบราว์เซอร์นี้ไม่รองรับการสั่งงานด้วยเสียง");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "th-TH";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript.trim();
    console.log("คุณพูดว่า:", transcript);

    if (transcript.includes("รับทราบ")) {
      acknowledgePopup();
      speakText("ระบบบันทึกว่า คุณรับทราบแล้วครับ");
    } 
    
    else {
      speakText("ขอโทษครับ ไม่เข้าใจคำสั่ง");
    }
  };

  recognition.onerror = function(event) {
    console.error("เกิดข้อผิดพลาดในการฟัง:", event.error);
    speakText("ขออภัย ไม่สามารถฟังเสียงได้");
  };
}


// 1️⃣1️⃣ Interval Checker
setInterval(()=>{
  const now = new Date();
  const current = now.toTimeString().slice(0,5);
  meds.forEach(r=>{
    if(r.time===current && !r.notified){
      showPopup(r);
      r.notified=true;
      const userId = auth.currentUser.uid;
      database.ref(`users/${userId}/meds/${r.id}/notified`).set(true);
    }
  });
},60000);

// เริ่มด้วยหน้า Login
showPage('loginPage');




document.getElementById("unlockSound").addEventListener("click", () => {
  const utter = new SpeechSynthesisUtterance("ระบบพร้อมใช้งานเสียงแล้วครับ");
  utter.lang = "th-TH";
  speechSynthesis.speak(utter);
  alert("ปลดล็อกเสียงสำเร็จแล้ว ✅");
});






document.getElementById("logoutBtn").addEventListener("click", () => {
  if(confirm("คุณต้องการออกจากระบบใช่หรือไม่?")) {
    auth.signOut().then(() => {
      showPage('loginPage');
      alert("ออกจากระบบเรียบร้อยแล้ว ✅");
    }).catch(error => {
      alert("เกิดข้อผิดพลาด: " + error.message);
    });
  }
});

function startListeningInput(fieldId) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("เบราว์เซอร์นี้ไม่รองรับการสั่งงานด้วยเสียง");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "th-TH";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.start();

  recognition.onresult = function(event) {
    const transcript = event.results[0][0].transcript.trim();
    console.log("รับเสียง:", transcript);
    document.getElementById(fieldId).value = transcript;
    
    // อ่านเสียงยืนยัน
    const utter = new SpeechSynthesisUtterance(`ใส่ข้อมูลเรียบร้อย: ${transcript}`);
    utter.lang = "th-TH";
    speechSynthesis.speak(utter);
  };

  recognition.onerror = function(event) {
    console.error("เกิดข้อผิดพลาดในการฟัง:", event.error);
    speakText("ขออภัย ไม่สามารถฟังเสียงได้");
  };
}
