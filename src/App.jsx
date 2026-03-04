import React, { useState, useEffect, useCallback } from 'react';
import { Toaster } from '@/components/ui/toaster';
import LoginPage from '@/pages/LoginPage';
import FormPage from '@/pages/FormPage';
import AdminDashboard from '@/pages/AdminDashboard';
import SearchModal from '@/components/SearchModal';
import InsightsModal from '@/components/insights/InsightsModal';
import UserManagementModal from '@/components/UserManagementModal';
import SupervisorChatModal from '@/components/SupervisorChatModal';
import RescueModal from '@/components/RescueModal';
import { testConnection, supabase } from '@/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { initialFormData } from '@/constants';
import { useDataMigrator } from '@/hooks/useDataMigrator';
import { useSupabaseChannels } from '@/hooks/useSupabaseChannels';

import { Sun, Moon } from 'lucide-react';

/* ✅ Hook dinâmico */
const useDynamicMeta = () => {
  const [dinamiqueConfig, setDinamiqueConfig] = useState({
    titulo: 'Sistema Multinegociações',
    descricao: 'Sistema de cadastro Multinegociações V2',
    favicon_url: 'https://i.ibb.co/MDBrt4hb/favicon.png',
    nome_projeto: 'Multinegociações',
  });

  useEffect(() => {
    const carregarDinamique = async () => {
      try {
        const { data, error } = await supabase
          .from('dinamique')
          .select('*')
          .limit(1)
          .single();

        if (error || !data) {
          aplicarMeta(dinamiqueConfig);
          return;
        }

        setDinamiqueConfig(data);
        aplicarMeta(data);
      } catch {
        aplicarMeta(dinamiqueConfig);
      }
    };

    const aplicarMeta = (config) => {
      document.title = config.titulo || 'Sistema';

      let metaDesc = document.querySelector("meta[name='description']");
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', config.descricao);

      let favicon = document.querySelector("link[rel='icon']");
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.setAttribute('rel', 'icon');
        document.head.appendChild(favicon);
      }

      favicon.setAttribute('type', 'image/png');
      favicon.setAttribute('href', config.favicon_url);
    };

    carregarDinamique();
  }, []);

  return dinamiqueConfig;
};

