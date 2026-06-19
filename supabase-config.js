// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================

const SUPABASE_URL = 'https://uwxkdkxwonukadjwwuok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3eGtka3h3b251a2Fkand3dW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY1MTksImV4cCI6MjA5NzM5MjUxOX0.Cnp-mD-nQM1isECFf2r4RvR2Z6m03ynO5moMMb_1gwY';

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// FUNCIONES DE BASE DE DATOS
// ============================================

// --- USUARIOS ---
async function getUsuario(userId) {
    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();
    
    if (error) throw error;
    return data;
}

async function updateUsuario(userId, updates) {
    const { data, error } = await supabase
        .from('usuarios')
        .update({
            ...updates,
            actualizado_en: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// --- GRUPOS ---
async function getGrupos() {
    const { data, error } = await supabase
        .from('grupos')
        .select('*')
        .order('creado_en', { ascending: false });
    
    if (error) throw error;
    return data;
}

async function getGrupoById(grupoId) {
    const { data, error } = await supabase
        .from('grupos')
        .select('*')
        .eq('id', grupoId)
        .single();
    
    if (error) throw error;
    return data;
}

async function createGrupo(nombre, creadorId) {
    const { data, error } = await supabase
        .from('grupos')
        .insert([{ 
            nombre: nombre.trim(),
            creado_por: creadorId
        }])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function updateGrupo(grupoId, nombre) {
    const { data, error } = await supabase
        .from('grupos')
        .update({ nombre: nombre.trim() })
        .eq('id', grupoId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function deleteGrupo(grupoId) {
    const { error } = await supabase
        .from('grupos')
        .delete()
        .eq('id', grupoId);
    
    if (error) throw error;
}

// --- MIEMBROS ---
async function getMiembros(grupoId) {
    const { data, error } = await supabase
        .from('miembros_grupo')
        .select(`
            *,
            usuario:usuarios(id, email, nombre, avatar_url)
        `)
        .eq('grupo_id', grupoId);
    
    if (error) throw error;
    return data;
}

async function addMiembro(grupoId, usuarioId, rol = 'miembro') {
    const { data, error } = await supabase
        .from('miembros_grupo')
        .insert([{
            grupo_id: grupoId,
            usuario_id: usuarioId,
            rol: rol
        }])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function removeMiembro(grupoId, usuarioId) {
    const { error } = await supabase
        .from('miembros_grupo')
        .delete()
        .eq('grupo_id', grupoId)
        .eq('usuario_id', usuarioId);
    
    if (error) throw error;
}

async function isMiembro(grupoId, usuarioId) {
    const { data, error } = await supabase
        .from('miembros_grupo')
        .select('id')
        .eq('grupo_id', grupoId)
        .eq('usuario_id', usuarioId)
        .maybeSingle();
    
    if (error) throw error;
    return !!data;
}

// --- SESIONES Y VOTOS (igual que antes) ---
async function getSesionActiva(grupoId) {
    const { data, error } = await supabase
        .from('sesiones')
        .select('*')
        .eq('grupo_id', grupoId)
        .eq('estado', 'votando')
        .order('creada_en', { ascending: false })
        .limit(1)
        .maybeSingle();
    
    if (error) throw error;
    return data;
}

async function createSesion(grupoId, nombreTarea) {
    const { data, error } = await supabase
        .from('sesiones')
        .insert([{
            grupo_id: grupoId,
            nombre_tarea: nombreTarea,
            estado: 'votando'
        }])
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

async function revealSesion(sesionId) {
    const { error } = await supabase
        .from('sesiones')
        .update({ estado: 'revelado' })
        .eq('id', sesionId);
    
    if (error) throw error;
}

async function getVotos(sesionId) {
    const { data, error } = await supabase
        .from('votos')
        .select('*')
        .eq('sesion_id', sesionId);
    
    if (error) throw error;
    return data;
}

async function upsertVoto(sesionId, usuarioId, nombreUsuario, talla) {
    const { data, error } = await supabase
        .from('votos')
        .upsert({
            sesion_id: sesionId,
            usuario_id: usuarioId,
            nombre_usuario: nombreUsuario,
            talla: talla
        }, { 
            onConflict: 'sesion_id, usuario_id' 
        })
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================

async function signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
            data: userData
        }
    });
    
    if (error) throw error;
    return data;
}

async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    if (error) throw error;
    return data;
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
}

async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
}

// ============================================
// FUNCIONES DE STORAGE (para fotos de perfil)
// ============================================

async function uploadAvatar(userId, file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    // Subir archivo
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    // Obtener URL pública
    const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
    
    // Actualizar usuario con URL
    await updateUsuario(userId, { avatar_url: urlData.publicUrl });
    
    return urlData.publicUrl;
}

// ============================================
// EXPORTAR FUNCIONES (para usar en app.js)
// ============================================
window.db = {
    // Usuarios
    getUsuario,
    updateUsuario,
    
    // Grupos
    getGrupos,
    getGrupoById,
    createGrupo,
    updateGrupo,
    deleteGrupo,
    
    // Miembros
    getMiembros,
    addMiembro,
    removeMiembro,
    isMiembro,
    
    // Sesiones y Votos
    getSesionActiva,
    createSesion,
    revealSesion,
    getVotos,
    upsertVoto,
    
    // Auth
    signUp,
    signIn,
    signOut,
    getCurrentUser,
    getSession,
    
    // Storage
    uploadAvatar
};