// script.js - Professional Edition

// --- UTILS & HELPERS ---
function $(id){ return document.getElementById(id); }
function nowId(prefix='id'){ return `${prefix}_${Date.now()}_${Math.floor(Math.random()*9000)+1000}`; }
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]; }); }

// Custom Toast Notification
function showToast(message, type='info'){
  const container = $('toast-container');
  if(!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="ri-information-fill"></i> <span>${message}</span>`;
  if(type === 'error') toast.style.borderLeftColor = 'var(--danger)';
  if(type === 'success') toast.style.borderLeftColor = 'var(--success)';
  
  container.appendChild(toast);
  setTimeout(()=>{
    toast.style.opacity = '0';
    setTimeout(()=> toast.remove(), 300);
  }, 3000);
}

// File Reader Helper
function readFileAsDataURL(file){
  return new Promise((res, rej)=>{
    const r = new FileReader();
    r.onload = ()=>res(r.result);
    r.onerror = ()=>rej(new Error('Read error'));
    r.readAsDataURL(file);
  });
}

// --- DEMO DATA GENERATOR ---
// This ensures the "Course List" is not empty when you start
function seedData(){
  // Seed Notes
  if(!localStorage.getItem('notes')){
    const dummyNotes = [
      { id: 'n1', title: 'Complete Web Development Roadmap', fileName: 'roadmap.pdf', isDemo: true, createdAt: Date.now() },
      { id: 'n2', title: 'React.js Hooks Cheatsheet', fileName: 'react_hooks.pdf', isDemo: true, createdAt: Date.now() },
      { id: 'n3', title: 'Data Structures & Algorithms', fileName: 'dsa_basics.docx', isDemo: true, createdAt: Date.now() }
    ];
    localStorage.setItem('notes', JSON.stringify(dummyNotes));
  }
  // Seed Videos
  if(!localStorage.getItem('videos')){
    const dummyVideos = [
      { id: 'v1', title: 'Introduction to Machine Learning', fileName: 'intro_ml.mp4', isDemo: true, createdAt: Date.now() },
      { id: 'v2', title: 'CSS Grid vs Flexbox', fileName: 'css_layout.mp4', isDemo: true, createdAt: Date.now() }
    ];
    localStorage.setItem('videos', JSON.stringify(dummyVideos));
  }
  // Seed Quizzes
  if(!localStorage.getItem('quizzes')){
    const dummyQuizzes = [
      { id: 'q1', title: 'HTML & CSS Mastery', questions: [
          { text: 'What does CSS stand for?', options: ['Creative Style Sheets','Cascading Style Sheets','Computer Style Sheets'], correct: 1 },
          { text: 'Which HTML tag is used for internal CSS?', options: ['<style>','<script>','<css>'], correct: 0 }
      ]},
      { id: 'q2', title: 'JavaScript Logic', questions: [
          { text: 'What is 2 + "2" in JS?', options: ['4','22','NaN'], correct: 1 },
          { text: 'Which keyword defines a constant?', options: ['var','let','const'], correct: 2 }
      ]}
    ];
    localStorage.setItem('quizzes', JSON.stringify(dummyQuizzes));
  }
}

// --- NAVIGATION ---
function showSection(id){
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  
  const el = $(id);
  if(el) {
    el.classList.add('active');
    // Highlight sidebar
    const navLink = document.querySelector(`.nav-link[onclick="showSection('${id}')"]`);
    if(navLink) navLink.classList.add('active');
  }

  // Refresh Data on View
  if(id === 'student-dashboard') refreshStudentDashboard();
  if(id === 'admin-dashboard') renderAdminUsersList();
}

function updateNavVisibility(user){
  if($('guest-nav')) $('guest-nav').style.display = user ? 'none' : 'block';
  if($('student-nav')) $('student-nav').style.display = (user && user.role === 'student') ? 'block' : 'none';
  if($('admin-nav')) $('admin-nav').style.display = (user && user.role === 'admin') ? 'block' : 'none';
  if($('logout-btn')) $('logout-btn').style.display = user ? 'flex' : 'none';
}

// --- AUTHENTICATION ---
function registerUser(){
  const name = $('reg-name').value.trim();
  const email = $('reg-email').value.trim().toLowerCase();
  const password = $('reg-password').value;
  const role = $('reg-role').value;

  if(!name || !email || !password){ showToast('Please fill all fields', 'error'); return; }
  
  let users = JSON.parse(localStorage.getItem('users')||'[]');
  if(users.find(u=>u.email === email)){ showToast('Email already registered', 'error'); return; }
  
  users.push({ name, email, password, role });
  localStorage.setItem('users', JSON.stringify(users));
  
  showToast('Registration successful! Please login.', 'success');
  $('reg-name').value = ''; $('reg-email').value = ''; $('reg-password').value = '';
  showSection('login');
}

function loginUser(){
  const email = $('login-email').value.trim().toLowerCase();
  const password = $('login-password').value;
  
  if(!email || !password){ showToast('Enter credentials', 'error'); return; }
  
  let users = JSON.parse(localStorage.getItem('users')||'[]');
  const user = users.find(u=>u.email === email && u.password === password);
  
  if(!user){ showToast('Invalid credentials', 'error'); return; }
  
  localStorage.setItem('loggedUser', JSON.stringify(user));
  showToast(`Welcome, ${user.name}`, 'success');
  
  $('login-email').value = ''; $('login-password').value = '';
  initApp();
}

function logoutUser(){
  localStorage.removeItem('loggedUser');
  showToast('Logged out');
  showSection('home');
  updateNavVisibility(null);
}

function resetPassword(){
  const email = $('forgot-email').value.trim().toLowerCase();
  let users = JSON.parse(localStorage.getItem('users')||'[]');
  const idx = users.findIndex(u=>u.email === email);
  
  if(idx === -1){ showToast('Email not found', 'error'); return; }
  const np = prompt('Enter new password:');
  if(np){
    users[idx].password = np;
    localStorage.setItem('users', JSON.stringify(users));
    showToast('Password Reset Successful', 'success');
    showSection('login');
  }
}

// --- STUDENT DASHBOARD ---
function refreshStudentDashboard(){
  const u = JSON.parse(localStorage.getItem('loggedUser'));
  if(u) $('studentNamePortal').innerText = u.name;
  
  renderStudentNotes();
  renderStudentVideos();
  renderQuizzesList();
  updateStats(u);
}

function updateStats(user){
  const notes = JSON.parse(localStorage.getItem('notes')||'[]');
  const videos = JSON.parse(localStorage.getItem('videos')||'[]');
  const progress = getProgressForUser(user.email);
  
  $('stat-notes-count').innerText = notes.length;
  $('stat-videos-count').innerText = videos.length;
  $('stat-quiz-score').innerText = progress.quizResults.length;
}

function renderStudentNotes(){
  const container = $('studentNotesList');
  const notes = JSON.parse(localStorage.getItem('notes')||'[]').reverse();
  container.innerHTML = '';
  
  notes.forEach(n => {
    const card = document.createElement('div'); card.className = 'card';
    
    // Simulate buttons for demo files
    let btnHtml = '';
    if(n.isDemo){
      btnHtml = `<button onclick="showToast('Downloading demo file: ${n.fileName}...', 'success')" class="btn outline full-width"><i class="ri-download-line"></i> Download</button>`;
    } else {
      const link = n.dataUrl || n.sessionUrl;
      btnHtml = `<a href="${link}" download="${n.fileName}" class="btn outline full-width" onclick="recordProgress('note')"><i class="ri-download-line"></i> Download</a>`;
    }

    card.innerHTML = `
      <h4><i class="ri-file-text-fill" style="color:var(--primary)"></i> ${escapeHtml(n.title)}</h4>
      <div class="meta">Uploaded: ${new Date(n.createdAt).toLocaleDateString()}</div>
      ${btnHtml}
    `;
    container.appendChild(card);
  });
}

function renderStudentVideos(){
  const container = $('studentVideosList');
  const videos = JSON.parse(localStorage.getItem('videos')||'[]').reverse();
  container.innerHTML = '';
  
  videos.forEach(v => {
    const card = document.createElement('div'); card.className = 'card';
    let mediaHtml = '';
    
    if(v.isDemo){
      mediaHtml = `
        <div style="background:#000; height:150px; border-radius:8px; display:flex; align-items:center; justify-content:center; color:white; cursor:pointer;" onclick="showToast('Playing demo video: ${v.title}', 'success')">
          <i class="ri-play-circle-line" style="font-size:40px;"></i>
        </div>`;
    } else {
      const src = v.dataUrl || v.sessionUrl;
      mediaHtml = `<video src="${src}" controls style="width:100%; border-radius:8px;" onplay="recordProgress('video')"></video>`;
    }

    card.innerHTML = `
      <h4>${escapeHtml(v.title)}</h4>
      <div class="meta">${new Date(v.createdAt).toLocaleDateString()}</div>
      ${mediaHtml}
    `;
    container.appendChild(card);
  });
}

function renderQuizzesList(){
  const container = $('quizzesList');
  const quizzes = JSON.parse(localStorage.getItem('quizzes')||'[]');
  container.innerHTML = '';
  
  quizzes.forEach(q => {
    const card = document.createElement('div'); card.className = 'card';
    card.innerHTML = `
      <h4><i class="ri-question-answer-fill" style="color:var(--success)"></i> ${escapeHtml(q.title)}</h4>
      <div class="meta">${q.questions.length} Questions</div>
      <button onclick="openQuiz('${q.id}')" class="btn primary full-width">Start Quiz</button>
    `;
    container.appendChild(card);
  });
}

// --- QUIZ LOGIC ---
let activeQuiz = null; 
let quizAnswers = {};

function openQuiz(id){
  const quizzes = JSON.parse(localStorage.getItem('quizzes'));
  activeQuiz = quizzes.find(q => q.id === id);
  quizAnswers = {};
  
  $('quizTitleDisplay').innerText = activeQuiz.title;
  const content = $('quizContent');
  content.innerHTML = '';
  
  activeQuiz.questions.forEach((q, idx) => {
    const div = document.createElement('div');
    div.style.marginBottom = '20px';
    div.innerHTML = `<p style="font-weight:600; margin-bottom:10px;">${idx+1}. ${q.text}</p>`;
    
    q.options.forEach((opt, optIdx) => {
      const label = document.createElement('label');
      label.style.display = 'block'; label.style.padding='5px 0'; label.style.cursor='pointer';
      label.innerHTML = `<input type="radio" name="q_${idx}" value="${optIdx}" onchange="quizAnswers[${idx}] = ${optIdx}"> ${opt}`;
      div.appendChild(label);
    });
    content.appendChild(div);
  });
  
  $('quizModal').style.display = 'grid';
}

function submitQuiz(){
  if(!activeQuiz) return;
  let score = 0;
  activeQuiz.questions.forEach((q, idx) => {
    if(quizAnswers[idx] === q.correct) score++;
  });
  
  const percent = Math.round((score / activeQuiz.questions.length) * 100);
  showToast(`You scored ${percent}%`, percent > 50 ? 'success' : 'error');
  
  recordProgress('quiz', { title: activeQuiz.title, score: percent });
  closeQuiz();
  refreshStudentDashboard();
}

function closeQuiz(){ $('quizModal').style.display = 'none'; activeQuiz=null; }

// --- ADMIN UPLOADS ---
async function adminUploadNote(){
  if(!isAdmin()){ showToast('Unauthorized', 'error'); return; }
  const title = $('admin-note-title').value.trim();
  const fileInput = $('admin-note-file');
  if(!fileInput.files[0]){ showToast('Choose a file', 'error'); return; }
  
  const file = fileInput.files[0];
  const notes = JSON.parse(localStorage.getItem('notes')||'[]');
  
  const note = { id: nowId('n'), title: title || file.name, fileName: file.name, createdAt: Date.now() };
  
  if(file.size < 2000000){ // 2MB limit
    try { note.dataUrl = await readFileAsDataURL(file); } catch(e){ return; }
  } else {
    note.sessionUrl = URL.createObjectURL(file);
  }
  
  notes.push(note);
  localStorage.setItem('notes', JSON.stringify(notes));
  showToast('Note Uploaded', 'success');
  $('admin-note-title').value=''; fileInput.value='';
}

async function adminUploadVideo(){
  if(!isAdmin()){ showToast('Unauthorized', 'error'); return; }
  const title = $('admin-video-title').value.trim();
  const fileInput = $('admin-video-file');
  if(!fileInput.files[0]){ showToast('Choose a video', 'error'); return; }
  
  const file = fileInput.files[0];
  const videos = JSON.parse(localStorage.getItem('videos')||'[]');
  const vid = { id: nowId('v'), title: title || file.name, fileName: file.name, createdAt: Date.now() };
  
  if(file.size < 5000000){
    try { vid.dataUrl = await readFileAsDataURL(file); } catch(e){ return; }
  } else {
    vid.sessionUrl = URL.createObjectURL(file);
  }
  
  videos.push(vid);
  localStorage.setItem('videos', JSON.stringify(videos));
  showToast('Video Uploaded', 'success');
  $('admin-video-title').value=''; fileInput.value='';
}

function renderAdminUsersList(){
  const container = $('adminUsersList');
  const users = JSON.parse(localStorage.getItem('users')||'[]');
  container.innerHTML = '';
  
  if(!users.length){ container.innerHTML = '<p>No users yet.</p>'; return; }

  const table = document.createElement('table');
  table.style.width='100%'; table.style.borderCollapse='collapse';
  
  users.forEach(u => {
    const row = document.createElement('tr');
    row.style.borderBottom='1px solid #eee';
    row.innerHTML = `
      <td style="padding:10px;"><strong>${escapeHtml(u.name)}</strong></td>
      <td style="padding:10px;">${escapeHtml(u.email)}</td>
      <td style="padding:10px;">${u.role}</td>
      <td style="padding:10px; text-align:right;">
        <button class="btn danger" onclick="deleteUser('${u.email}')">Delete</button>
      </td>
    `;
    table.appendChild(row);
  });
  container.appendChild(table);
}

function deleteUser(email){
  if(!confirm('Delete User?')) return;
  let users = JSON.parse(localStorage.getItem('users')||'[]');
  users = users.filter(u=>u.email !== email);
  localStorage.setItem('users', JSON.stringify(users));
  renderAdminUsersList();
  showToast('User Deleted', 'info');
}

// --- PROGRESS ---
function getProgressForUser(email){
  const all = JSON.parse(localStorage.getItem('progress')||'[]');
  return all.find(p => p.email === email) || { email, quizResults: [], activities: [] };
}

function recordProgress(type, data={}){
  const u = JSON.parse(localStorage.getItem('loggedUser'));
  if(!u) return;
  let all = JSON.parse(localStorage.getItem('progress')||'[]');
  let p = all.find(x => x.email === u.email);
  if(!p) { p = { email: u.email, quizResults:[], activities:[] }; all.push(p); }
  
  if(type==='quiz') p.quizResults.push({ ...data, date: Date.now() });
  else p.activities.push({ type, date: Date.now() });
  
  const idx = all.findIndex(x => x.email === u.email);
  if(idx >= 0) all[idx] = p; else all.push(p);
  localStorage.setItem('progress', JSON.stringify(all));
}

function generateCertificate(){
  const u = JSON.parse(localStorage.getItem('loggedUser'));
  if(!u) return;
  const win = window.open('', '', 'width=800,height=600');
  win.document.write(`
    <html><body style="font-family:serif; text-align:center; border:20px solid #4f46e5; padding:50px; height:80vh; display:flex; flex-direction:column; justify-content:center;">
      <h1 style="color:#4f46e5; font-size:48px; margin:0;">Certificate of Completion</h1>
      <p style="font-size:20px; margin-top:20px;">This is to certify that</p>
      <h2 style="font-size:36px; margin:10px 0;">${u.name}</h2>
      <p>Has successfully accessed the EduPro Learning Materials.</p>
      <div style="margin-top:60px; border-top:2px solid #333; display:inline-block; padding-top:10px; width:200px;">Authorized Signature</div>
    </body></html>
  `);
}

// --- INIT ---
function initApp(){
  seedData(); // <--- THIS CREATES YOUR COURSE LIST AND NOTES AUTOMATICALLY
  const u = JSON.parse(localStorage.getItem('loggedUser'));
  updateNavVisibility(u);
  if(u){
    if(u.role === 'admin') showSection('admin-dashboard');
    else showSection('student-dashboard');
  } else {
    showSection('home');
  }
}

function isAdmin(){ const u = JSON.parse(localStorage.getItem('loggedUser')); return u && u.role==='admin'; }

document.addEventListener('DOMContentLoaded', initApp);