document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 V4.2 Renderer: Final Fixes (Definitions & Sync)");

    // --- CONFIGURACIÓN DE LA NUBE ---
    // 👇👇👇 ¡PEGA AQUÍ TU URL DEL SCRIPT! 👇👇👇
    const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyu1RJZxzYttFTUhes3S-sslHJVtbsiW1xXYS3Vre1wZXOW3ksGPEPHrMxssCb6bac7cg/exec"; 

    // --- VARIABLES DE ESTADO ---
    let currentSettings = JSON.parse(localStorage.getItem('habit_settings')) || { habits: [] };
    let currentViewDate = getLocalISODate();
    let currentDayData = { fecha: currentViewDate, progreso: 0, habitos: {}, nota: "" };
    let globalHistory = [];
    let isDataLoaded = false;
    let openSections = new Set();
    let weeklyChart = null;
    let habitsChart = null;
    let editingId = null; 
    let currentBase64Icon = null;

    // --- DOM REFERENCES (DEFINICIONES SEGURAS) ---
    // Header & KPIs
    const datePickerInput = document.getElementById('global-date-picker');
    const btnCalendarTrigger = document.getElementById('btn-calendar-trigger');
    const dashboardTitle = document.getElementById('dashboard-title');
    const progressLabel = document.getElementById('progress-label-text');
    const heroPercent = document.getElementById('hero-percent');
    const heroFill = document.getElementById('hero-progress-fill');
    const streakDisplay = document.getElementById('streak-display');
    const totalDaysDisplay = document.getElementById('total-days-display');
    const btnStatsScroll = document.getElementById('btn-stats-scroll');

    // List & Actions
    const habitListEl = document.getElementById('interactive-habit-list');
    const btnToggleAll = document.getElementById('btn-toggle-all');
    const btnNotes = document.getElementById('btn-notes'); // <--- AQUI SE DEFINE

    // Modals
    const settingsModal = document.getElementById('settings-modal');
    const notesModal = document.getElementById('notes-modal');
    const detailsModal = document.getElementById('habit-details-modal');
    
    // Close Buttons
    const btnCloseDetails = document.getElementById('btn-close-details');
    const btnCloseSettings = document.getElementById('btn-close-settings'); 
    const btnCloseNotes = document.getElementById('btn-close-notes');

    // Settings Form
    const btnSettings = document.getElementById('btn-settings'); 
    const settingsList = document.getElementById('settings-list');
    const btnSaveHabit = document.getElementById('btn-add-habit'); 
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const inputName = document.getElementById('new-habit-name'); 
    const inputEmoji = document.getElementById('new-habit-emoji'); 
    const inputFile = document.getElementById('habit-file-upload'); 
    const inputTime = document.getElementById('new-habit-time'); 
    const iconPreview = document.getElementById('icon-preview'); 
    
    // Notes Form
    const dayNotesArea = document.getElementById('day-notes'); 
    const btnSaveNotes = document.getElementById('btn-save-notes'); 

    // --- API GOOGLE SHEETS ---
    const cloudAPI = {
        getAllData: async () => {
            try {
                if(streakDisplay) streakDisplay.innerText = "⏳ Sincronizando...";
                const response = await fetch(SHEET_API_URL);
                const data = await response.json();
                console.log("✅ Datos recibidos de Sheet:", data);
                return data;
            } catch (error) {
                console.error("❌ Error cargando de Sheet:", error);
                if(streakDisplay) streakDisplay.innerText = "⚠️ Error Sync";
                return [];
            }
        },
        saveData: async (dayPayload) => {
            const body = { action: 'save', fecha: dayPayload.fecha, payload: dayPayload };
            fetch(SHEET_API_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(body)
            }).then(() => console.log("☁️ Guardado en nube OK"))
              .catch(e => console.error("⚠️ Error guardando:", e));
        },
        saveSettingsLocal: (s) => localStorage.setItem('habit_settings', JSON.stringify(s))
    };

    // --- INICIALIZACIÓN ---
    initDashboard();

    // --- LISTENERS ---
    // Usamos 'if' para evitar errores si algún elemento no carga
    if(btnCalendarTrigger) btnCalendarTrigger.addEventListener('click', () => { try { datePickerInput.showPicker(); } catch (e) { datePickerInput.click(); } });
    if(datePickerInput) datePickerInput.addEventListener('change', (e) => { if(!e.target.value) return; currentViewDate = e.target.value; updateDashboardView(); });
    
    if(btnNotes) {
        btnNotes.addEventListener('click', () => { 
            dayNotesArea.value = currentDayData.nota || ""; 
            if(notesModal) notesModal.classList.remove('hidden'); 
        });
    }

    if(btnToggleAll) btnToggleAll.addEventListener('click', toggleSections);
    if(btnStatsScroll) btnStatsScroll.addEventListener('click', () => document.getElementById('stats-section-anchor')?.scrollIntoView({ behavior: 'smooth' }));

    // --- CORE ---
    async function initDashboard() {
        if (!isDataLoaded) {
            globalHistory = await cloudAPI.getAllData();
            isDataLoaded = true;
        }
        updateDashboardView();
    }

    function updateDashboardView() {
        const dayRecord = globalHistory.find(d => d.fecha === currentViewDate);
        currentDayData = dayRecord || { fecha: currentViewDate, progreso: 0, habitos: {}, nota: "" };

        if(datePickerInput) datePickerInput.value = currentViewDate;
        
        // Time Travel UI Check
        const hoyISO = getLocalISODate();
        if (currentViewDate !== hoyISO) {
            const d = new Date(currentViewDate + 'T00:00:00');
            const bonita = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
            if(dashboardTitle) dashboardTitle.innerText = `Editando: ${bonita}`;
            document.querySelector('.dash-header').classList.add('is-past-mode');
            if(progressLabel) progressLabel.innerText = "Histórico";
        } else {
            if(dashboardTitle) dashboardTitle.innerText = "Dashboard 🚀";
            document.querySelector('.dash-header').classList.remove('is-past-mode');
            if(progressLabel) progressLabel.innerText = "Progreso Diario";
        }

        determineInitialOpenSections();
        renderHabitList();
        updateProgressUI();
        renderKPIs();
        renderHeatmap();
        renderCharts();
    }

    // --- LÓGICA DE UI ---
    function determineInitialOpenSections() {
        openSections.clear();
        const hour = new Date().getHours();
        openSections.add('anytime');
        if (hour >= 5 && hour < 12) openSections.add('morning');
        else if (hour >= 12 && hour < 19) openSections.add('afternoon');
        else openSections.add('night');
    }
    
    function toggleSections() {
        const allKeys = ['morning', 'afternoon', 'night', 'anytime', 'completed'];
        if (openSections.size < allKeys.length) { allKeys.forEach(k => openSections.add(k)); btnToggleAll.innerHTML = '<i class="material-icons-round" style="font-size:16px;">unfold_less</i>'; } 
        else { openSections.clear(); btnToggleAll.innerHTML = '<i class="material-icons-round" style="font-size:16px;">unfold_more</i>'; }
        renderHabitList();
    }

    function renderHabitList() {
        if(!habitListEl) return;
        habitListEl.innerHTML = '';
        if (!currentSettings.habits || currentSettings.habits.length === 0) {
            habitListEl.innerHTML = '<div style="text-align:center; color:#666; padding:20px;">No hay hábitos. Ve a ⚙️</div>';
            return;
        }

        const pending = []; const completed = [];
        currentSettings.habits.forEach(h => {
            if (currentDayData.habitos[h.id]) completed.push(h); else pending.push(h);
        });

        const groups = {
            morning: { id: 'morning', title: '☀️ Mañana', items: [] },
            afternoon: { id: 'afternoon', title: '🌤️ Tarde', items: [] },
            night: { id: 'night', title: '🌙 Noche', items: [] },
            anytime: { id: 'anytime', title: '⚡ En cualquier momento', items: [] }
        };
        pending.forEach(h => groups[getHabitContext(h.time)].items.push(h));
        
        ['morning', 'afternoon', 'night', 'anytime'].forEach(key => {
            if (groups[key].items.length > 0) renderSection(key, groups[key].title, groups[key].items, openSections.has(key), false);
        });
        if (completed.length > 0) renderSection('completed', `✅ Completados (${completed.length})`, completed, openSections.has('completed'), true);
        
        if (pending.length === 0 && completed.length > 0) {
            const c = document.createElement('div'); c.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">¡Todo listo por hoy! 🎉</div>'; habitListEl.insertBefore(c, habitListEl.firstChild);
        }
    }

    function renderSection(sectionId, title, items, isExpanded, isCompleted) {
        const d = document.createElement('div'); d.className = isCompleted ? 'completed-section' : 'time-section';
        const h = document.createElement('div'); h.className = `time-section-header ${isExpanded ? '' : 'collapsed'}`;
        h.innerHTML = `<h4>${title}</h4><i class="material-icons-round section-arrow">expand_more</i>`;
        const c = document.createElement('div'); c.className = `section-content ${isExpanded ? '' : 'collapsed'}`;
        items.forEach(item => c.appendChild(createHabitCard(item, isCompleted)));
        h.addEventListener('click', () => { if(c.classList.contains('collapsed')) { c.classList.remove('collapsed'); h.classList.remove('collapsed'); openSections.add(sectionId); } else { c.classList.add('collapsed'); h.classList.add('collapsed'); openSections.delete(sectionId); } });
        d.appendChild(h); d.appendChild(c); habitListEl.appendChild(d);
    }

    function createHabitCard(habit, isDone) {
        const card = document.createElement('div'); card.className = `habit-card ${isDone ? 'done' : ''}`;
        card.onclick = () => toggleHabit(habit.id, card, isDone);
        let i = habit.icon.startsWith('data:') ? `<img src="${habit.icon}" class="habit-icon-img">` : `<span class="habit-icon-display">${habit.icon}</span>`;
        const t = habit.time ? `<span class="habit-time-tag">${habit.time}</span>` : '';
        const s = `<button class="btn-stats" onclick="event.stopPropagation(); openHabitDetails('${habit.id}', '${habit.name}')"><i class="material-icons-round" style="font-size:16px">bar_chart</i></button>`;
        card.innerHTML = `<div class="check-circle"><i class="material-icons-round">check</i></div><div class="habit-details"><div class="habit-name-row">${i}<span class="habit-name">${habit.name}</span>${t}</div></div>${s}`;
        return card;
    }

    // --- ACCIONES CON SYNC ---
    async function toggleHabit(id, card, wasDone) {
        if (!wasDone) {
            const circle = card.querySelector('.check-circle');
            if(circle) { circle.classList.add('pop-anim'); setTimeout(() => circle.classList.remove('pop-anim'), 400); }
            card.classList.add('animating-out');
        }
        setTimeout(async () => {
            currentDayData.habitos[id] = !wasDone;
            calculateProgress();
            updateGlobalHistoryInMemory(currentDayData);
            renderHabitList(); renderCharts(); renderHeatmap(); renderKPIs();
            await cloudAPI.saveData(currentDayData);
        }, 250);
    }

    function calculateProgress() {
        const total = currentSettings.habits.length; if(total===0) return;
        let completed = 0; currentSettings.habits.forEach(h => { if(currentDayData.habitos[h.id]) completed++; });
        const p = Math.round((completed/total)*100);
        currentDayData.progreso = p;
        updateProgressUI();
        if(p === 100 && currentViewDate === getLocalISODate()) triggerConfetti();
    }

    function updateProgressUI() {
        const p = currentDayData.progreso;
        if(heroPercent) {
            heroPercent.innerText = `${p}%`; 
            if(p===100) { heroPercent.classList.add('gold'); heroPercent.style.color=''; }
            else { heroPercent.classList.remove('gold'); heroPercent.style.color='#e0e0e0'; }
        }
        if(heroFill) {
            heroFill.style.width = `${p}%`;
            if(p===100) { heroFill.classList.add('gold'); heroFill.style.backgroundColor=''; }
            else { heroFill.classList.remove('gold'); heroFill.style.backgroundColor='#00e676'; }
        }
    }

    // --- UTILS ---
    function getHabitContext(t) { if(!t) return 'anytime'; const h = parseInt(t.split(':')[0]); if(h>=5 && h<12) return 'morning'; if(h>=12 && h<19) return 'afternoon'; if(h>=19 || h<5) return 'night'; return 'anytime'; }
    function getLocalISODate() { return new Date().toLocaleDateString('en-CA'); }
    function updateGlobalHistoryInMemory(d) { const idx = globalHistory.findIndex(x => x.fecha === d.fecha); if(idx!==-1) globalHistory[idx]=d; else globalHistory.push(d); }
    function triggerConfetti() { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); }

    // --- SETTINGS (Local) ---
    if(btnSettings) btnSettings.addEventListener('click', () => { renderSettingsList(); settingsModal.classList.remove('hidden'); });
    if(btnCloseSettings) btnCloseSettings.addEventListener('click', () => { settingsModal.classList.add('hidden'); initDashboard(); });
    
    async function saveNewOrder() {
        const ids = [...settingsList.querySelectorAll('.settings-item')].map(i => i.dataset.id);
        const newArr = []; ids.forEach(id => { const h = currentSettings.habits.find(x => x.id === id); if(h) newArr.push(h); });
        currentSettings.habits = newArr; cloudAPI.saveSettingsLocal(currentSettings);
    }

    window.deleteHabit = (idx) => { if(confirm('¿Borrar?')) { currentSettings.habits.splice(idx, 1); cloudAPI.saveSettingsLocal(currentSettings); renderSettingsList(); } };
    window.editHabit = (id) => { const h = currentSettings.habits.find(x => x.id === id); if(h) { editingId = id; inputName.value = h.name; inputTime.value = h.time || ''; if(h.icon.startsWith('data:')) { currentBase64Icon = h.icon; iconPreview.innerHTML = `<img src="${h.icon}" style="height:100%">`; iconPreview.classList.remove('hidden'); } else { inputEmoji.value = h.icon; } btnSaveHabit.innerText = "Actualizar"; btnCancelEdit.classList.remove('hidden'); } };
    
    if(btnSaveHabit) btnSaveHabit.addEventListener('click', () => { 
        const n=inputName.value.trim(); const i=currentBase64Icon||inputEmoji.value.trim()||'🔹'; const t=inputTime.value; if(!n) return; 
        if(editingId){ const idx=currentSettings.habits.findIndex(h=>h.id===editingId); if(idx!==-1) currentSettings.habits[idx]={...currentSettings.habits[idx], name:n, icon:i, time:t}; } 
        else { currentSettings.habits.push({id:'h-'+Date.now(), name:n, icon:i, time:t}); } 
        cloudAPI.saveSettingsLocal(currentSettings); 
        btnCancelEdit.click(); renderSettingsList(); 
    });
    if(btnCancelEdit) btnCancelEdit.addEventListener('click', () => { editingId=null; inputName.value=''; inputEmoji.value=''; inputTime.value=''; currentBase64Icon=null; iconPreview.classList.add('hidden'); iconPreview.innerHTML=''; btnSaveHabit.innerText="Guardar"; btnCancelEdit.classList.add('hidden'); });
    
    function renderSettingsList() {
        if(!settingsList) return;
        settingsList.innerHTML = '';
        currentSettings.habits.forEach((h, idx) => {
            const d = document.createElement('div'); d.className='settings-item'; d.draggable=true; d.dataset.id=h.id;
            let i = h.icon.startsWith('data:') ? '📷' : h.icon;
            d.innerHTML = `<span>${i} ${h.name}</span><div><button class="btn-edit" onclick="editHabit('${h.id}')">✏️</button><button class="btn-delete" onclick="deleteHabit(${idx})">🗑️</button></div>`;
            d.addEventListener('dragstart', ()=>d.classList.add('dragging')); d.addEventListener('dragend', ()=>{d.classList.remove('dragging'); saveNewOrder();});
            settingsList.appendChild(d);
        });
    }
    if(settingsList) settingsList.addEventListener('dragover', e => { e.preventDefault(); const after=getDragAfterElement(settingsList, e.clientY); const drag=document.querySelector('.dragging'); if(drag){ if(after==null) settingsList.appendChild(drag); else settingsList.insertBefore(drag, after); } });
    function getDragAfterElement(container, y) { return [...container.querySelectorAll('.settings-item:not(.dragging)')].reduce((closest, child) => { const box=child.getBoundingClientRect(); const offset=y-box.top-box.height/2; if(offset<0 && offset>closest.offset) return {offset:offset, element:child}; else return closest; }, {offset:Number.NEGATIVE_INFINITY}).element; }
    if(inputFile) inputFile.addEventListener('change', e => { const f=e.target.files[0]; if(f){ const r=new FileReader(); r.onload=ev=>{ currentBase64Icon=ev.target.result; iconPreview.innerHTML=`<img src="${currentBase64Icon}" style="height:100%">`; iconPreview.classList.remove('hidden'); inputEmoji.value=''; }; r.readAsDataURL(f); } });
    if(inputEmoji) inputEmoji.addEventListener('input', () => { if(inputEmoji.value){ currentBase64Icon=null; inputFile.value=''; iconPreview.classList.add('hidden'); iconPreview.innerHTML=''; } });

    // --- NOTES MODAL ---
    if(btnSaveNotes) btnSaveNotes.addEventListener('click', async () => { currentDayData.nota = dayNotesArea.value; await cloudAPI.saveData(currentDayData); notesModal.classList.add('hidden'); });
    if(btnCloseNotes) btnCloseNotes.addEventListener('click', () => notesModal.classList.add('hidden'));

    // --- DETAILS ---
    window.openHabitDetails = (id, name) => {
        document.getElementById('modal-habit-title').innerText = name;
        const done = globalHistory.filter(d => d.habitos && d.habitos[id]).map(d => d.fecha).sort((a,b)=>new Date(a)-new Date(b));
        let streak=0, max=0, temp=0;
        if(done.length>0) {
            const start=new Date(done[0]); const end=new Date();
            for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)) {
                if(done.includes(d.toLocaleDateString('en-CA'))) temp++; else { if(temp>max) max=temp; temp=0; }
            }
            if(temp>max) max=temp;
            const hoy=getLocalISODate(); const ayer=new Date(); ayer.setDate(ayer.getDate()-1);
            if(done.includes(hoy) || done.includes(ayer.toLocaleDateString('en-CA'))) streak=temp;
        }
        document.getElementById('detail-current-streak').innerText = streak;
        document.getElementById('detail-best-streak').innerText = max;
        
        const hm = document.getElementById('detail-heatmap'); hm.innerHTML=''; const hDate=new Date();
        for(let i=29; i>=0; i--) {
            const d=new Date(); d.setDate(hDate.getDate()-i); const iso=d.toLocaleDateString('en-CA');
            const c=document.createElement('div'); c.className='heatmap-day'; if(done.includes(iso)) c.classList.add('done'); hm.appendChild(c);
        }
        detailsModal.classList.remove('hidden');
    }
    if(btnCloseDetails) btnCloseDetails.addEventListener('click', () => detailsModal.classList.add('hidden'));

    // --- CHARTS & KPIS ---
    function renderKPIs() {
        if(!globalHistory || globalHistory.length === 0) { 
            if(streakDisplay) streakDisplay.innerText = "🔥 0 días"; 
            if(totalDaysDisplay) totalDaysDisplay.innerText = "0 reg."; 
            return; 
        }
        const total = globalHistory.length; let streak = 0;
        const sorted = [...globalHistory].sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
        let checkDate = new Date(); let searching = true;
        if(!sorted.find(d => d.fecha === getLocalISODate())) checkDate.setDate(checkDate.getDate() - 1);
        while(searching) {
            const iso = checkDate.toLocaleDateString('en-CA');
            const reg = sorted.find(d => d.fecha === iso);
            if(reg && reg.progreso >= 90) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
            else searching = false;
            if(streak > 3650) searching = false;
        }
        if(streakDisplay) streakDisplay.innerText = `🔥 ${streak} días racha`;
        if(totalDaysDisplay) totalDaysDisplay.innerText = `${total} reg.`;
    }

    function renderCharts() {
        // Line Chart
        const labels=[], data=[]; const hoy=new Date();
        for(let i=6; i>=0; i--) { const d=new Date(); d.setDate(hoy.getDate()-i); const iso=d.toLocaleDateString('en-CA'); const r=globalHistory.find(x=>x.fecha===iso); labels.push(d.toLocaleDateString('es-MX',{weekday:'short'})); data.push(r?r.progreso:0); }
        const ctxL=document.getElementById('chart-weekly'); 
        if(ctxL) {
            if(weeklyChart) weeklyChart.destroy();
            weeklyChart=new Chart(ctxL, {type:'line', data:{labels, datasets:[{data, borderColor:'#00e676', backgroundColor:'rgba(0,230,118,0.1)', fill:true, tension:0.4, pointRadius:4}]}, options:{responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, max:100, grid:{color:'#333', borderDash:[5,5]}, border:{display:false}}, x:{grid:{display:false}, border:{display:false}}}, layout:{padding:{top:10, bottom:10, left:0, right:0}}}});
        }

        // Donut Chart
        const counts={}; globalHistory.forEach(d=>{ if(d.habitos) Object.keys(d.habitos).forEach(hid=>{ if(d.habitos[hid]){ const h=currentSettings.habits.find(x=>x.id===hid); if(h) counts[h.name]=(counts[h.name]||0)+1; } }); });
        const sorted=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
        let l=[], d=[];
        if(sorted.length>5){ const top=sorted.slice(0,5); const other=sorted.slice(5).reduce((a,c)=>a+c[1],0); top.forEach(i=>{l.push(i[0]); d.push(i[1]);}); l.push('Otros'); d.push(other); }
        else sorted.forEach(i=>{l.push(i[0]); d.push(i[1]);});

        const ctxD=document.getElementById('chart-habits'); 
        if(ctxD) {
            if(habitsChart) habitsChart.destroy();
            habitsChart=new Chart(ctxD, {type:'doughnut', data:{labels:l, datasets:[{data:d, backgroundColor:['#00e676','#2979ff','#ffea00','#ff1744','#d500f9','#666'], borderWidth:0, hoverOffset:15}]}, options:{responsive:true, maintainAspectRatio:false, cutout:'65%', layout:{padding:20}, plugins:{legend:{position:'bottom', labels:{color:'#aaa', padding:20, boxWidth:12, font:{size:12}}}}}});
        }
    }

    function renderHeatmap() {
        const c=document.getElementById('global-heatmap'); if(!c) return; c.innerHTML=''; const hoy=new Date();
        for(let i=89; i>=0; i--){ const d=new Date(); d.setDate(hoy.getDate()-i); const iso=d.toLocaleDateString('en-CA'); const r=globalHistory.find(x=>x.fecha===iso); const p=r?r.progreso:0; const el=document.createElement('div'); el.className='heatmap-day'; el.title=`${iso}: ${p}%`; if(p==100) el.classList.add('l4'); else if(p>60) el.classList.add('l3'); else if(p>30) el.classList.add('l2'); else if(p>0) el.classList.add('l1'); c.appendChild(el); }
    }
});
