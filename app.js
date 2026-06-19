// ============================================
// APLICACIÓN PRINCIPAL - CamiX
// ============================================

// --- Obtener API de Supabase ---
const API = window.SupabaseAPI;

// ============================================
// ESTADO GLOBAL
// ============================================
const state = {
    user: null,
    userData: null,
    group: null,
    sessionId: null,
    isFacilitator: false,
    votesRevealed: false,
    channels: []
};

// ============================================
// DOM REFS (Cache de elementos)
// ============================================
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ============================================
// UTILIDADES
// ============================================
function showScreen(name) {
    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));
    const target = document.getElementById(name + '-screen');
    if (target) target.classList.add('active');
}

function escapeHtml(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function getInitials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function updateAvatar(containerId, avatarUrl, name) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (avatarUrl) {
        container.innerHTML = `<img src="${avatarUrl}" alt="Avatar">`;
        container.className = 'avatar avatar-lg';
    } else {
        container.textContent = getInitials(name || 'Usuario');
        container.className = 'avatar avatar-lg';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
    }
}

// ============================================
// AUTENTICACIÓN
// ============================================
async function handleLogin(email, password) {
    try {
        const errEl = $('auth-error');
        errEl.textContent = '';
        
        const { user } = await API.signIn(email, password);
        state.user = user;
        state.userData = await API.getUsuario(user.id);
        await showDashboard();
    } catch (error) {
        $('auth-error').textContent = error.message;
    }
}

async function handleRegister(email, password, nombre, apellido, username, edad, sexo) {
    try {
        const errEl = $('reg-error');
        errEl.textContent = '';

        if (!email || !password || !nombre || !apellido || !username || !edad || !sexo) {
            errEl.textContent = 'Todos los campos son obligatorios';
            return;
        }
        if (password.length < 6) {
            errEl.textContent = 'La contraseña debe tener al menos 6 caracteres';
            return;
        }
        if (edad < 1 || edad > 120) {
            errEl.textContent = 'Edad no válida';
            return;
        }

        // Verificar username único
        const existing = await API.getUsuarioByEmail(email);
        if (existing) {
            errEl.textContent = 'Este correo ya está registrado';
            return;
        }

        const { user } = await API.signUp(email, password, {
            nombre,
            apellido,
            username,
            edad,
            sexo
        });

        errEl.textContent = '✅ Registro exitoso. Revisa tu correo para confirmar.';
        errEl.className = 'text-emerald-400 text-xs mt-2 text-center';

        // Limpiar formulario
        $('reg-email').value = '';
        $('reg-password').value = '';
        $('reg-nombre').value = '';
        $('reg-apellido').value = '';
        $('reg-username').value = '';
        $('reg-edad').value = '';
        $$('.gender-option').forEach(el => el.classList.remove('selected'));

        setTimeout(() => {
            toggleForms(false);
            errEl.textContent = '';
        }, 3000);

    } catch (error) {
        const errEl = $('reg-error');
        errEl.textContent = error.message;
        errEl.className = 'text-red-400 text-xs mt-2 text-center';
    }
}

async function handleLogout() {
    cleanupChannels();
    await API.signOut();
    state.user = null;
    state.userData = null;
    state.group = null;
    showScreen('auth');
}

function toggleForms(showRegister) {
    $('login-form').classList.toggle('hidden', showRegister);
    $('register-form').classList.toggle('hidden', !showRegister);
    $('auth-error').textContent = '';
    $('reg-error').textContent = '';
}

// ============================================
// DASHBOARD
// ============================================
async function showDashboard() {
    if (!state.user) return;
    showScreen('dashboard');

    $('dashboard-user-email').textContent = state.user.email;
    const displayName = state.userData?.username || state.userData?.nombre || 'Usuario';
    $('dashboard-user-name').textContent = '@' + displayName;
    updateAvatar('dashboard-avatar', state.userData?.avatar_url, displayName);

    await loadGroups();
}

