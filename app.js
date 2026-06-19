// ============================================
// APLICACIÓN PRINCIPAL CamiX
// ============================================

// --- ESTADO GLOBAL ---
const state = {
    session: null,
    currentUser: null,
    currentUserData: null,
    currentGroup: null,
    currentGroupMembers: [],
    currentSessionId: null,
    isFacilitator: false,
    votesRevealed: false,
    realtimeChannels: []
};

// --- ELEMENTOS DEL DOM ---
const DOM = {
    // Screens
    auth: document.getElementById('auth-screen'),
    dashboard: document.getElementById('dashboard-screen'),
    room: document.getElementById('room-screen'),
    profile: document.getElementById('profile-screen'),
    groupMembers: document.getElementById('group-members-screen'),
    
    // Auth
    authEmail: document.getElementById('auth-email'),
    authPassword: document.getElementById('auth-password'),
    authError: document.getElementById('auth-error'),
    btnLogin: document.getElementById('btn-login'),
    btnShowRegister: document.getElementById('btn-show-register'),
    btnBackLogin: document.getElementById('btn-back-login'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    
    // Register
    regEmail: document.getElementById('reg-email'),
    regPassword: document.getElementById('reg-password'),
    regNombre: document.getElementById('reg-nombre'),
    regApellido: document.getElementById('reg-apellido'),
    regEdad: document.getElementById('reg-edad'),
    regUsername: document.getElementById('reg-username'),
    regGenderError: document.getElementById('reg-gender-error'),
    btnRegister: document.getElementById('btn-register'),
    regError: document.getElementById('reg-error'),
    genderOptions: document.querySelectorAll('.gender-option'),
    
    // Dashboard
    dashboardUserEmail: document.getElementById('dashboard-user-email'),
    dashboardUserName: document.getElementById('dashboard-user-name'),
    dashboardUserAvatar: document.getElementById('dashboard-user-avatar'),
    btnLogout: document.getElementById('btn-logout'),
    btnProfile: document.getElementById('btn-profile'),
    newGroupName: document.getElementById('new-group-name'),
    btnCreateGroup: document.getElementById('btn-create-group'),
    groupsList: document.getElementById('groups-list'),
    
    // Profile
    profileUserName: document.getElementById('profile-user-name'),
    profileUserEmail: document.getElementById('profile-user-email'),
    profileUserAvatar: document.getElementById('profile-user-avatar'),
    profileUsername: document.getElementById('profile-username'),
    profileNombre: document.getElementById('profile-nombre'),
    profileApellido: document.getElementById('profile-apellido'),
    profileEdad: document.getElementById('profile-edad'),
    profileSexo: document.getElementById('profile-sexo'),
    profileBio: document.getElementById('profile-bio'),
    profileAvatarInput: document.getElementById('profile-avatar-input'),
    btnUpdateProfile: document.getElementById('btn-update-profile'),
    btnBackFromProfile: document.getElementById('btn-back-from-profile'),
    
    // Group Members
    membersList: document.getElementById('members-list'),
    inviteEmail: document.getElementById('invite-email'),
    btnInviteMember: document.getElementById('btn-invite-member'),
    btnBackFromMembers: document.getElementById('btn-back-from-members'),
    groupMembersTitle: document.getElementById('group-members-title'),
    
    // Room
    roomTitle: document.getElementById('room-title'),
    btnBackDashboard: document.getElementById('btn-back-dashboard'),
    facilitatorPanel: document.getElementById('facilitator-panel'),
    taskNameInput: document.getElementById('task-name-input'),
    btnLaunchVoting: document.getElementById('btn-launch-voting'),
    btnRevealVotes: document.getElementById('btn-reveal-votes'),
    currentTaskName: document.getElementById('current-task-name'),
    teamStatusList: document.getElementById('team-status-list'),
    tshirtButtons: document.querySelectorAll('[data-size]'),
    btnManageMembers: document.getElementById('btn-manage-members'),
};

// ============================================
// NAVEGACIÓN
// ============================================
function showScreen(screenName) {
    const screens = ['auth', 'dashboard', 'room', 'profile', 'group-members'];
    screens.forEach(name => {
        const el = document.getElementById(`${name}-screen`);
        if (el) el.classList.toggle('active', name === screenName);
    });
}

// ============================================
// AUTENTICACIÓN
// ============================================
function toggleForms(showRegister) {
    if (showRegister) {
        DOM.loginForm.classList.add('hidden');
        DOM.registerForm.classList.remove('hidden');
        DOM.authError.textContent = '';
    } else {
        DOM.loginForm.classList.remove('hidden');
        DOM.registerForm.classList.add('hidden');
        DOM.regError.textContent = '';
        DOM.regGenderError.classList.add('hidden');
        DOM.genderOptions.forEach(opt => opt.classList.remove('selected'));
    }
}

// Selección de género
DOM.genderOptions.forEach(option => {
    option.addEventListener('click', function() {
        DOM.genderOptions.forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        const radio = this.querySelector('input[type="radio"]');
        radio.checked = true;
        DOM.regGenderError.classList.add('hidden');
    });
});

// Registro
async function handleRegister(email, password, nombre, apellido, username, edad, sexo) {
    try {
        DOM.regError.textContent = '';
        
        // Validaciones
        if (!email || !password || !nombre || !apellido || !username || !edad || !sexo) {
            DOM.regError.textContent = 'Todos los campos son obligatorios';
            return;
        }
        
        if (password.length < 6) {
            DOM.regError.textContent = 'La contraseña debe tener al menos 6 caracteres';
            return;
        }
        
        if (edad < 1 || edad > 120) {
            DOM.regError.textContent = 'Edad no válida';
            return;
        }
        
        // Verificar si el username ya existe
        const { data: existingUser } = await supabase
            .from('usuarios')
            .select('username')
            .eq('username', username)
            .maybeSingle();
        
        if (existingUser) {
            DOM.regError.textContent = 'Este nombre de usuario ya está en uso';
            return;
        }
        
        // Registrar usuario
        const { data, error } = await db.signUp(email, password, {
            nombre: nombre,
            apellido: apellido,
            username: username,
            edad: edad,
            sexo: sexo
        });
        
        if (error) throw error;
        
        if (data.user?.identities?.length === 0) {
            throw new Error('Este correo ya está registrado');
        }
        
        DOM.regError.textContent = '✅ ¡Registro exitoso! Revisa tu correo para confirmar.';
        DOM.regError.classList.remove('text-red-400');
        DOM.regError.classList.add('text-emerald-400');
        
        // Limpiar formulario
        DOM.regEmail.value = '';
        DOM.regPassword.value = '';
        DOM.regNombre.value = '';
        DOM.regApellido.value = '';
        DOM.regUsername.value = '';
        DOM.regEdad.value = '';
        DOM.genderOptions.forEach(opt => opt.classList.remove('selected'));
        
        setTimeout(() => {
            toggleForms(false);
            DOM.regError.textContent = '';
        }, 3000);
        
    } catch (error) {
        DOM.regError.textContent = error.message || 'Error en el registro';
        DOM.regError.classList.add('text-red-400');
        DOM.regError.classList.remove('text-emerald-400');
    }
}

// Login
async function handleLogin(email, password) {
    try {
        DOM.authError.textContent = '';
        const { user, session } = await db.signIn(email, password);
        
        state.session = session;
        state.currentUser = user;
        
        // Cargar datos del usuario
        state.currentUserData = await db.getUsuario(user.id);
        await showDashboard();
        
    } catch (error) {
        DOM.authError.textContent = error.message || 'Error de autenticación';
    }
}

// Logout
async function handleLogout() {
    cleanupChannels();
    await db.signOut();
    state.session = null;
    state.currentUser = null;
    state.currentUserData = null;
    state.currentGroup = null;
    showScreen('auth');
}

// ============================================
// DASHBOARD
// ============================================
async function showDashboard() {
    if (!state.currentUser) return;
    showScreen('dashboard');
    
    // Mostrar info del usuario
    DOM.dashboardUserEmail.textContent = state.currentUser.email;
    if (state.currentUserData) {
        const displayName = state.currentUserData.username || state.currentUserData.nombre || 'Usuario';
        DOM.dashboardUserName.textContent = `@${displayName}`;
        if (state.currentUserData.avatar_url) {
            DOM.dashboardUserAvatar.src = state.currentUserData.avatar_url;
        }
    }
    
    await loadGroups();
}

async function loadGroups() {
    try {
        const grupos = await db.getGrupos();
        
        if (!grupos || grupos.length === 0) {
            DOM.groupsList.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-slate-500 text-sm">No hay grupos aún</p>
                    <p class="text-slate-600 text-xs mt-1">¡Crea tu primer grupo!</p>
                </div>
            `;
            return;
        }
        
        // Obtener información de usuarios
        const userIds = [...new Set(grupos.map(g => g.creado_por).filter(Boolean))];
        const userMap = {};
        
        if (userIds.length > 0) {
            const { data: users } = await supabase
                .from('usuarios')
                .select('id, nombre, username, avatar_url')
                .in('id', userIds);
            
            if (users) {
                users.forEach(u => {
                    userMap[u.id] = u;
                });
            }
        }
        
        // Verificar membresía para cada grupo
        const groupHTML = await Promise.all(grupos.map(async (grupo) => {
            const isMember = await db.isMiembro(grupo.id, state.currentUser.id);
            const isCreator = grupo.creado_por === state.currentUser.id;
            const creatorInfo = userMap[grupo.creado_por];
            
            let creatorDisplay = 'Usuario desconocido';
            if (isCreator) {
                creatorDisplay = '👤 Tú';
            } else if (creatorInfo) {
                creatorDisplay = creatorInfo.username || creatorInfo.nombre || creatorInfo.email;
            }
            
            // Obtener conteo de miembros
            const { count } = await supabase
                .from('miembros_grupo')
                .select('*', { count: 'exact', head: true })
                .eq('grupo_id', grupo.id);
            
            return `
                <div class="flex justify-between items-center p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 hover:border-emerald-600/50 transition-all">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-3">
                            <p class="text-sm font-semibold text-slate-200 truncate">${escapeHtml(grupo.nombre)}</p>
                            ${isCreator ? '<span class="badge badge-amber">👑 Creador</span>' : ''}
                            ${isMember && !isCreator ? '<span class="badge badge-green">✓ Miembro</span>' : ''}
                        </div>
                        <div class="flex items-center gap-3 mt-1">
                            <p class="text-xs text-slate-500">Creado por: ${escapeHtml(creatorDisplay)}</p>
                            <span class="text-xs text-slate-600">• ${count || 0} miembros</span>
                        </div>
                        <p class="text-xs text-slate-600">${new Date(grupo.creado_en).toLocaleDateString('es-ES')}</p>
                    </div>
                    <div class="flex items-center gap-2 flex-shrink-0 ml-3">
                        ${isMember || isCreator ? `
                            <button data-group-id="${grupo.id}" data-group-name="${escapeHtml(grupo.nombre)}" 
                                    class="btn-enter-room bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border border-emerald-600/30">
                                Entrar
                            </button>
                        ` : `
                            <button data-group-id="${grupo.id}" class="btn-join-group bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-all border border-amber-600/30">
                                Unirse
                            </button>
                        `}
                        ${isCreator ? `
                            <button data-group-id="${grupo.id}" class="btn-delete-group text-red-400 hover:text-red-300 hover:bg-red-400/10 p-1.5 rounded-lg transition-all">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }));
        
        DOM.groupsList.innerHTML = groupHTML.join('');
        
        // Event listeners
        document.querySelectorAll('.btn-enter-room').forEach(btn => {
            btn.addEventListener('click', () => {
                enterRoom(btn.dataset.groupId, btn.dataset.groupName);
            });
        });
        
        document.querySelectorAll('.btn-join-group').forEach(btn => {
            btn.addEventListener('click', () => {
                joinGroup(btn.dataset.groupId);
            });
        });
        
        document.querySelectorAll('.btn-delete-group').forEach(btn => {
            btn.addEventListener('click', () => {
                deleteGroup(btn.dataset.groupId);
            });
        });
        
    } catch (error) {
        console.error('Error en loadGroups:', error);
        DOM.groupsList.innerHTML = `<p class="text-red-400 text-xs py-4 text-center">Error: ${error.message}</p>`;
    }
}

async function createGroup(name) {
    if (!name.trim()) {
        alert('Por favor ingresa un nombre para el grupo');
        return;
    }
    
    try {
        const grupo = await db.createGrupo(name, state.currentUser.id);
        // El creador automáticamente es miembro
        await db.addMiembro(grupo.id, state.currentUser.id, 'admin');
        DOM.newGroupName.value = '';
        await loadGroups();
    } catch (error) {
        alert('Error al crear grupo: ' + error.message);
    }
}

async function joinGroup(groupId) {
    try {
        await db.addMiembro(groupId, state.currentUser.id, 'miembro');
        await loadGroups();
    } catch (error) {
        alert('Error al unirse al grupo: ' + error.message);
    }
}

async function deleteGroup(groupId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este grupo? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        await db.deleteGrupo(groupId);
        await loadGroups();
    } catch (error) {
        alert('Error al eliminar grupo: ' + error.message);
    }
}

// ============================================
// PERFIL DE USUARIO
// ============================================
async function showProfile() {
    showScreen('profile');
    
    const user = state.currentUserData;
    if (!user) return;
    
    DOM.profileUserName.textContent = user.username || user.nombre || 'Usuario';
    DOM.profileUserEmail.textContent = user.email || state.currentUser.email;
    DOM.profileUserAvatar.src = user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre || 'User')}&background=166534&color=4ade80&size=128`;
    
    DOM.profileUsername.value = user.username || '';
    DOM.profileNombre.value = user.nombre || '';
    DOM.profileApellido.value = user.apellido || '';
    DOM.profileEdad.value = user.edad || '';
    DOM.profileSexo.value = user.sexo || '';
    DOM.profileBio.value = user.bio || '';
}

async function updateProfile() {
    try {
        const updates = {
            username: DOM.profileUsername.value.trim(),
            nombre: DOM.profileNombre.value.trim(),
            apellido: DOM.profileApellido.value.trim(),
            edad: parseInt(DOM.profileEdad.value),
            sexo: DOM.profileSexo.value,
            bio: DOM.profileBio.value.trim()
        };
        
        if (updates.edad < 1 || updates.edad > 120) {
            alert('Edad no válida');
            return;
        }
        
        // Verificar username único
        if (updates.username) {
            const { data: existing } = await supabase
                .from('usuarios')
                .select('id')
                .eq('username', updates.username)
                .neq('id', state.currentUser.id)
                .maybeSingle();
            
            if (existing) {
                alert('Este nombre de usuario ya está en uso');
                return;
            }
        }
        
        state.currentUserData = await db.updateUsuario(state.currentUser.id, updates);
        alert('✅ Perfil actualizado correctamente');
        await showProfile();
        await showDashboard();
        
    } catch (error) {
        alert('Error al actualizar perfil: ' + error.message);
    }
}

async function uploadAvatar(file) {
    try {
        const url = await db.uploadAvatar(state.currentUser.id, file);
        state.currentUserData.avatar_url = url;
        await showProfile();
        await showDashboard();
        alert('✅ Foto de perfil actualizada');
    } catch (error) {
        alert('Error al subir foto: ' + error.message);
    }
}

// ============================================
// GESTIÓN DE MIEMBROS
// ============================================
async function showGroupMembers() {
    if (!state.currentGroup) return;
    showScreen('group-members');
    
    DOM.groupMembersTitle.textContent = `Miembros de: ${state.currentGroup.name}`;
    await loadMembers();
}

async function loadMembers() {
    try {
        const miembros = await db.getMiembros(state.currentGroup.id);
        
        if (!miembros || miembros.length === 0) {
            DOM.membersList.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-slate-500 text-sm">No hay miembros en este grupo</p>
                    <p class="text-slate-600 text-xs mt-1">Invita a tu equipo</p>
                </div>
            `;
            return;
        }
        
        DOM.membersList.innerHTML = miembros.map(m => {
            const isCreator = m.usuario_id === state.currentGroup.creator;
            const isCurrentUser = m.usuario_id === state.currentUser.id;
            const user = m.usuario || {};
            const displayName = user.username || user.nombre || user.email || 'Usuario';
            
            return `
                <div class="member-item">
                    <div class="member-info">
                        ${user.avatar_url ? 
                            `<img src="${user.avatar_url}" class="avatar avatar-sm">` :
                            `<div class="avatar avatar-sm">${displayName.charAt(0).toUpperCase()}</div>`
                        }
                        <div>
                            <span class="text-sm font-medium text-slate-200">${escapeHtml(displayName)}</span>
                            ${isCreator ? '<span class="badge badge-amber ml-2">Creador</span>' : ''}
                            ${isCurrentUser ? '<span class="badge badge-green ml-2">Tú</span>' : ''}
                        </div>
                    </div>
                    ${!isCreator && isCurrentUser ? `
                        <button data-user-id="${m.usuario_id}" class="btn-remove-member btn-danger">
                            Eliminar
                        </button>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        // Event listeners para eliminar miembros
        document.querySelectorAll('.btn-remove-member').forEach(btn => {
            btn.addEventListener('click', () => {
                removeMember(btn.dataset.userId);
            });
        });
        
    } catch (error) {
        console.error('Error loading members:', error);
        DOM.membersList.innerHTML = `<p class="text-red-400 text-xs">Error: ${error.message}</p>`;
    }
}

async function inviteMember(email) {
    if (!email.trim()) {
        alert('Ingresa un correo electrónico');
        return;
    }
    
    try {
        // Buscar usuario por email
        const { data: user } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email.trim())
            .maybeSingle();
        
        if (!user) {
            alert('Usuario no encontrado. Asegúrate de que esté registrado.');
            return;
        }
        
        // Verificar si ya es miembro
        const isMember = await db.isMiembro(state.currentGroup.id, user.id);
        if (isMember) {
            alert('Este usuario ya es miembro del grupo');
            return;
        }
        
        await db.addMiembro(state.currentGroup.id, user.id, 'miembro');
        DOM.inviteEmail.value = '';
        await loadMembers();
        alert('✅ Usuario invitado exitosamente');
        
    } catch (error) {
        alert('Error al invitar: ' + error.message);
    }
}

async function removeMember(userId) {
    if (!confirm('¿Quieres eliminar a este miembro del grupo?')) return;
    
    try {
        await db.removeMiembro(state.currentGroup.id, userId);
        await loadMembers();
    } catch (error) {
        alert('Error al eliminar miembro: ' + error.message);
    }
}

// ============================================
// SALA DE ESTIMACIÓN
// ============================================
async function enterRoom(groupId, groupName) {
    cleanupChannels();
    
    // Obtener información del grupo
    const grupo = await db.getGrupoById(groupId);
    state.currentGroup = { 
        id: groupId, 
        name: groupName,
        creator: grupo.creado_por
    };
    
    // Verificar si es facilitador (creador del grupo)
    state.isFacilitator = (grupo.creado_por === state.currentUser.id);
    state.currentSessionId = null;
    state.votesRevealed = false;
    
    DOM.roomTitle.textContent = groupName;
    showScreen('room');
    
    // Mostrar/ocultar panel de facilitador
    if (state.isFacilitator) {
        DOM.facilitatorPanel.classList.remove('hidden');
    } else {
        DOM.facilitatorPanel.classList.add('hidden');
    }
    
    // Resetear UI
    DOM.taskNameInput.value = '';
    DOM.currentTaskName.textContent = '—';
    DOM.teamStatusList.innerHTML = '<p class="text-slate-500 text-xs py-3 text-center">Cargando estado...</p>';
    resetTshirtButtons();
    
    // Cargar sesión activa
    await loadActiveSession(groupId);
    subscribeToRoomUpdates(groupId);
}

async function loadActiveSession(groupId) {
    try {
        const sesion = await db.getSesionActiva(groupId);
        
        if (sesion) {
            state.currentSessionId = sesion.id;
            DOM.currentTaskName.textContent = sesion.nombre_tarea;
            state.votesRevealed = sesion.estado === 'revelado';
            await loadTeamStatus();
        } else {
            state.currentSessionId = null;
            DOM.currentTaskName.textContent = '—';
            DOM.teamStatusList.innerHTML = '<p class="text-slate-500 text-xs py-3 text-center">Esperando nueva votación...</p>';
        }
    } catch (error) {
        console.error('Error loading session:', error);
    }
}

async function launchVoting() {
    const taskName = DOM.taskNameInput.value.trim();
    if (!taskName) {
        alert('Escribe el nombre de la tarea');
        return;
    }
    if (!state.currentGroup) return;
    
    try {
        // Finalizar sesiones anteriores
        await supabase
            .from('sesiones')
            .update({ estado: 'revelado' })
            .eq('grupo_id', state.currentGroup.id)
            .eq('estado', 'votando');
        
        const sesion = await db.createSesion(state.currentGroup.id, taskName);
        
        state.currentSessionId = sesion.id;
        state.votesRevealed = false;
        DOM.currentTaskName.textContent = taskName;
        DOM.taskNameInput.value = '';
        resetTshirtButtons();
        await loadTeamStatus();
        
    } catch (error) {
        alert('Error al lanzar votación: ' + error.message);
    }
}

async function castVote(size) {
    if (!state.currentSessionId || !state.currentUser) {
        alert('No hay votación activa');
        return;
    }
    
    try {
        const nombreUsuario = state.currentUserData?.username || 
                            state.currentUserData?.nombre || 
                            state.currentUser.email;
        
        await db.upsertVoto(
            state.currentSessionId,
            state.currentUser.id,
            nombreUsuario,
            size
        );
        
        highlightSelectedSize(size);
        
    } catch (error) {
        alert('Error al votar: ' + error.message);
    }
}

async function revealVotes() {
    if (!state.currentSessionId) return;
    
    try {
        await db.revealSesion(state.currentSessionId);
        state.votesRevealed = true;
        await loadTeamStatus();
    } catch (error) {
        alert('Error al revelar votos: ' + error.message);
    }
}

async function loadTeamStatus() {
    if (!state.currentSessionId) {
        DOM.teamStatusList.innerHTML = '<p class="text-slate-500 text-xs py-3 text-center">Sin votación activa</p>';
        return;
    }
    
    try {
        const votos = await db.getVotos(state.currentSessionId);
        const votesMap = {};
        if (votos) {
            votos.forEach(v => {
                votesMap[v.usuario_id] = { talla: v.talla, nombre: v.nombre_usuario };
            });
        }
        
        // Obtener miembros del grupo para mostrar quiénes deberían votar
        const miembros = await db.getMiembros(state.currentGroup.id);
        const participants = new Map();
        
        // Primero agregar miembros del grupo
        if (miembros) {
            miembros.forEach(m => {
                const user = m.usuario || {};
                const displayName = user.username || user.nombre || user.email || 'Usuario';
                participants.set(m.usuario_id, displayName);
            });
        }
        
        // Si no hay miembros, mostrar solo votantes
        if (participants.size === 0 && votos) {
            votos.forEach(v => {
                participants.set(v.usuario_id, v.nombre_usuario);
            });
        }
        
        if (participants.size === 0) {
            DOM.teamStatusList.innerHTML = '<p class="text-slate-500 text-xs py-3 text-center">Esperando participantes...</p>';
            return;
        }
        
        DOM.teamStatusList.innerHTML = Array.from(participants.entries()).map(([userId, userName]) => {
            const hasVoted = votesMap[userId] !== undefined;
            const voteDisplay = state.votesRevealed && hasVoted ? votesMap[userId].talla : (hasVoted ? '✓ Listo' : '⏳ Pendiente');
            const isCurrentUser = userId === state.currentUser.id;
            
            return `
                <div class="flex justify-between items-center p-2.5 bg-slate-800/40 rounded-lg ${isCurrentUser ? 'border border-emerald-600/30' : ''}">
                    <span class="text-sm text-slate-300 flex items-center gap-2">
                        ${isCurrentUser ? '<span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>' : ''}
                        ${escapeHtml(userName)}
                    </span>
                    <span class="text-xs font-semibold px-2.5 py-1 rounded-full status-badge
                        ${hasVoted ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 bg-slate-700/50'}">
                        ${voteDisplay}
                    </span>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading team status:', error);
    }
}

function highlightSelectedSize(size) {
    DOM.tshirtButtons.forEach(btn => {
        btn.classList.toggle('selected-vote', btn.dataset.size === size);
    });
}

function resetTshirtButtons() {
    DOM.tshirtButtons.forEach(btn => btn.classList.remove('selected-vote'));
}

// ============================================
// TIEMPO REAL (SUPABASE CHANNELS)
// ============================================
function subscribeToRoomUpdates(groupId) {
    cleanupChannels();
    
    const sessionChannel = supabase
        .channel(`sesiones-grupo-${groupId}`)
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'sesiones', filter: `grupo_id=eq.${groupId}` },
            async () => {
                await loadActiveSession(groupId);
            }
        )
        .subscribe();
    
    state.realtimeChannels.push(sessionChannel);
    
    if (state.currentSessionId) {
        const votesChannel = supabase
            .channel(`votos-sesion-${state.currentSessionId}`)
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'votos', filter: `sesion_id=eq.${state.currentSessionId}` },
                async () => {
                    await loadTeamStatus();
                }
            )
            .subscribe();
        
        state.realtimeChannels.push(votesChannel);
    }
}

function cleanupChannels() {
    state.realtimeChannels.forEach(channel => {
        supabase.removeChannel(channel);
    });
    state.realtimeChannels = [];
}

// ============================================
// UTILIDADES
// ============================================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// EVENT LISTENERS
// ============================================

// --- Auth ---
DOM.btnLogin.addEventListener('click', () => handleLogin(DOM.authEmail.value, DOM.authPassword.value));
DOM.btnShowRegister.addEventListener('click', () => toggleForms(true));
DOM.btnBackLogin.addEventListener('click', () => toggleForms(false));

DOM.btnRegister.addEventListener('click', () => {
    const selectedGender = document.querySelector('input[name="gender"]:checked');
    if (!selectedGender) {
        DOM.regGenderError.classList.remove('hidden');
        return;
    }
    DOM.regGenderError.classList.add('hidden');
    
    handleRegister(
        DOM.regEmail.value,
        DOM.regPassword.value,
        DOM.regNombre.value,
        DOM.regApellido.value,
        DOM.regUsername.value,
        parseInt(DOM.regEdad.value),
        selectedGender.value
    );
});

// Enter key para login
DOM.authEmail.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin(DOM.authEmail.value, DOM.authPassword.value);
});
DOM.authPassword.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin(DOM.authEmail.value, DOM.authPassword.value);
});

