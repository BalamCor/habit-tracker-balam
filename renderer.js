document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 V7.0 Master: Web & Cloud Logic Active");

    // ==========================================
    // 1. SISTEMA DE LOGIN (Bring Your Own Backend)
    // ==========================================
    const storedConfig = localStorage.getItem('habit_user_config');
    let userConfig = storedConfig ? JSON.parse(storedConfig) : null;
    let SHEET_API_URL = userConfig ? userConfig.apiUrl : null;

    // Referencias UI
    const setupModal = document.getElementById('setup-modal');
    const viewChoice = document.getElementById('view-choice');
    const viewWizard = document.getElementById('view-wizard');
    const viewLogin = document.getElementById('view-login');

    // Botones
    const btnChoiceNew = document.getElementById('btn-choice-new');
    const btnChoiceLogin = document.getElementById('btn-choice-login');
    const btnLoginBack = document.getElementById('btn-login-back');
    const btnLoginConnect = document.getElementById('btn-login-connect');
    const inputLoginUrl = document.getElementById('login-api-url');
    const inputLoginName = document.getElementById('login-username');
    const loginError = document.getElementById('login-error');

    const btnWizardClose = document.getElementById('btn-wizard-close');
    const btnWizardNext = document.getElementById('btn-wizard-next');
    const btnWizardBack = document.getElementById('btn-wizard-back');
    const btnWizardFinish = document.getElementById('btn-wizard-finish');
    const wizardTitle = document.getElementById('wizard-title');
    const inputWizardUrl = document.getElementById('wizard-input-url');
    const inputWizardName = document.getElementById('wizard-input-name');
    const wizardError = document.getElementById('wizard-error');
    
    let currentStep = 1; const totalSteps = 5;

    // Control de Flujo Inicial
    if (!SHEET_API_URL) {
        if(setupModal) setupModal.style.display = 'flex';
        showView('choice'); 
    } else {
        if(setupModal) setupModal.style.display = 'none';
        initApp();
    }

    // Funciones Navegación
    function showView(name) {
        [viewChoice, viewWizard, viewLogin].forEach(el => el.classList.add('hidden'));
        if(name==='choice') viewChoice.classList.remove('hidden');
        if(name==='wizard') viewWizard.classList.remove('hidden');
        if(name==='login') viewLogin.classList.remove('hidden');
    }

    if(btnChoiceNew) btnChoiceNew.onclick=()=>{ showView('wizard'); currentStep=1; updateWizardStep(); };
    if(btnChoiceLogin) btnChoiceLogin.onclick=()=>{ showView('login'); };
    if(btnLoginBack) btnLoginBack.onclick=()=>{ showView('choice'); };
    if(btnLoginConnect) btnLoginConnect.onclick=()=>{ attemptLogin(inputLoginUrl.value, inputLoginName.value, loginError); };
    if(btnWizardClose) btnWizardClose.onclick=()=>{ showView('choice'); };
    if(btnWizardNext) btnWizardNext.onclick=()=>{ if(currentStep<totalSteps){ currentStep++; updateWizardStep(); } };
    if(btnWizardBack) btnWizardBack.onclick=()=>{ if(currentStep>1){ currentStep--; updateWizardStep(); } };
    if(btnWizardFinish) btnWizardFinish.onclick=()=>{ attemptLogin(inputWizardUrl.value, inputWizardName.value, wizardError); };

    function updateWizardStep() {
        if(wizardTitle) wizardTitle.innerText=`Paso ${currentStep} de ${totalSteps}`;
        document.querySelectorAll('.wizard-step').forEach(el=>el.classList.add('hidden'));
        document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.remove('hidden');
        if(currentStep===1) btnWizardBack.classList.add('hidden'); else btnWizardBack.classList.remove('hidden');
        if(currentStep===totalSteps){ btnWizardNext.classList.add('hidden'); btnWizardFinish.classList.remove('hidden'); }
        else{ btnWizardNext.classList.remove('hidden'); btnWizardFinish.classList.add('hidden'); }
    }

    function attemptLogin(url, name, errEl) {
        const u = url.trim(), n = name.trim() || "Usuario";
        if(u.includes('script.google.com') && u.endsWith('/exec')){
            localStorage.setItem('habit_user_config', JSON.stringify({apiUrl:u, userName:n}));
            location.reload();
        } else {
            errEl.classList.remove('hidden'); errEl.innerText="⚠️ URL inválida. Debe terminar en /exec";
        }
    }

    window.toggleFullScreen = function(btn) {
        const c = btn.closest('.img-container');
        c.classList.toggle('is-fullscreen');
        btn.querySelector('i').innerText = c.classList.contains('is-fullscreen') ? 'close' : 'fullscreen';
        btn.querySelector('i').style.fontSize = c.classList.contains('is-fullscreen') ? '24px' : '20px';
    }

    // ==========================================
    // 2. APLICACIÓN PRINCIPAL
    // ==========================================
    function initApp() {
        console.log(`✅ Conectado como: ${userConfig.userName}`);
        let currentSettings = { habits: [] }; 
        let globalHistory = [];
        let currentViewDate = getLocalISODate();
        let currentDayData = { fecha: currentViewDate, progreso: 0, habitos: {}, nota: "" };
        let isDataLoaded = false;
        let openSections = new Set();
        let weeklyChart = null; let habitsChart = null;
        let editingId = null; let currentBase64Icon = null;

        // Refs
        const datePickerInput = document.getElementById('global-date-picker');
        const btnCalendarTrigger = document.getElementById('btn-calendar-trigger');
        const dashboardTitle = document.getElementById('dashboard-title');
        const progressLabel = document.getElementById('progress-label-text');
        const heroPercent = document.getElementById('hero-percent');
        const heroFill = document.getElementById('hero-progress-fill');
        const streakDisplay = document.getElementById('streak-display');
        const totalDaysDisplay = document.getElementById('total-days-display');
        const btnStatsScroll = document.getElementById('btn-stats-scroll');
        const habitListEl = document.getElementById('interactive-habit-list');
        const btnToggleAll = document.getElementById('btn-toggle-all');
        const btnNotes = document.getElementById('btn-notes');
        const settingsModal = document.getElementById('settings-modal');
        const notesModal = document.getElementById('notes-modal');
        const detailsModal = document.getElementById('habit-details-modal');
        const btnCloseDetails = document.getElementById('btn-close-details');
        const btnCloseSettings = document.getElementById('btn-close-settings'); 
        const btnCloseNotes = document.getElementById('btn-close-notes');
        const btnSettings = document.getElementById('btn-settings'); 
        const settingsList = document.getElementById('settings-list');
        const btnSaveHabit = document.getElementById('btn-add-habit'); 
        const btnCancelEdit = document.getElementById('btn-cancel-edit');
        const inputName = document.getElementById('new-habit-name'); 
        const inputEmoji = document.getElementById('new-habit-emoji'); 
        const inputFile = document.getElementById('habit-file-upload'); 
        const inputTime = document.getElementById('new-habit-time'); 
        const iconPreview = document.getElementById('icon-preview'); 
        const userDisplayName = document.getElementById('user-display-name');
        const btnLogout = document.getElementById('btn-logout');
        const dayNotesArea = document.getElementById('day-notes'); 
        const btnSaveNotes = document.getElementById('btn-save-notes'); 

        if(userDisplayName) userDisplayName.innerText = `Conectado como: ${userConfig.userName}`;
        if(btnLogout) btnLogout.onclick = () => { if(confirm('¿Cerrar sesión?')) { localStorage.removeItem('habit_user_config'); location.reload(); } };

        const cloudAPI = {
            fetchAll: async () => {
                try {
                    if(streakDisplay) streakDisplay.innerText = "⏳...";
                    const res = await fetch(SHEET_API_URL);
                    const data = await res.json();
                    return data;
                } catch (e) {
                    console.error("API Error", e);
                    if(streakDisplay) streakDisplay.innerText = "⚠️ Offline";
                    return null;
                }
            },
            saveData: async (pl) => sendToCloud({ action: 'save_day', fecha: pl.fecha, payload: pl }),
            saveSettings: async (pl) => sendToCloud({ action: 'save_settings', payload: pl })
        };

        function sendToCloud(body) {
            fetch(SHEET_API_URL, { method: 'POST', mode: 'no-cors', headers: {'Content-Type': 'text/plain'}, body: JSON.stringify(body) }).catch(console.error);
        }

        initDashboard();

        if(btnCalendarTrigger) btnCalendarTrigger.onclick = () => { try { datePickerInput.showPicker(); } catch (e) { datePickerInput.click(); } };
        if(datePickerInput) datePickerInput.onchange = (e) => { if(!e.target.value) return; currentViewDate = e.target.value; updateDashboardView(); };
        if(btnNotes) btnNotes.onclick = () => { dayNotesArea.value = currentDayData.nota || ""; if(notesModal) notesModal.classList.remove('hidden'); };
        if(btnToggleAll) btnToggleAll.onclick = toggleSections;
        if(btnStatsScroll) btnStatsScroll.onclick = () => document.getElementById('stats-section-anchor')?.scrollIntoView({ behavior: 'smooth' });

        async function initDashboard() {
            if (!isDataLoaded) {
                const data = await cloudAPI.fetchAll();
                if (data) {
                    globalHistory = data.history || [];
                    if (data.settings && data.settings.habits) currentSettings = data.settings;
                    else {
                        currentSettings = { habits: [{ id: "h1", name: "Beber Agua", icon: "💧", time: "08:00" }] };
                        cloudAPI.saveSettings(currentSettings);
                    }
                }
                isDataLoaded = true;
            }
            updateDashboardView();
        }

        function updateDashboardView() {
            const rec = globalHistory.find(d => d.fecha.substring(0, 10) === currentViewDate);
            currentDayData = rec ? { ...rec, fecha: currentViewDate } : { fecha: currentViewDate, progreso: 0, habitos: {}, nota: "" };
            
            if(datePickerInput) datePickerInput.value = currentViewDate;
            if(dashboardTitle) {
                const isToday = currentViewDate === getLocalISODate();
                dashboardTitle.innerText = isToday ? `Hola, ${userConfig.userName} 👋` : `Editando: ${new Date(currentViewDate+'T00:00').toLocaleDateString('es-MX',{weekday:'short',day:'numeric'})}`;
                document.querySelector('.dash-header').classList.toggle('is-past-mode', !isToday);
                if(progressLabel) progressLabel.innerText = isToday ? "Progreso Diario" : "Histórico";
            }
            determineInitialOpenSections(); renderHabitList(); updateProgressUI(); renderKPIs(); renderHeatmap(); renderCharts();
        }

        function determineInitialOpenSections() { openSections.clear(); const h=new Date().getHours(); openSections.add('anytime'); if(h>=5&&h<12)openSections.add('morning'); else if(h>=12&&h<19)openSections.add('afternoon'); else openSections.add('night'); }
        function toggleSections() { const all=['morning','afternoon','night','anytime','completed']; if(openSections.size<all.length){all.forEach(k=>openSections.add(k));btnToggleAll.innerHTML='<i class="material-icons-round" style="font-size:16px;">unfold_less</i>';}else{openSections.clear();btnToggleAll.innerHTML='<i class="material-icons-round" style="font-size:16px;">unfold_more</i>';} renderHabitList(); }
        
        function renderHabitList() {
            if(!habitListEl) return; habitListEl.innerHTML='';
            if(!currentSettings.habits.length) { habitListEl.innerHTML='<div style="text-align:center;color:#666;padding:20px;">Sin hábitos. Ve a ⚙️</div>'; return; }
            const pending=[], completed=[];
            currentSettings.habits.forEach(h=>{ if(currentDayData.habitos[h.id]) completed.push(h); else pending.push(h); });
            const g={morning:[], afternoon:[], night:[], anytime:[]};
            pending.forEach(h=>g[getHabitContext(h.time)].push(h));
            ['morning','afternoon','night','anytime'].forEach(k=>{ if(g[k].length) renderSection(k, getSectionTitle(k), g[k], openSections.has(k), false); });
            if(completed.length) renderSection('completed', `✅ Completados (${completed.length})`, completed, openSections.has('completed'), true);
            if(!pending.length && completed.length) { const c=document.createElement('div'); c.innerHTML='<div style="text-align:center;padding:20px;color:#666;">¡Todo listo! 🎉</div>'; habitListEl.insertBefore(c,habitListEl.firstChild); }
        }

        function getSectionTitle(k) { const t={morning:'☀️ Mañana', afternoon:'🌤️ Tarde', night:'🌙 Noche', anytime:'⚡ Cualquier momento'}; return t[k]; }
        function renderSection(id, title, items, expanded, isDone) {
            const d=document.createElement('div'); d.className=isDone?'completed-section':'time-section';
            const h=document.createElement('div'); h.className=`time-section-header ${expanded?'':'collapsed'}`;
            h.innerHTML=`<h4>${title}</h4><i class="material-icons-round section-arrow">expand_more</i>`;
            const c=document.createElement('div'); c.className=`section-content ${expanded?'':'collapsed'}`;
            items.forEach(i=>c.appendChild(createHabitCard(i, isDone)));
            h.onclick=()=>{ if(c.classList.contains('collapsed')){c.classList.remove('collapsed');h.classList.remove('collapsed');openSections.add(id);}else{c.classList.add('collapsed');h.classList.add('collapsed');openSections.delete(id);} };
            d.appendChild(h); d.appendChild(c); habitListEl.appendChild(d);
        }

        function createHabitCard(h, done) {
            const c=document.createElement('div'); c.className=`habit-card ${done?'done':''}`;
            c.onclick=()=>toggleHabit(h.id, c, done);
            let i=h.icon.startsWith('data:')?`<img src="${h.icon}" class="habit-icon-img">`:`<span class="habit-icon-display">${h.icon}</span>`;
            const t=h.time?`<span class="habit-time-tag">${h.time}</span>`:'';
            c.innerHTML=`<div class="check-circle"><i class="material-icons-round">check</i></div><div class="habit-details"><div class="habit-name-row">${i}<span class="habit-name">${h.name}</span>${t}</div></div><button class="btn-stats" onclick="event.stopPropagation();openHabitDetails('${h.id}','${h.name}')"><i class="material-icons-round" style="font-size:16px">bar_chart</i></button>`;
            return c;
        }

        async function toggleHabit(id, el, wasDone) {
            if(!wasDone) { const c=el.querySelector('.check-circle'); if(c){c.classList.add('pop-anim');setTimeout(()=>c.classList.remove('pop-anim'),400);} el.classList.add('animating-out'); }
            setTimeout(async()=>{
                currentDayData.habitos[id]=!wasDone; calculateProgress();
                const idx=globalHistory.findIndex(d=>d.fecha===currentDayData.fecha); if(idx!==-1)globalHistory[idx]=currentDayData; else globalHistory.push(currentDayData);
                renderHabitList(); renderCharts(); renderHeatmap(); renderKPIs();
                await cloudAPI.saveData(currentDayData);
            }, 250);
        }

        function calculateProgress() {
            const total=currentSettings.habits.length; if(!total)return;
            let done=0; currentSettings.habits.forEach(h=>{if(currentDayData.habitos[h.id])done++});
            currentDayData.progreso=Math.round((done/total)*100);
            updateProgressUI();
            if(currentDayData.progreso===100 && currentViewDate===getLocalISODate()) triggerConfetti();
        }

        function updateProgressUI() {
            const p=currentDayData.progreso;
            if(heroPercent) { heroPercent.innerText=`${p}%`; if(p===100){heroPercent.classList.add('gold');heroPercent.style.color='';}else{heroPercent.classList.remove('gold');heroPercent.style.color='#e0e0e0';} }
            if(heroFill) { heroFill.style.width=`${p}%`; if(p===100){heroFill.classList.add('gold');heroFill.style.backgroundColor='';}else{heroFill.classList.remove('gold');heroFill.style.backgroundColor='#00e676';} }
        }

        if(btnSettings) btnSettings.onclick=()=>{ renderSettingsList(); settingsModal.classList.remove('hidden'); };
        if(btnCloseSettings) btnCloseSettings.onclick=()=>{ settingsModal.classList.add('hidden'); initDashboard(); };
        async function saveNewOrder() {
            const ids=[...settingsList.querySelectorAll('.settings-item')].map(i=>i.dataset.id);
            const n=[]; ids.forEach(id=>{ const h=currentSettings.habits.find(x=>x.id===id); if(h)n.push(h); });
            currentSettings.habits=n; await cloudAPI.saveSettings(currentSettings);
        }
        window.deleteHabit=async(idx)=>{ if(confirm('¿Borrar?')){ currentSettings.habits.splice(idx,1); await cloudAPI.saveSettings(currentSettings); renderSettingsList(); } };
        window.editHabit=(id)=>{ const h=currentSettings.habits.find(x=>x.id===id); if(h){ editingId=id; inputName.value=h.name; inputTime.value=h.time||''; if(h.icon.startsWith('data:')){currentBase64Icon=h.icon;iconPreview.innerHTML=`<img src="${h.icon}" style="height:100%">`;iconPreview.classList.remove('hidden');}else{inputEmoji.value=h.icon;} btnSaveHabit.innerText="Actualizar"; btnCancelEdit.classList.remove('hidden'); } };
        if(btnSaveHabit) btnSaveHabit.onclick=()=>{ 
            const n=inputName.value.trim(), i=currentBase64Icon||inputEmoji.value.trim()||'🔹', t=inputTime.value; if(!n)return;
            if(editingId){ const x=currentSettings.habits.findIndex(h=>h.id===editingId); if(x!==-1)currentSettings.habits[x]={...currentSettings.habits[x],name:n,icon:i,time:t}; }
            else { currentSettings.habits.push({id:'h-'+Date.now(), name:n, icon:i, time:t}); }
            cloudAPI.saveSettings(currentSettings); btnCancelEdit.click(); renderSettingsList(); 
        };
        if(btnCancelEdit) btnCancelEdit.onclick=()=>{ editingId=null; inputName.value=''; inputEmoji.value=''; inputTime.value=''; currentBase64Icon=null; iconPreview.classList.add('hidden'); iconPreview.innerHTML=''; btnSaveHabit.innerText="Guardar"; btnCancelEdit.classList.add('hidden'); };

        function renderSettingsList() {
            settingsList.innerHTML=''; currentSettings.habits.forEach((h,idx)=>{
                const d=document.createElement('div'); d.className='settings-item'; d.draggable=true; d.dataset.id=h.id;
                let i=h.icon.startsWith('data:')?'📷':h.icon;
                d.innerHTML=`<span>${i} ${h.name}</span><div><button class="btn-edit" onclick="editHabit('${h.id}')">✏️</button><button class="btn-delete" onclick="deleteHabit(${idx})">🗑️</button></div>`;
                d.ondragstart=()=>d.classList.add('dragging'); d.ondragend=()=>{d.classList.remove('dragging');saveNewOrder();};
                settingsList.appendChild(d);
            });
        }
        settingsList.ondragover=e=>{ e.preventDefault(); const a=getDragAfterElement(settingsList,e.clientY), d=document.querySelector('.dragging'); if(d){ if(a==null)settingsList.appendChild(d); else settingsList.insertBefore(d,a); } };
        function getDragAfterElement(c,y){ return [...c.querySelectorAll('.settings-item:not(.dragging)')].reduce((r,h)=>{ const b=h.getBoundingClientRect(), o=y-b.top-b.height/2; if(o<0&&o>r.offset)return{offset:o,element:h}; return r; },{offset:Number.NEGATIVE_INFINITY}).element; }
        if(inputFile) inputFile.onchange=e=>{ const f=e.target.files[0]; if(f){ const r=new FileReader(); r.onload=ev=>{currentBase64Icon=ev.target.result;iconPreview.innerHTML=`<img src="${currentBase64Icon}" style="height:100%">`;iconPreview.classList.remove('hidden');inputEmoji.value='';}; r.readAsDataURL(f); } };
        if(inputEmoji) inputEmoji.oninput=()=>{ if(inputEmoji.value){currentBase64Icon=null;inputFile.value='';iconPreview.classList.add('hidden');iconPreview.innerHTML='';} };

        if(btnSaveNotes) btnSaveNotes.onclick=async()=>{ currentDayData.nota=dayNotesArea.value; await cloudAPI.saveData(currentDayData); notesModal.classList.add('hidden'); };
        if(btnCloseNotes) btnCloseNotes.onclick=()=>notesModal.classList.add('hidden');
        if(btnCloseDetails) btnCloseDetails.onclick=()=>detailsModal.classList.add('hidden');

        // 👇👇👇 LÓGICA DE FECHAS AGREGADA AQUÍ 👇👇👇
        window.openHabitDetails = (id, name) => {
            document.getElementById('modal-habit-title').innerText = name;
            
            const done = globalHistory
                .filter(d => d.habitos && d.habitos[id])
                .map(d => d.fecha.substring(0, 10))
                .sort((a, b) => new Date(a) - new Date(b));

            let currentStreak = 0;
            let maxStreak = 0;
            let bestRange = "--";

            if (done.length > 0) {
                let tempStreak = 0;
                let tempStart = done[0];
                let maxEnd = done[0];
                let maxStart = done[0];

                for (let i = 0; i < done.length; i++) {
                    const current = new Date(done[i]);
                    const prev = i > 0 ? new Date(done[i-1]) : null;

                    if (prev) {
                        const diffTime = Math.abs(current - prev);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        if (diffDays === 1) {
                            tempStreak++;
                        } else {
                            if (tempStreak + 1 > maxStreak) {
                                maxStreak = tempStreak + 1;
                                maxEnd = done[i-1];
                                maxStart = tempStart;
                            }
                            tempStreak = 0;
                            tempStart = done[i];
                        }
                    }
                }
                if (tempStreak + 1 > maxStreak) {
                    maxStreak = tempStreak + 1;
                    maxEnd = done[done.length - 1];
                    maxStart = tempStart;
                }

                const todayISO = getLocalISODate();
                const yest = new Date(); yest.setDate(yest.getDate() - 1);
                const yestISO = yest.toLocaleDateString('en-CA');
                
                if (done.includes(todayISO) || done.includes(yestISO)) {
                    let count = 0;
                    let checkDate = new Date();
                    if(!done.includes(todayISO)) checkDate.setDate(checkDate.getDate() - 1);
                    while(true) {
                        if(done.includes(checkDate.toLocaleDateString('en-CA'))) { count++; checkDate.setDate(checkDate.getDate() - 1); } 
                        else { break; }
                    }
                    currentStreak = count;
                }

                const f = (iso) => new Date(iso+'T00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
                bestRange = `${f(maxStart)} - ${f(maxEnd)}`;
            }

            document.getElementById('detail-current-streak').innerText = currentStreak;
            document.getElementById('detail-best-streak').innerText = maxStreak;
            // Inyectar fechas
            const dateSpan = document.getElementById('detail-best-dates');
            if(dateSpan) dateSpan.innerText = maxStreak > 0 ? bestRange : "--";

            const hm = document.getElementById('detail-heatmap'); hm.innerHTML=''; const hDate=new Date();
            for(let i=29; i>=0; i--){ 
                const d=new Date(); d.setDate(hDate.getDate()-i); const iso=d.toLocaleDateString('en-CA'); 
                const c=document.createElement('div'); c.className='heatmap-day'; 
                if(done.includes(iso)) c.classList.add('done'); 
                hm.appendChild(c); 
            }
            detailsModal.classList.remove('hidden');
        };

        function renderKPIs(){ if(!globalHistory.length){if(streakDisplay)streakDisplay.innerText="🔥 0";if(totalDaysDisplay)totalDaysDisplay.innerText="0 reg.";return;} const t=globalHistory.length; let s=0; const so=[...globalHistory].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)); let c=new Date(); if(!so.find(d=>d.fecha.substring(0,10)===getLocalISODate()))c.setDate(c.getDate()-1); let se=true; while(se){ const iso=c.toLocaleDateString('en-CA'), r=so.find(d=>d.fecha.substring(0,10)===iso); if(r&&r.progreso>=90){s++;c.setDate(c.getDate()-1);}else se=false; if(s>3650)se=false; } if(streakDisplay)streakDisplay.innerText=`🔥 ${s} días`; if(totalDaysDisplay)totalDaysDisplay.innerText=`${t} reg.`; }
        function renderCharts(){ const l=[],da=[]; const h=new Date(); for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(h.getDate()-i); const iso=d.toLocaleDateString('en-CA'); const r=globalHistory.find(x=>x.fecha.substring(0,10)===iso); l.push(d.toLocaleDateString('es-MX',{weekday:'short'})); da.push(r?r.progreso:0); } const cL=document.getElementById('chart-weekly'); if(cL){ if(weeklyChart)weeklyChart.destroy(); weeklyChart=new Chart(cL,{type:'line',data:{labels:l,datasets:[{data:da,borderColor:'#00e676',backgroundColor:'rgba(0,230,118,0.1)',fill:true,tension:0.4,pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:100,grid:{color:'#333',borderDash:[5,5]},border:{display:false}},x:{grid:{display:false},border:{display:false}}},layout:{padding:{top:10,bottom:10,left:0,right:0}}}}); } const co={}; globalHistory.forEach(d=>{if(d.habitos)Object.keys(d.habitos).forEach(k=>{if(d.habitos[k]){const ha=currentSettings.habits.find(x=>x.id===k);if(ha)co[ha.name]=(co[ha.name]||0)+1;}});}); const so=Object.entries(co).sort((a,b)=>b[1]-a[1]); let la=[],dat=[]; if(so.length>5){so.slice(0,5).forEach(i=>{la.push(i[0]);dat.push(i[1]);});la.push('Otros');dat.push(so.slice(5).reduce((a,c)=>a+c[1],0));}else so.forEach(i=>{la.push(i[0]);dat.push(i[1]);}); const cD=document.getElementById('chart-habits'); if(cD){ if(habitsChart)habitsChart.destroy(); habitsChart=new Chart(cD,{type:'doughnut',data:{labels:la,datasets:[{data:dat,backgroundColor:['#00e676','#2979ff','#ffea00','#ff1744','#d500f9','#666'],borderWidth:0,hoverOffset:15}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',layout:{padding:20},plugins:{legend:{position:'bottom',labels:{color:'#aaa',padding:20,boxWidth:12,font:{size:12}}}}}}); } }
        function renderHeatmap(){ const c=document.getElementById('global-heatmap'); if(!c)return; c.innerHTML=''; const h=new Date(); for(let i=89;i>=0;i--){ const d=new Date(); d.setDate(h.getDate()-i); const iso=d.toLocaleDateString('en-CA'); const r=globalHistory.find(x=>x.fecha.substring(0,10)===iso); const p=r?r.progreso:0; const el=document.createElement('div'); el.className='heatmap-day'; el.title=`${iso}: ${p}%`; if(p==100)el.classList.add('l4');else if(p>60)el.classList.add('l3');else if(p>30)el.classList.add('l2');else if(p>0)el.classList.add('l1'); c.appendChild(el); } }
        function getHabitContext(t){if(!t)return 'anytime';const h=parseInt(t.split(':')[0]);if(h>=5&&h<12)return 'morning';if(h>=12&&h<19)return 'afternoon';if(h>=19||h<5)return 'night';return 'anytime';}
        function getLocalISODate(){return new Date().toLocaleDateString('en-CA');}
        function triggerConfetti(){confetti({particleCount:100,spread:70,origin:{y:0.6}});}
    }
});