async function loadGroups() {
    try {
        const grupos = await API.getGrupos();
        const container = $('groups-list');

        if (!grupos || grupos.length === 0) {
            container.innerHTML = `<div class="text-center py-8"><p class="text-slate-500">No hay grupos aún</p></div>`;
            return;
        }

        // Obtener info de creadores
        const userIds = [...new Set(grupos.map(g => g.creado_por).filter(Boolean))];
        const userMap = {};
        if (userIds.length > 0) {
            const { data: users } = await API.supabase
                .from('usuarios')
                .select('id, nombre, username')
                .in('id', userIds);
            if (users) users.forEach(u => { userMap[u.id] = u; });
        }

        let html = '';
        for (const grupo of grupos) {
            const isMember = await API.isMiembro(grupo.id, state.user.id);
            const isCreator = grupo.creado_por === state.user.id;
            const creatorInfo = userMap[grupo.creado_por];
            
            let creatorDisplay = 'Usuario desconocido';
            if (isCreator) creatorDisplay = '👤 Tú';
            else if (creatorInfo) creatorDisplay = creatorInfo.username || creatorInfo.nombre;

            const count = await API.countMiembros(grupo.id);

            html += `
                <div class="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-emerald-600/50">
                    <div class="flex-1 min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                            <p class="text-sm font-semibold text-slate-200 truncate">${escapeHtml(grupo.nombre)}</p>
                            ${isCreator ? '<span class="badge badge-amber">👑 Creador</span>' : ''}
                            ${isMember && !isCreator ? '<span class="badge badge-green">✓ Miembro</span>' : ''}
                        </div>
                        <p class="text-xs text-slate-500">Creado por: ${escapeHtml(creatorDisplay)} • ${count || 0} miembros</p>
                    </div>
                    <div class="flex gap-2">
                        ${isMember || isCreator ? `
                            <button class="btn-enter bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white px-4 py-1.5 rounded-lg text-xs font-semibold border border-emerald-600/30"
                                    data-id="${grupo.id}" data-name="${escapeHtml(grupo.nombre)}">Entrar</button>
                        ` : `
                            <button class="btn-join bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white px-4 py-1.5 rounded-lg text-xs font-semibold border border-amber-600/30"
                                    data-id="${grupo.id}">Unirse</button>
                        `}
                        ${isCreator ? `
                            <button class="btn-delete text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1.5 rounded-lg"
                                    data-id="${grupo.id}">
                                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        // Event listeners
        container.querySelectorAll('.btn-enter').forEach(btn => {
            btn.addEventListener('click', () => enterRoom(btn.dataset.id, btn.dataset.name));
        });
        container.querySelectorAll('.btn-join').forEach(btn => {
            btn.addEventListener('click', () => joinGroup(btn.dataset.id));
        });
        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteGroup(btn.dataset.id));
        });

    } catch (error) {
        $('groups-list').innerHTML = `<p class="text-red-400 text-xs">Error: ${error.message}</p>`;
    }
}