// --- Dashboard ---
DOM.btnLogout.addEventListener('click', handleLogout);
DOM.btnProfile.addEventListener('click', showProfile);
DOM.btnCreateGroup.addEventListener('click', () => createGroup(DOM.newGroupName.value));
DOM.newGroupName.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') createGroup(DOM.newGroupName.value);
});

// --- Profile ---
DOM.btnBackFromProfile.addEventListener('click', showDashboard);
DOM.btnUpdateProfile.addEventListener('click', updateProfile);
DOM.profileAvatarInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        uploadAvatar(e.target.files[0]);
    }
});

// --- Group Members ---
DOM.btnBackFromMembers.addEventListener('click', () => {
    showScreen('room');
});
DOM.btnInviteMember.addEventListener('click', () => inviteMember(DOM.inviteEmail.value));
DOM.inviteEmail.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') inviteMember(DOM.inviteEmail.value);
});

// --- Room ---
DOM.btnBackDashboard.addEventListener('click', () => {
    cleanupChannels();
    showDashboard();
});
DOM.btnLaunchVoting.addEventListener('click', launchVoting);
DOM.btnRevealVotes.addEventListener('click', revealVotes);
DOM.btnManageMembers.addEventListener('click', showGroupMembers);

// T-Shirt voting
DOM.tshirtButtons.forEach(btn => {
    btn.addEventListener('click', () => castVote(btn.dataset.size));
});

// ============================================
// INICIALIZACIÓN
// ============================================
async function init() {
    try {
        const session = await db.getSession();
        if (session) {
            state.session = session;
            state.currentUser = session.user;
            state.currentUserData = await db.getUsuario(session.user.id);
            await showDashboard();
        }
    } catch (error) {
        console.error('Error en inicialización:', error);
    }
}

// Iniciar aplicación
init();
console.log('👕 CamiX v2.0 - Con gestión de miembros y perfiles');