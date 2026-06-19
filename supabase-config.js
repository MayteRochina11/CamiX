// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================

const SUPABASE_URL = 'https://uwxkdkxwonukadjwwuok.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3eGtka3h3b251a2Fkand3dW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4MTY1MTksImV4cCI6MjA5NzM5MjUxOX0.Cnp-mD-nQM1isECFf2r4RvR2Z6m03ynO5moMMb_1gwY';

// Inicializar Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================
async function signUp(email, password, userData) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: userData }
    });
    if (error) throw error;
    return data;
}

async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

async function getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
}

async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
}

// ============================================
// FUNCIONES DE USUARIOS
// ============================================
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
        .update({ ...updates, actualizado_en: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
    if (error) throw error;
    return data;
}

async function getUsuarioByEmail(email) {
    const { data, error } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', email)
        .maybeSingle();
    if (error) throw error;
    return data;
}

// ============================================
// FUNCIONES DE GRUPOS
// ============================================
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
        .insert([{ nombre: nombre.trim(), creado_por: creadorId }])
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

// ============================================
// FUNCIONES DE MIEMBROS
// ============================================
async function getMiembros(grupoId) {
    const { data, error } = await supabase
        .from('miembros_grupo')
        .select(`
            *,
            usuario:usuarios(id, email, nombre, username, avatar_url)
        `)
        .eq('grupo_id', grupoId);
    if (error) throw error;
    return data;
}

async function addMiembro(grupoId, usuarioId, rol = 'miembro') {
    const { data, error } = await supabase
        .from('miembros_grupo')
        .insert([{ grupo_id: grupoId, usuario_id: usuarioId, rol: rol }])
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

async function countMiembros(grupoId) {
    const { count, error } = await supabase
        .from('miembros_grupo')
        .select('*', { count: 'exact', head: true })
        .eq('grupo_id', grupoId);
    if (error) throw error;
    return count;
}

// ============================================
// FUNCIONES DE SESIONES
// ============================================
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
        .insert([{ grupo_id: grupoId, nombre_tarea: nombreTarea, estado: 'votando' }])
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

// ============================================
// FUNCIONES DE VOTOS
// ============================================
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
        }, { onConflict: 'sesion_id, usuario_id' })
        .select()
        .single();
    if (error) throw error;
    return data;
}

// ============================================
// FUNCIONES DE STORAGE (Avatar)
// ============================================
async function uploadAvatar(userId, file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
    
    return urlData.publicUrl;
}

// ============================================
// EXPORTAR PARA USAR EN app.js
// ============================================
window.SupabaseAPI = {
    // Auth
    signUp,
    signIn,
    signOut,
    getSession,
    getCurrentUser,
    
    // Usuarios
    getUsuario,
    updateUsuario,
    getUsuarioByEmail,
    
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
    countMiembros,
    
    // Sesiones
    getSesionActiva,
    createSesion,
    revealSesion,
    
    // Votos
    getVotos,
    upsertVoto,
    
    // Storage
    uploadAvatar,
    
    // Supabase instance
    supabase
};