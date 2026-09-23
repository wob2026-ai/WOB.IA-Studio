import { createClient } from '@supabase/supabase-js';

// URL e Chave Pública (Anon Key) seguras para o frontend do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://efvqdtrnhphjbchtywuj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmdnFkdHJuaHBoamJjaHR5d3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNjk2NDcsImV4cCI6MjEwNTc0NTY0N30.4BTZTuXKammgxlC-AK5ApoH_8_orLOoswbjjIeh_2ZA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Função para testar a conectividade em tempo real com o banco de dados Supabase
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    // Tenta uma consulta simples na tabela de cenários ou perfis
    const { data, error } = await supabase
      .from('scenarios')
      .select('count', { count: 'exact', head: true });

    if (error) {
      // Se a tabela ainda não tiver dados ou houver restrição transitória, tentamos profiles
      const profileCheck = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (profileCheck.error) {
        return {
          success: false,
          message: `Erro ao conectar com o Supabase: ${profileCheck.error.message}`
        };
      }
    }

    return {
      success: true,
      message: 'Conexão com o Supabase estabelecida com sucesso!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Falha de rede ou configuração: ${err?.message || String(err)}`
    };
  }
}