async function createGroup() {
    const name = $('new-group-name').value.trim();
    if (!name) { alert('Ingresa un nombre'); return; }
    try {
        const grupo = await API.createGrupo(name, state.user.id);
        await API.addMiembro(grupo.id, state.user.id, 'admin');
        $('new-group-name').value = '';
        await loadGroups();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function joinGroup(id) {
    try {
        await API.addMiembro(id, state.user.id, 'miembro');
        await loadGroups();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deleteGroup(id) {
    if (!confirm('¿Eliminar este grupo?')) return;
    try {
        await API.deleteGrupo(id);
        await loadGroups();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============================================
// PERFIL
// ============================================
async function showProfile() {
    showScreen('profile');
    const user = state.userData;
    if (!user) return;

    $('profile-user-name').textContent = user.username || user.nombre || 'Usuario';
    $('profile-user-email').textContent = user.email || state.user.email;
    updateAvatar('profile-avatar', user.avatar_url, user.nombre || user.username);

    $('profile-username').value = user.username || '';
    $('profile-nombre').value = user.nombre || '';
    $('profile-apellido').value = user.apellido || '';
    $('profile-edad').value = user.edad || '';
    $('profile-sexo').value = user.sexo || '';
    $('profile-bio').value = user.bio || '';
}

async function updateProfile() {
    try {
        const updates = {
            username: $('profile-username').value.trim(),
            nombre: $('profile-nombre').value.trim(),
            apellido: $('profile-apellido').value.trim(),
            edad: parseInt($('profile-edad').value),
            sexo: $('profile-sexo').value,
            bio: $('profile-bio').value.trim()
        };

        if (updates.edad < 1 || updates.edad > 120) { alert('Edad no válida'); return; }

        state.userData = await API.updateUsuario(state.user.id, updates);
        alert('✅ Perfil actualizado');
        await showProfile();
        await showDashboard();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============================================
// MIEMBROS
// ============================================
async function showMembers() {
    if (!state.group) return;
    showScreen('members');
    $('members-title').textContent = `Miembros de: ${state.group.name}`;
    await loadMembers();
}

async function loadMembers() {
    try {
        const miembros = await API.getMiembros(state.group.id);
        const container = $('members-list');

        if (!miembros || miembros.length === 0) {
            container.innerHTML = `<p class="text-slate-500 text-sm py-4 text-center">No hay miembros</p>`;
            return;
        }

        container.innerHTML = miembros.map(m => {
            const isCreator = m.usuario_id === state.group.creator;
            const isCurrent = m.usuario_id === state.user.id;
            const user = m.usuario || {};
            const name = user.username || user.nombre || user.email || 'Usuario';

            return `
                <div class="member-item">
                    <div class="member-info">
                        <div class="avatar avatar-sm">${name.charAt(0).toUpperCase()}</div>
                        <div>
                            <span class="text-sm font-medium">${escapeHtml(name)}</span>
                            ${isCreator ? '<span class="badge badge-amber ml-2">Creador</span>' : ''}
                            ${isCurrent ? '<span class="badge badge-green ml-2">Tú</span>' : ''}
                        </div>
                    </div>
                    ${!isCreator && !isCurrent && state.group.creator === state.user.id ? `
                        <button class="btn-remove-member btn-danger" data-id="${m.usuario_id}">Eliminar</button>
                    ` : ''}
                </div>
            `;
        }).join('');

        container.querySelectorAll('.btn-remove-member').forEach(btn => {
            btn.addEventListener('click', () => removeMember(btn.dataset.id));
        });

    } catch (error) {
        $('members-list').innerHTML = `<p class="text-red-400">Error: ${error.message}</p>`;
    }
}

async function inviteMember() {
    const email = $('invite-email').value.trim();
    if (!email) { alert('Ingresa un correo'); return; }
    try {
        const user = await API.getUsuarioByEmail(email);
        if (!user) { alert('Usuario no registrado'); return; }
        if (await API.isMiembro(state.group.id, user.id)) { alert('Ya es miembro'); return; }
        await API.addMiembro(state.group.id, user.id, 'miembro');
        $('invite-email').value = '';
        await loadMembers();
        alert('✅ Invitado exitosamente');
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function removeMember(id) {
    if (!confirm('¿Eliminar este miembro?')) return;
    try {
        await API.removeMiembro(state.group.id, id);
        await loadMembers();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// ============================================
// SALA DE ESTIMACIÓN
// ============================================
async function enterRoom(id, name) {
    cleanupChannels();

    const grupo = await API.getGrupoById(id);

    state.group = { id, name, creator: grupo.creado_por };
    state.isFacilitator = (grupo.creado_por === state.user.id);
    state.sessionId = null;

    $('room-title').textContent = name;
    showScreen('room');

    $('facilitator-panel').classList.toggle('hidden', !state.isFacilitator);
    $('task-name').value = '';
    $('current-task').textContent = '—';

    await loadActiveSession(id);
    subscribeToRoom(id);
}

async function loadActiveSession(groupId) {
    try {
        const sesion = await API.getSesionActiva(groupId);
        if (sesion) {
            state.sessionId = sesion.id;
            state.votesRevealed = sesion.estado === 'revelado';
            $('current-task').textContent = sesion.nombre_tarea;
            await loadTeamStatus();
        } else {
            state.sessionId = null;
            $('current-task').textContent = '—';
            $('team-status').innerHTML = '<p class="text-slate-500 text-xs py-3 text-center">Esperando votación...</p>';
        }
    } catch (error) {
        console.error(error);
    }
}

async function launchVoting() {
    const taskName = $('task-name').value.trim();
    if (!taskName) { alert('Escribe el nombre de la tarea'); return; }
    try {
        await API.supabase
            .from('sesiones')
            .update({ estado: 'revelado' })
            .eq('grupo_id', state.group.id)
            .eq('estado', 'votando');

        const sesion = await API.createSesion(state.group.id, taskName);
        state.sessionId = sesion.id;
        state.votesRevealed = false;
        $('current-task').textContent = taskName;
        $('task-name').value = '';
        await loadTeamStatus();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function revealVotes() {
    if (!state.sessionId) return;
    try {
        await API.revealSesion(state.sessionId);
        state.votesRevealed = true;
        await loadTeamStatus();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function castVote(size) {
    if (!state.sessionId) { alert('No hay votación activa'); return; }
    try {
        const nombre = state.userData?.username || state.userData?.nombre || state.user.email;
        await API.upsertVoto(state.sessionId, state.user.id, nombre, size);
        $$('.tshirt-btn').forEach(b => {
            b.classList.toggle('selected-vote', b.dataset.size === size);
        });
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loadTeamStatus() {
    if (!state.sessionId) {
        $('team-status').innerHTML = '<p class="text-slate-500 text-xs py-3 text-center">Sin votación activa</p>';
        return;
    }

    try {
        const votos = await API.getVotos(state.sessionId);
        const votesMap = {};
        votos.forEach(v => { votesMap[v.usuario_id] = v.talla; });

        const miembros = await API.getMiembros(state.group.id);
        const participants = new Map();
        miembros.forEach(m => {
            const user = m.usuario || {};
            const name = user.username || user.nombre || user.email || 'Usuario';
            participants.set(m.usuario_id, name);
        });

        if (participants.size === 0) {
            $('team-status').innerHTML = '<p class="text-slate-500 text-xs py-3 text-center">Esperando participantes...</p>';
            return;
        }

        let html = '';
        for (const [id, name] of participants) {
            const hasVoted = votesMap[id] !== undefined;
            const display = state.votesRevealed && hasVoted ? votesMap[id] : (hasVoted ? '✓ Listo' : '⏳ Pendiente');
            const isCurrent = id === state.user.id;
            html += `
                <div class="flex justify-between items-center p-2.5 bg-slate-800/40 rounded-lg ${isCurrent ? 'border border-emerald-600/30' : ''}">
                    <span class="text-sm text-slate-300 flex items-center gap-2">
                        ${isCurrent ? '<span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>' : ''}
                        ${escapeHtml(name)}
                    </span>
                    <span class="text-xs font-semibold px-2.5 py-1 rounded-full status-badge
                        ${hasVoted ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 bg-slate-700/50'}">
                        ${display}
                    </span>
                </div>
            `;
        }
        $('team-status').innerHTML = html;

    } catch (error) {
        console.error(error);
    }
}

// ============================================
// TIEMPO REAL
// ============================================
function subscribeToRoom(groupId) {
    cleanupChannels();

    const channel = API.supabase
        .channel(`room-${groupId}`)
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'sesiones', filter: `grupo_id=eq.${groupId}` },
            () => loadActiveSession(groupId)
        )
        .subscribe();

    state.channels.push(channel);

    if (state.sessionId) {
        const votesChannel = API.supabase
            .channel(`votes-${state.sessionId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'votos', filter: `sesion_id=eq.${state.sessionId}` },
                () => loadTeamStatus()
            )
            .subscribe();
        state.channels.push(votesChannel);
    }
}

function cleanupChannels() {
    state.channels.forEach(ch => API.supabase.removeChannel(ch));
    state.channels = [];
}

// ============================================
// EVENT LISTENERS
// ============================================

// --- Auth ---
$('btn-login').addEventListener('click', () => {
    handleLogin($('auth-email').value, $('auth-password').value);
});

$('btn-show-register').addEventListener('click', () => toggleForms(true));
$('btn-back-login').addEventListener('click', () => toggleForms(false));

$('btn-register').addEventListener('click', () => {
    const selected = document.querySelector('input[name="gender"]:checked');
    if (!selected) {
        $('reg-gender-error').classList.remove('hidden');
        return;
    }
    $('reg-gender-error').classList.add('hidden');

    handleRegister(
        $('reg-email').value,
        $('reg-password').value,
        $('reg-nombre').value,
        $('reg-apellido').value,
        $('reg-username').value,
        parseInt($('reg-edad').value),
        selected.value
    );
});

// Enter key para login
$('auth-email').addEventListener('keypress', e => {
    if (e.key === 'Enter') handleLogin($('auth-email').value, $('auth-password').value);
});
$('auth-password').addEventListener('keypress', e => {
    if (e.key === 'Enter') handleLogin($('auth-email').value, $('auth-password').value);
});

// Gender selector
$$('.gender-option').forEach(el => {
    el.addEventListener('click', function() {
        $$('.gender-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        this.querySelector('input').checked = true;
    });
});

// --- Dashboard ---
$('btn-logout').addEventListener('click', handleLogout);
$('btn-profile').addEventListener('click', showProfile);
$('btn-create-group').addEventListener('click', createGroup);
$('new-group-name').addEventListener('keypress', e => {
    if (e.key === 'Enter') createGroup();
});

// --- Profile ---
$('btn-back-profile').addEventListener('click', showDashboard);
$('btn-update-profile').addEventListener('click', updateProfile);

// --- Members ---
$('btn-back-members').addEventListener('click', () => showScreen('room'));
$('btn-invite').addEventListener('click', inviteMember);
$('invite-email').addEventListener('keypress', e => {
    if (e.key === 'Enter') inviteMember();
});

// --- Room ---
$('btn-back-room').addEventListener('click', () => {
    cleanupChannels();
    showDashboard();
});
$('btn-members').addEventListener('click', showMembers);
$('btn-launch').addEventListener('click', launchVoting);
$('btn-reveal').addEventListener('click', revealVotes);

$$('.tshirt-btn').forEach(btn => {
    btn.addEventListener('click', () => castVote(btn.dataset.size));
});

// ============================================
// INICIALIZACIÓN
// ============================================
async function init() {
    try {
        const session = await API.getSession();
        if (session) {
            state.user = session.user;
            state.userData = await API.getUsuario(session.user.id);
            await showDashboard();
        }
    } catch (error) {
        console.error('Init error:', error);
    }
}

init();
console.log('👕 CamiX cargado correctamente');