const App = () => {

  /* 🌗 SISTEMA DE TEMA */

  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    setDarkMode(isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  /* 🧠 ESTADOS */

  const [currentScreen, setCurrentScreen] = useState('login');
  const [userInfo, setUserInfo] = useState(null);

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showUserManagementModal, setShowUserManagementModal] = useState(false);
  const [showSupervisorChatModal, setShowSupervisorChatModal] = useState(false);
  const [showRescueModal, setShowRescueModal] = useState(false);

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  const [logoConfig, setLogoConfig] = useState({
    enabled: false,
    url: '',
    height: 30
  });

  const [editingCadastro, setEditingCadastro] = useState(null);

  const { toast } = useToast();

  useDynamicMeta();

  useDataMigrator(userInfo);

  const { presenceChannel, chatChannel } =
    useSupabaseChannels(userInfo, setHasUnreadMessages);

  /* 🔌 TESTE SUPABASE */

  useEffect(() => {

    const checkSupabaseConnection = async () => {

      if (supabase) {

        const connected = await testConnection();

        if (connected) {
          toast({
            title: 'Supabase Conectado!',
            description: 'Conexão com o banco estabelecida.',
          });
        }

      } else {

        toast({
          title: 'Supabase Não Configurado',
          description: 'O app usará localStorage como fallback.',
          variant: 'destructive',
        });

      }

    };

    checkSupabaseConnection();

  }, [toast]);

  /* 🔐 LOGIN */

  const handleLogin = (loginData) => {

    const defaultPermissions = {
      pode_ver_todos_cadastros: false,
      pode_ver_cadastros: true,
      pode_ver_insights: false,
      pode_gerenciar_usuarios: false,
      pode_ver_chat_supervisores: false,
      pode_ver_usuarios_ativos: false,
      pode_ver_log_atividades: false,
      pode_usar_funcao_resgate: false,
    };

    let permissions = loginData.permissoes || defaultPermissions;

    if (loginData.tipo_acesso === 'admin') {

      permissions = Object.fromEntries(
        Object.keys(defaultPermissions).map((key) => [key, true])
      );

    }

    setUserInfo({ ...loginData, permissoes: permissions });

    setCurrentScreen('admin_dashboard');

    setEditingCadastro(null);

  };

  /* 🚪 LOGOUT */

  const handleLogout = async () => {

    try {

      if (presenceChannel) await supabase.removeChannel(presenceChannel);
      if (chatChannel) await supabase.removeChannel(chatChannel);

      localStorage.clear();

      setHasUnreadMessages(false);
      setEditingCadastro(null);

      setShowInsightsModal(false);
      setShowSearchModal(false);
      setShowRescueModal(false);
      setShowUserManagementModal(false);
      setShowSupervisorChatModal(false);

      setUserInfo(null);
      setCurrentScreen('login');

    } catch {

      toast({
        title: 'Erro ao sair',
        description: 'Algo inesperado ocorreu.',
        variant: 'destructive',
      });

    }

  };

  /* ⚙️ MODAIS */

  const handleShowSearch = () => setShowSearchModal(true);

  const handleShowInsights = () => setShowInsightsModal(true);

  const handleShowUserManagement = () => setShowUserManagementModal(true);

  const handleShowRescueModal = () => setShowRescueModal(true);

  const handleShowSupervisorChat = () => {

    setShowSupervisorChatModal(true);

    setHasUnreadMessages(false);

    localStorage.setItem(
      'lastSeenChatTimestamp',
      new Date().toISOString()
    );

  };

  /* ✏️ EDIÇÃO CADASTRO */

  const handleEditCadastroRequest = useCallback(

    (cadastroData) => {

      const mappedData = {};

      for (const key in initialFormData)
        mappedData[key] = cadastroData[key] || initialFormData[key];

      if (userInfo) {

        mappedData.vendedor =
          cadastroData.vendedor || userInfo.vendedor;

        mappedData.equipe =
          cadastroData.equipe || userInfo.equipe;

      }

      setEditingCadastro(mappedData);

      setCurrentScreen('form');

      setShowSearchModal(false);

      toast({
        title: 'Modo de Edição',
        description:
          `Editando cadastro: ${cadastroData.codigo_cadastro || 'Novo Cadastro'}`,
      });

    },

    [userInfo, toast]

  );

  const handleNavigateToForm = () => {

    setEditingCadastro(null);

    setCurrentScreen('form');

  };

  const handleFormSubmissionSuccess = () => {

    setEditingCadastro(null);

    if (userInfo?.tipo_acesso)
      setCurrentScreen('admin_dashboard');

  };

  const handleBackToDashboard = () => {

    setEditingCadastro(null);

    setCurrentScreen('admin_dashboard');

  };

  /* 🖥️ RENDER SCREEN */

  const renderScreen = () => {

    switch (currentScreen) {

      case 'login':

        return <LoginPage onLogin={handleLogin} />;

      case 'form':

        return (

          <FormPage
            userInfo={userInfo}
            onLogout={handleLogout}
            logoConfig={logoConfig}
            initialDataForEdit={editingCadastro}
            onSubmissionSuccess={handleFormSubmissionSuccess}
            onBackToDashboard={handleBackToDashboard}
          />

        );

      case 'admin_dashboard':

        if (!userInfo)
          return <LoginPage onLogin={handleLogin} />;

        return (

          <AdminDashboard
            userInfo={userInfo}
            onLogout={handleLogout}
            onShowSearch={handleShowSearch}
            onShowInsights={handleShowInsights}
            onNavigateToForm={handleNavigateToForm}
            onShowUserManagement={handleShowUserManagement}
            onShowSupervisorChat={handleShowSupervisorChat}
            onShowRescueModal={handleShowRescueModal}
            hasUnreadMessages={hasUnreadMessages}
            presenceChannel={presenceChannel}
          />

        );

      default:

        return <LoginPage onLogin={handleLogin} />;

    }

  };

  /* 🌐 RENDER */

  return (

    <main className="min-h-screen bg-background text-foreground relative">

      {/* BOTÃO TEMA */}

      <div className="absolute top-4 right-4 z-50">

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border bg-card hover:scale-105 transition"
        >

          {darkMode ? <Sun size={18}/> : <Moon size={18}/>}

        </button>

      </div>

      {renderScreen()}

      {/* MODAIS */}

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        logoConfig={logoConfig}
        onEditCadastro={handleEditCadastroRequest}
        userInfo={userInfo}
      />

      <RescueModal
        isOpen={showRescueModal}
        onClose={() => setShowRescueModal(false)}
        userInfo={userInfo}
      />

      <InsightsModal
        isOpen={showInsightsModal}
        onClose={() => setShowInsightsModal(false)}
      />

      <UserManagementModal
        isOpen={showUserManagementModal}
        onClose={() => setShowUserManagementModal(false)}
        currentUser={userInfo}
      />

      {(userInfo?.tipo_acesso === 'admin' ||
        userInfo?.permissoes?.pode_ver_chat_supervisores) && (

        <SupervisorChatModal
          isOpen={showSupervisorChatModal}
          onClose={() => {

            setShowSupervisorChatModal(false);
            setHasUnreadMessages(false);

            localStorage.setItem(
              'lastSeenChatTimestamp',
              new Date().toISOString()
            );

          }}
          userInfo={userInfo}
        />

      )}

      <Toaster />

    </main>

  );

};

export default App;
