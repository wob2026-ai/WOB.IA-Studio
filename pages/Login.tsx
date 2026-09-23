
import React, { useState } from 'react';
import { cleanCPF, formatCPF } from '../utils/validators';
import { loginWithGooglePopup } from '../firebase';
import { DB } from '../db';
import { User } from '../types';

interface LoginProps {
  onLogin: (cpf: string, pass: string) => void;
  onLoginSuccess?: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onLoginSuccess }) => {
  const [cpf, setCpf] = useState('');
  const [pass, setPass] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    onLogin(cleanCPF(cpf), pass);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatCPF(e.target.value);
    setCpf(value);
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGooglePopup();
      const googleUser = result.user;
      
      if (!googleUser.email) {
        throw new Error('Não foi possível identificar o e-mail da sua conta Google.');
      }

      // Check if user already exists in DB
      let user = DB.users.findByEmail(googleUser.email) || DB.users.findById(`google-${googleUser.uid}`);

      if (user) {
        // Preserva o papel (role) que o administrador definiu anteriormente!
        const updatedUser: User = {
          ...user,
          name: googleUser.displayName || user.name,
          googlePhotoUrl: googleUser.photoURL || user.googlePhotoUrl,
          authProvider: 'google'
        };
        await DB.users.update(updatedUser);
        user = updatedUser;
      } else {
        // Novo usuário com conta Google - entra como usuário padrão ('tech'), ou superadmin se for o e-mail mestre
        const isMasterAdmin = googleUser.email.toLowerCase().trim() === 'wob2026@gmail.com';
        const newUser: User = {
          id: `google-${googleUser.uid}`,
          name: googleUser.displayName || googleUser.email.split('@')[0] || 'Colaborador Claro',
          login: googleUser.email,
          email: googleUser.email,
          cpf: '',
          uf: 'SP',
          city: 'São Paulo',
          role: isMasterAdmin ? 'superadmin' : 'tech',
          authProvider: 'google',
          googlePhotoUrl: googleUser.photoURL || undefined,
          createdAt: new Date().toISOString()
        };
        await DB.users.add(newUser);
        user = newUser;
      }

      // Registrar log de acesso
      await DB.accesses.add({
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        userName: user.name,
        timestamp: new Date().toISOString(),
        uf: user.uf || 'SP',
        city: user.city || 'São Paulo'
      });

      // Salvar sessão
      localStorage.setItem('explica_session', JSON.stringify(user));
      
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      console.error('Erro no login com Google:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('A janela de login com Google foi fechada antes da conclusão.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignore duplicate popup click
      } else {
        setErrorMsg(`Não foi possível conectar com o Google: ${err.message || 'Tente novamente.'}`);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center px-3 py-6 sm:py-10 animate-fadeIn">
      <div className="w-full max-w-md bg-white p-6 sm:p-10 rounded-[28px] sm:rounded-3xl shadow-xl border border-gray-100">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-4xl sm:text-5xl font-black claro-text-red tracking-tighter">Explica +</h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-2 sm:mt-3">Plataforma de Simulação & Avaliação com IA</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2 animate-shake">
            <svg className="w-4 h-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Botão de Login com Conta Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 active:scale-98 text-gray-700 font-bold rounded-2xl border border-gray-300 shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span className="text-xs uppercase tracking-wider">
            {isGoogleLoading ? 'Autenticando com Google...' : 'Entrar com Conta Google'}
          </span>
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <span className="relative px-3 bg-white text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            ou acesse com CPF
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">CPF</label>
            <input 
              type="text" 
              inputMode="numeric"
              placeholder="000.000.000-00"
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:claro-border-red focus:bg-white outline-none transition-all"
              value={cpf}
              onChange={handleCpfChange}
              maxLength={14}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Senha</label>
            <input 
              type="password" 
              placeholder="••••••••"
              className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:claro-border-red focus:bg-white outline-none transition-all"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full claro-red hover:bg-red-700 text-white font-bold py-4 rounded-full shadow-lg transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            ENTRAR
          </button>
        </form>

        {/* Acesso Rápido para Demonstração de Perfis */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-[10px] uppercase font-black tracking-widest text-gray-400 mb-3">
            Acesso Rápido por Perfil (Ambiente de Teste)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setCpf('111.222.333-01');
                setPass('claro');
                onLogin('11122233301', 'claro');
              }}
              className="py-2.5 px-2 bg-red-50 hover:bg-red-100 text-[#ee0000] rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border border-red-100 cursor-pointer active:scale-95"
            >
              Técnico
            </button>
            <button
              type="button"
              onClick={() => {
                setCpf('111.222.333-20');
                setPass('claro');
                onLogin('11122233320', 'claro');
              }}
              className="py-2.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border border-purple-100 cursor-pointer active:scale-95"
            >
              Comercial
            </button>
            <button
              type="button"
              onClick={() => {
                setCpf('000.000.000-00');
                setPass('admin');
                onLogin('00000000000', 'admin');
              }}
              className="py-2.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border border-gray-200 cursor-pointer active:scale-95"
            >
              Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
