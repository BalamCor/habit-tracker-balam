document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 V9.4 Web Master: Cloud + Offline + Optimistic UI");

    const OFFLINE_KEY = "OFFLINE_MODE";

    // --- FUNCIÓN GLOBAL DE FECHA (CRUCIAL) ---
    // Fuerza el formato YYYY-MM-DD local para consistencia en historial
    function getLocalISODate() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // ==========================================
    // 1. CONFIGURACIÓN Y NAVEGACIÓN
    // ==========================================
    const storedConfig = localStorage.getItem('habit_user_config');
    let userConfig = storedConfig ? JSON.parse(storedConfig) : null;
    let SHEET_API_URL = userConfig ? userConfig.apiUrl : null;
    let isOfflineMode = SHEET_API_URL === OFFLINE_KEY;

    // --- REFERENCIAS UI ---
    const setupModal = document.getElementById('setup-modal');
    const viewChoice = document.getElementById('view-choice');
    const viewWizard = document.getElementById('view-wizard');
    const viewLogin = document.getElementById('view-login');
    const viewMobileBlock = document.getElementById('view-mobile-block');

    const btnChoiceNew = document.getElementById('btn-choice-new');
    const btnChoiceLogin = document.getElementById('btn-choice-login');
    const btnChoiceOffline = document.getElementById('btn-choice-offline'); 
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

    const btnMobileBypass = document.getElementById('btn-mobile-bypass');
    const btnMobileOffline = document.getElementById('btn-mobile-offline');
    const btnShareWa = document.getElementById('btn-share-wa');
    const btnShareMail = document.getElementById('btn-share-mail');
    const btnShareCopy = document.getElementById('btn-share-copy');
    
    // Configuración
    const btnRecoverKeyEmail = document.getElementById('btn-recover-key-email');
    const btnRecoverKeyWa = document.getElementById('btn-recover-key-wa'); 
    const btnRecoverKeyCopy = document.getElementById('btn-recover-key-copy'); 
    const connectCloudBanner = document.getElementById('connect-cloud-banner'); 
    const keyBackupSection = document.getElementById('key-backup-section'); 
    const btnConnectCloudNow = document.getElementById('btn-connect-cloud-now');
    const statusIndicator = document.getElementById('status-indicator');

    // Dashboard UI
    const btnSettings = document.getElementById('btn-settings'); 
    const settingsList = document.getElementById('settings-list');
    const btnSaveHabit = document.getElementById('btn-add-habit'); 
    const btnCancelEdit = document.getElementById('btn-cancel-edit');
    const inputName = document.getElementById('new-habit-name'); 
    const inputEmoji = document.getElementById('new-habit-emoji'); 
    const inputFile = document.getElementById('habit-file-upload'); 
    const inputTime = document.getElementById('new-habit-time'); 
    const iconPreview = document.getElementById('icon-preview'); 
    const settingsModal = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-close-settings');
    const btnCloseNotes = document.getElementById('btn-close-notes');
    const btnCloseDetails = document.getElementById('btn-close-details');
    const notesModal = document.getElementById('notes-modal');
    const detailsModal = document.getElementById('habit-details-modal');
    const btnNotes = document.getElementById('btn-notes');
    const btnToggleAll = document.getElementById('btn-toggle-all');
    const btnStatsScroll = document.getElementById('btn-stats-scroll');
    const userDisplayName = document.getElementById('user-display-name');
    const btnLogout = document.getElementById('btn-logout');
    const dayNotesArea = document.getElementById('day-notes');
    const btnSaveNotes = document.getElementById('btn-save-notes');
    const habitListEl = document.getElementById('interactive-habit-list');
    const dashboardTitle = document.getElementById('dashboard-title');
    const progressLabel = document.getElementById('progress-label-text');
    const heroPercent = document.getElementById('hero-percent');
    const heroFill = document.getElementById('hero-progress-fill');
    const streakDisplay = document.getElementById('streak-display');
    const totalDaysDisplay = document.getElementById('total-days-display');
    const btnCalendarTrigger = document.getElementById('btn-calendar-trigger');
    const datePickerInput = document.getElementById('global-date-picker');

    let currentStep = 1; const totalSteps = 5;

    // --- SETUP INICIAL ---
    function isRealMobile() { return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); }

    // LÓGICA DE ARRANQUE CON SALTO INTELIGENTE Y DETECCIÓN DE DISPOSITIVO
    if (!SHEET_API_URL) {
        if(setupModal) setupModal.style.display = 'flex';
        
        // ¿Viene redirigido desde el botón "Conectar Nube"? (Flag en memoria)
        if (localStorage.getItem('habit_jump_to_wizard') === 'true') {
            localStorage.removeItem('habit_jump_to_wizard');
            
            if (isRealMobile()) {
                // 📱 MÓVIL: Asumimos que ya creó la hoja en PC, pedimos directo el Link
                alert("ℹ️ Recordatorio:\n\nLa creación de la base de datos se debe hacer en una computadora.\n\nSi ya tienes tu URL del Script, pégala aquí para sincronizar.");
                showView('login');
            } else {
                // 💻 DESKTOP: Mostramos el tutorial paso a paso
                showView('wizard');
                currentStep = 1;
                updateWizardStep();
            }
        } else {
            // Flujo normal de primera vez
            if(isRealMobile()) { showView('mobile_block'); setupMobileSharing(); } else { showView('choice'); }
        }
    } else {
        if(setupModal) setupModal.style.display = 'none';
        initApp();
    }

    function showView(name) {
        [viewChoice, viewWizard, viewLogin, viewMobileBlock].forEach(el => { if(el) el.classList.add('hidden') });
        if(name==='choice') viewChoice.classList.remove('hidden');
        if(name==='wizard') viewWizard.classList.remove('hidden');
        if(name==='login') viewLogin.classList.remove('hidden');
        if(name==='mobile_block') viewMobileBlock.classList.remove('hidden');
    }

    if(btnLoginBack) btnLoginBack.onclick = () => { if (isRealMobile()) { showView('mobile_block'); } else { showView('choice'); } };
    if(btnChoiceNew) btnChoiceNew.onclick=()=>{ showView('wizard'); currentStep=1; updateWizardStep(); };
    if(btnChoiceLogin) btnChoiceLogin.onclick=()=>{ showView('login'); };
    if(btnWizardClose) btnWizardClose.onclick=()=>{ showView('choice'); };
    if(btnMobileBypass) btnMobileBypass.onclick=()=>{ showView('login'); };

    // MODO OFFLINE (LocalStorage)
    function activateOfflineMode() {
        localStorage.setItem('habit_user_config', JSON.stringify({apiUrl: OFFLINE_KEY, userName: "Usuario Local"}));
        if(!localStorage.getItem('habit_data_local')) {
            localStorage.setItem('habit_data_local', JSON.stringify({ 
                history: [], 
                settings: { habits: [{ id: "h1", name: "Beber Agua", icon: "💧", time: "08:00", created: getLocalISODate() }] } 
            }));
        }
        location.reload();
    }

    if(btnChoiceOffline) btnChoiceOffline.onclick = activateOfflineMode;
    if(btnMobileOffline) btnMobileOffline.onclick = activateOfflineMode;

    // BOTÓN CONECTAR NUBE (Desde Settings)
    if(btnConnectCloudNow) btnConnectCloudNow.onclick = () => {
        if(confirm("Te llevaremos a crear tu hoja en la nube. Tus datos locales se conservarán. ¿Listo?")) {
            localStorage.setItem('habit_jump_to_wizard', 'true');
            localStorage.removeItem('habit_user_config'); 
            location.reload();
        }
    };

    if(btnWizardNext) btnWizardNext.onclick=()=>{ if(currentStep<totalSteps){ currentStep++; updateWizardStep(); } };
    if(btnWizardBack) btnWizardBack.onclick=()=>{ if(currentStep>1){ currentStep--; updateWizardStep(); } };
    
    function updateWizardStep() {
        if(wizardTitle) wizardTitle.innerText=`Paso ${currentStep} de ${totalSteps}`;
        document.querySelectorAll('.wizard-step').forEach(el=>el.classList.add('hidden'));
        document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.remove('hidden');
        if(currentStep===1) btnWizardBack.classList.add('hidden'); else btnWizardBack.classList.remove('hidden');
        if(currentStep===totalSteps){ btnWizardNext.classList.add('hidden'); btnWizardFinish.classList.remove('hidden'); }
        else{ btnWizardNext.classList.remove('hidden'); btnWizardFinish.classList.add('hidden'); }
    }

    if(btnLoginConnect) btnLoginConnect.onclick=()=>{ attemptLogin(inputLoginUrl.value, inputLoginName.value, loginError, btnLoginConnect); };
    if(btnWizardFinish) btnWizardFinish.onclick=()=>{ attemptLogin(inputWizardUrl.value, inputWizardName.value, wizardError, btnWizardFinish); };

    function formatDateShort(isoString) {
        if (!isoString) return "??";
        const parts = isoString.split('-'); return `${parts[2]}/${parts[1]}`;
    }

    // LOGIN & MIGRACIÓN
    async function attemptLogin(url, name, errEl, btnEl) {
        errEl.classList.add('hidden');
        const cleanUrl = url ? url.trim() : "";
        const cleanName = name ? name.trim() : "Usuario";
        
        if (cleanUrl.includes('docs.google.com/spreadsheets')) { errEl.innerText = "⛔ Error: Link incorrecto (usa el del Script)."; errEl.classList.remove('hidden'); return; }
        if (!cleanUrl.includes('script.google.com') || !cleanUrl.endsWith('/exec')) { errEl.innerText = "⚠️ Formato inválido."; errEl.classList.remove('hidden'); return; }

        const originalText = btnEl.innerText;
        btnEl.innerText = "Verificando... 🔄"; btnEl.disabled = true;

        try {
            await fetch(cleanUrl, { method: 'GET', mode: 'no-cors' });
            
            // Lógica de Migración (Local -> Nube)
            const localDataRaw = localStorage.getItem('habit_data_local');
            if(localDataRaw) {
                const localData = JSON.parse(localDataRaw);
                const hasHistory = localData.history && localData.history.length > 0;
                if (hasHistory) {
                    const sortedHistory = localData.history.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
                    const startD = formatDateShort(sortedHistory[0].fecha);
                    const endD = formatDateShort(sortedHistory[sortedHistory.length - 1].fecha);
                    const userWantsMerge = confirm(`📂 Datos locales encontrados (${startD} - ${endD}).\n¿Subirlos a tu nueva nube?`);
                    if (userWantsMerge) {
                        if(localData.settings) await fetch(cleanUrl, { method: 'POST', mode: 'no-cors', headers: {'Content-Type': 'text/plain'}, body: JSON.stringify({ action: 'save_settings', payload: localData.settings }) });
                        for (const day of localData.history) { await fetch(cleanUrl, { method: 'POST', mode: 'no-cors', headers: {'Content-Type': 'text/plain'}, body: JSON.stringify({ action: 'save_day', fecha: day.fecha, payload: day }) }); await new Promise(r => setTimeout(r, 600)); }
                    }
                }
                localStorage.removeItem('habit_data_local');
            }
            localStorage.setItem('habit_user_config', JSON.stringify({apiUrl: cleanUrl, userName: cleanName}));
            btnEl.innerText = "¡Conectado! ✅";
            setTimeout(() => location.reload(), 800);
        } catch (e) {
            console.error(e);
            errEl.innerText = "❌ Error: Script no responde (revisa permisos 'Anyone')."; errEl.classList.remove('hidden');
            btnEl.innerText = originalText; btnEl.disabled = false;
        }
    }

    const validateInput = (e) => {
        const val = e.target.value.trim();
        const parent = e.target; 
        parent.classList.remove('input-error', 'input-success');
        if (val === "") return;
        if (val.includes('script.google.com') && val.endsWith('/exec')) { parent.classList.add('input-success'); } 
        else { parent.classList.add('input-error'); }
    };
    if(inputLoginUrl) inputLoginUrl.addEventListener('input', validateInput);
    if(inputWizardUrl) inputWizardUrl.addEventListener('input', validateInput);

    function setupMobileSharing() {
        const text = "Configura tu Habit Tracker aquí: " + window.location.href; 
        if(btnShareWa) btnShareWa.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
        if(btnShareMail) btnShareMail.href = `mailto:?subject=Setup Habit Tracker&body=${encodeURIComponent(text)}`;
        if(btnShareCopy) {
            btnShareCopy.onclick = (e) => {
                e.preventDefault();
                navigator.clipboard.writeText(window.location.href).then(() => {
                    const original = btnShareCopy.innerHTML;
                    btnShareCopy.innerHTML = '<i class="material-icons-round">check</i>';
                    setTimeout(() => btnShareCopy.innerHTML = original, 2000);
                });
            };
        }
    }

    window.toggleFullScreen = function(btn) {
        const c = btn.closest('.img-container');
        c.classList.toggle('is-fullscreen');
        btn.querySelector('i').innerText = c.classList.contains('is-fullscreen') ? 'close' : 'fullscreen';
    }

    // ==========================================
    // 3. APLICACIÓN PRINCIPAL (CORE)
    // ==========================================
    function initApp() {
        console.log(`✅ [INIT] Usuario: ${userConfig.userName} | Modo: ${isOfflineMode ? 'OFFLINE' : 'CLOUD'}`);
        
        // Indicador de Estado
        if(statusIndicator) {
            statusIndicator.classList.remove('hidden');
            if(isOfflineMode) {
                statusIndicator.classList.add('local');
                statusIndicator.innerHTML = '<i class="material-icons-round">cloud_off</i> Local';
                if(connectCloudBanner) connectCloudBanner.classList.remove('hidden');
                if(keyBackupSection) keyBackupSection.classList.add('hidden');
            } else {
                statusIndicator.classList.remove('local');
                statusIndicator.innerHTML = '<i class="material-icons-round">cloud_done</i> Nube';
                if(connectCloudBanner) connectCloudBanner.classList.add('hidden');
                if(keyBackupSection) keyBackupSection.classList.remove('hidden');
                
                const keyUrl = userConfig.apiUrl;
                const msgBody = `Mi llave de Habit Tracker:\n${keyUrl}\n\n(Guardar en lugar seguro)`;
                if(btnRecoverKeyEmail) btnRecoverKeyEmail.href = `mailto:?subject=Llave Habit Tracker&body=${encodeURIComponent(msgBody)}`;
                if(btnRecoverKeyWa) btnRecoverKeyWa.href = `https://wa.me/?text=${encodeURIComponent(msgBody)}`;
                if(btnRecoverKeyCopy) {
                    btnRecoverKeyCopy.onclick = (e) => {
                        e.preventDefault();
                        navigator.clipboard.writeText(keyUrl).then(() => {
                            const original = btnRecoverKeyCopy.innerHTML;
                            btnRecoverKeyCopy.innerHTML = '<i class="material-icons-round">check</i>';
                            setTimeout(() => btnRecoverKeyCopy.innerHTML = original, 2000);
                        });
                    };
                }
            }
        }

        // --- GESTOR DE DATOS HÍBRIDO ---
        const cloudAPI = {
            fetchAll: async () => {
                if(isOfflineMode) {
                    const localRaw = localStorage.getItem('habit_data_local');
                    return localRaw ? JSON.parse(localRaw) : { history: [], settings: { habits: [] } };
                } else {
                    try {
                        if(streakDisplay) streakDisplay.innerText = "⏳...";
                        const res = await fetch(SHEET_API_URL);
                        return await res.json();
                    } catch (e) {
                        console.error("API Error", e);
                        if(streakDisplay) streakDisplay.innerText = "⚠️ Offline"; return null;
                    }
                }
            },
            saveData: async (pl) => {
                // Actualizar memoria global para sincronía instantánea
                const idx = globalHistory.findIndex(d => d.fecha === pl.fecha); 
                if(idx !== -1) globalHistory[idx] = pl; else globalHistory.push(pl);

                isOfflineMode ? saveLocal('history', pl) : sendToCloud({ action: 'save_day', fecha: pl.fecha, payload: pl });
            },
            saveSettings: async (pl) => {
                isOfflineMode ? saveLocal('settings', pl) : sendToCloud({ action: 'save_settings', payload: pl });
            }
        };

        function saveLocal(type, payload) {
            let data = JSON.parse(localStorage.getItem('habit_data_local') || '{"history":[], "settings":{"habits":[]}}');
            if (type === 'settings') data.settings = payload;
            else if (type === 'history') {
                const idx = data.history.findIndex(d => d.fecha === payload.fecha);
                if (idx !== -1) data.history[idx] = payload; else data.history.push(payload);
            }
            localStorage.setItem('habit_data_local', JSON.stringify(data));
        }

        function sendToCloud(body) {
            fetch(SHEET_API_URL, { method: 'POST', mode: 'no-cors', headers: {'Content-Type': 'text/plain'}, body: JSON.stringify(body) }).catch(console.error);
        }

        // --- DASHBOARD VARS ---
        let currentSettings = { habits: [] }; let globalHistory = [];
        let currentViewDate = getLocalISODate();
        let currentDayData = { fecha: currentViewDate, progreso: 0, habitos: {}, nota: "" };
        let isDataLoaded = false; let openSections = new Set();
        let weeklyChart = null; let habitsChart = null; let editingId = null; let currentBase64Icon = null;

        initDashboard();

        if(userDisplayName) userDisplayName.innerText = `Conectado como: ${userConfig.userName}`;
        if(btnLogout) btnLogout.onclick = () => { if(confirm('¿Cerrar sesión en este dispositivo?')) { localStorage.removeItem('habit_user_config'); location.reload(); } };
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
                        currentSettings = { habits: [{ id: "h1", name: "Beber Agua", icon: "💧", time: "08:00", created: getLocalISODate() }] }; 
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
        
        function getDailyHabits() {
            // Filtro por fecha de creación (Integridad Histórica)
            return currentSettings.habits.filter(h => !h.created || h.created <= currentViewDate);
        }

        function renderHabitList() {
            if(!habitListEl) return; habitListEl.innerHTML='';
            const activeHabits = getDailyHabits();
            if(!activeHabits.length) { habitListEl.innerHTML='<div style="text-align:center;color:#666;padding:20px;">Sin hábitos activos para esta fecha.</div>'; return; }

            const pending=[], completed=[];
            activeHabits.forEach(h=>{ if(currentDayData.habitos[h.id]) completed.push(h); else pending.push(h); });
            
            const g={morning:[], afternoon:[], night:[], anytime:[]};
            pending.forEach(h=>g[getHabitContext(h.time)].push(h));
            
            if(g['morning'].length) renderSection('morning', "Mañana", g['morning'], openSections.has('morning'), false);
            if(g['afternoon'].length) renderSection('afternoon', "Tarde", g['afternoon'], openSections.has('afternoon'), false);
            if(g['night'].length) renderSection('night', "Noche", g['night'], openSections.has('night'), false);
            if(g['anytime'].length) renderSection('anytime', "Cualquier momento", g['anytime'], openSections.has('anytime'), false);

            if(completed.length) renderSection('completed', `✅ Completados (${completed.length})`, completed, openSections.has('completed'), true);
            if(!pending.length && completed.length) { const c=document.createElement('div'); c.innerHTML='<div style="text-align:center;padding:20px;color:#666;">¡Todo listo! 🎉</div>'; habitListEl.insertBefore(c,habitListEl.firstChild); }
        }

        function getSectionTitle(k) { const t={morning:'☀️ Mañana', afternoon:'🌤️ Tarde', night:'🌙 Noche', anytime:'⚡ Cualquier momento'}; return t[k]; }
        function renderSection(id, title, items, expanded, isDone) {
            const d=document.createElement('div'); d.className=isDone?'completed-section':'time-section';
            const h=document.createElement('div'); h.className=`time-section-header ${expanded?'':'collapsed'}`;
            const displayTitle = getSectionTitle(id) || title;
            h.innerHTML=`<h4>${displayTitle}</h4><i class="material-icons-round section-arrow">expand_more</i>`;
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
            // Animación Visual Inmediata
            if(!wasDone) { const c=el.querySelector('.check-circle'); if(c){c.classList.add('pop-anim');setTimeout(()=>c.classList.remove('pop-anim'),400);} el.classList.add('animating-out'); }
            
            setTimeout(async()=>{
                // Actualizar estado
                currentDayData.habitos[id] = !wasDone; 
                
                // Actualizar UI
                calculateProgress(); 
                renderHabitList(); 
                renderCharts(); renderHeatmap(); renderKPIs(); 
                
                // Guardar
                await cloudAPI.saveData(currentDayData);
            }, 250);
        }
        
        function calculateProgress() {
            const activeHabits = getDailyHabits();
            const total = activeHabits.length;
            if(total === 0) { currentDayData.progreso = 0; updateProgressUI(); return; }

            let done = 0;
            activeHabits.forEach(h => { if (currentDayData.habitos[h.id]) done++; });
            
            currentDayData.progreso = Math.round((done/total)*100);
            updateProgressUI();
            if(currentDayData.progreso===100 && currentViewDate===getLocalISODate()) triggerConfetti();
        }

        function updateProgressUI() {
            const p = currentDayData.progreso;
            if(heroPercent) { 
                heroPercent.innerText=`${p}%`; 
                if(p===100){heroPercent.classList.add('gold');heroPercent.style.color='';}else{heroPercent.classList.remove('gold');heroPercent.style.color='#e0e0e0';} 
            }
            if(heroFill) { 
                heroFill.style.width=`${p}%`; 
                if(p===100){heroFill.classList.add('gold');heroFill.style.backgroundColor='';}else{heroFill.classList.remove('gold');heroFill.style.backgroundColor='#00e676';} 
            }
        }
        if(btnSettings) btnSettings.onclick=()=>{ renderSettingsList(); settingsModal.classList.remove('hidden'); };
        if(btnCloseSettings) btnCloseSettings.onclick=()=>{ settingsModal.classList.add('hidden'); initDashboard(); };
        async function saveNewOrder() {
            const ids=[...settingsList.querySelectorAll('.settings-item')].map(i=>i.dataset.id);
            const n=[]; ids.forEach(id=>{ const h=currentSettings.habits.find(x=>x.id===id); if(h)n.push(h); });
            currentSettings.habits=n; await cloudAPI.saveSettings(currentSettings);
        }
        
        // BORRADO ATÓMICO (Optimistic UI)
        window.deleteHabit=async(idx)=>{ 
            const deletedHabit = currentSettings.habits[idx];
            if(confirm(`¿Borrar "${deletedHabit.name}" permanentemente?`)){ 
                currentSettings.habits.splice(idx,1); 
                if(currentDayData.habitos[deletedHabit.id]) delete currentDayData.habitos[deletedHabit.id];
                
                // Actualizar YA
                calculateProgress(); renderHabitList(); renderSettingsList();
                
                // Guardar en Background
                await cloudAPI.saveSettings(currentSettings); 
                await cloudAPI.saveData(currentDayData);
            } 
        };

        window.editHabit=(id)=>{ const h=currentSettings.habits.find(x=>x.id===id); if(h){ editingId=id; inputName.value=h.name; inputTime.value=h.time||''; if(h.icon.startsWith('data:')){currentBase64Icon=h.icon;iconPreview.innerHTML=`<img src="${h.icon}" style="height:100%">`;iconPreview.classList.remove('hidden');}else{inputEmoji.value=h.icon;} btnSaveHabit.innerText="Actualizar"; btnCancelEdit.classList.remove('hidden'); } };
        
        if(btnSaveHabit) btnSaveHabit.onclick=async()=>{ 
            const n=inputName.value.trim(), i=currentBase64Icon||inputEmoji.value.trim()||'🔹', t=inputTime.value; 
            if(!n)return;
            
            if(editingId){ 
                const x=currentSettings.habits.findIndex(h=>h.id===editingId); 
                if(x!==-1) currentSettings.habits[x]={...currentSettings.habits[x], name:n, icon:i, time:t}; 
            } else { 
                // Fecha de creación segura
                currentSettings.habits.push({id:'h-'+Date.now(), name:n, icon:i, time:t, created: currentViewDate}); 
            }
            
            calculateProgress(); renderSettingsList(); renderHabitList();
            btnCancelEdit.click(); 
            
            await cloudAPI.saveSettings(currentSettings); 
            await cloudAPI.saveData(currentDayData);
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
        
        window.openHabitDetails = (id, name) => {
            document.getElementById('modal-habit-title').innerText = name;
            const done = globalHistory.filter(d => d.habitos && d.habitos[id]).map(d => d.fecha.substring(0, 10)).sort((a, b) => new Date(a) - new Date(b));
            let currentStreak = 0; let maxStreak = 0; let bestRange = "--";
            if (done.length > 0) {
                let tempStreak = 0; let tempStart = done[0]; let maxEnd = done[0]; let maxStart = done[0];
                for (let i = 0; i < done.length; i++) {
                    const current = new Date(done[i]);
                    const prev = i > 0 ? new Date(done[i-1]) : null;
                    if (prev) {
                        const diffTime = Math.abs(current - prev);
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays === 1) { tempStreak++; } 
                        else {
                            if (tempStreak + 1 > maxStreak) { maxStreak = tempStreak + 1; maxEnd = done[i-1]; maxStart = tempStart; }
                            tempStreak = 0; tempStart = done[i];
                        }
                    }
                }
                if (tempStreak + 1 > maxStreak) { maxStreak = tempStreak + 1; maxEnd = done[done.length - 1]; maxStart = tempStart; }
                const todayISO = getLocalISODate(); const yest = new Date(); yest.setDate(yest.getDate() - 1); const yestISO = getLocalISODate().replace(/(\d{4})-(\d{2})-(\d{2})/, (m, y, mo, da) => { const d = new Date(y, mo - 1, da); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; });
                if (done.includes(todayISO) || done.includes(yestISO)) {
                    let count = 0; let checkDate = new Date(); if(!done.includes(todayISO)) checkDate.setDate(checkDate.getDate() - 1);
                    while(true) { const iso = checkDate.getFullYear() + '-' + String(checkDate.getMonth()+1).padStart(2,'0') + '-' + String(checkDate.getDate()).padStart(2,'0'); if(done.includes(iso)) { count++; checkDate.setDate(checkDate.getDate() - 1); } else { break; } }
                    currentStreak = count;
                }
                const f = (iso) => new Date(iso+'T00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }); bestRange = `${f(maxStart)} - ${f(maxEnd)}`;
            }
            document.getElementById('detail-current-streak').innerText = currentStreak;
            document.getElementById('detail-best-streak').innerText = maxStreak;
            const dateSpan = document.getElementById('detail-best-dates');
            if(dateSpan) dateSpan.innerText = maxStreak > 0 ? bestRange : "--";
            const hm = document.getElementById('detail-heatmap'); hm.innerHTML=''; const hDate=new Date();
            for(let i=29; i>=0; i--){ const d=new Date(); d.setDate(hDate.getDate()-i); const iso=d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); const c=document.createElement('div'); c.className='heatmap-day'; if(done.includes(iso)) c.classList.add('done'); hm.appendChild(c); }
            detailsModal.classList.remove('hidden');
        };
        
        function getHabitContext(t){if(!t)return 'anytime';const h=parseInt(t.split(':')[0]);if(h>=5&&h<12)return 'morning';if(h>=12&&h<19)return 'afternoon';if(h>=19||h<5)return 'night';return 'anytime';}
        function triggerConfetti(){confetti({particleCount:100,spread:70,origin:{y:0.6}});}
        
        function renderCharts(){ const l=[],da=[]; const h=new Date(); for(let i=6;i>=0;i--){ const d=new Date(); d.setDate(h.getDate()-i); const iso=d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); const r=globalHistory.find(x=>x.fecha.substring(0,10)===iso); l.push(d.toLocaleDateString('es-MX',{weekday:'short'})); da.push(r?r.progreso:0); } const cL=document.getElementById('chart-weekly'); if(cL){ if(weeklyChart)weeklyChart.destroy(); weeklyChart=new Chart(cL,{type:'line',data:{labels:l,datasets:[{data:da,borderColor:'#00e676',backgroundColor:'rgba(0,230,118,0.1)',fill:true,tension:0.4,pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,max:100,grid:{color:'#333',borderDash:[5,5]},border:{display:false}},x:{grid:{display:false},border:{display:false}}},layout:{padding:{top:10,bottom:10,left:0,right:0}}}}); } const co={}; globalHistory.forEach(d=>{if(d.habitos)Object.keys(d.habitos).forEach(k=>{if(d.habitos[k]){const ha=currentSettings.habits.find(x=>x.id===k);if(ha)co[ha.name]=(co[ha.name]||0)+1;}});}); const so=Object.entries(co).sort((a,b)=>b[1]-a[1]); let la=[],dat=[]; if(so.length>5){so.slice(0,5).forEach(i=>{la.push(i[0]);dat.push(i[1]);});la.push('Otros');dat.push(so.slice(5).reduce((a,c)=>a+c[1],0));}else so.forEach(i=>{la.push(i[0]);dat.push(i[1]);}); const cD=document.getElementById('chart-habits'); if(cD){ if(habitsChart)habitsChart.destroy(); habitsChart=new Chart(cD,{type:'doughnut',data:{labels:la,datasets:[{data:dat,backgroundColor:['#00e676','#2979ff','#ffea00','#ff1744','#d500f9','#666'],borderWidth:0,hoverOffset:15}]},options:{responsive:true,maintainAspectRatio:false,cutout:'65%',layout:{padding:20},plugins:{legend:{position:'bottom',labels:{color:'#aaa',padding:20,boxWidth:12,font:{size:12}}}}}}); } }
        function renderHeatmap(){ const c=document.getElementById('global-heatmap'); if(!c)return; c.innerHTML=''; const h=new Date(); for(let i=89;i>=0;i--){ const d=new Date(); d.setDate(h.getDate()-i); const iso=d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); const r=globalHistory.find(x=>x.fecha.substring(0,10)===iso); const p=r?r.progreso:0; const el=document.createElement('div'); el.className='heatmap-day'; el.title=`${iso}: ${p}%`; if(p==100)el.classList.add('l4');else if(p>60)el.classList.add('l3');else if(p>30)el.classList.add('l2');else if(p>0)el.classList.add('l1'); c.appendChild(el); } }

        function renderKPIs(){ 
            if(!globalHistory.length){
                if(streakDisplay)streakDisplay.innerText="🔥 0";
                if(totalDaysDisplay)totalDaysDisplay.innerText="0 reg.";
                return;
            } 
            const t=globalHistory.length; 
            let s=0; 
            const so=[...globalHistory].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)); 
            let c=new Date(); 
            if(!so.find(d=>d.fecha.substring(0,10)===getLocalISODate()))c.setDate(c.getDate()-1); 
            let se=true; 
            while(se){ 
                const iso=c.getFullYear() + '-' + String(c.getMonth()+1).padStart(2,'0') + '-' + String(c.getDate()).padStart(2,'0'); 
                const r=so.find(d=>d.fecha.substring(0,10)===iso); 
                if(r&&r.progreso>=90){s++;c.setDate(c.getDate()-1);}else se=false; 
                if(s>3650)se=false; 
            } 
            if(streakDisplay)streakDisplay.innerText=`🔥 ${s} días`; 
            if(totalDaysDisplay)totalDaysDisplay.innerText=`${t} reg.`; 
        }
    }
});
