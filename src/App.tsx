import React, { useState, useEffect } from 'react';
import {
  Atleta,
  BateriaMoto,
  Categoria,
  ClubeEquipe,
  Inscricao,
  ProvaEvento,
  Ranking,
  TransponderValidationLog,
  UserRole,
} from './types/bmx';
import {
  ATLETAS_INICIAIS,
  BATERIAS_DEMO,
  CATEGORIAS_INICIAIS,
  CLUBES_INICIAIS,
  INSCRICOES_INICIAIS,
  PROVAS_INICIAIS,
  RANKINGS_INICIAIS,
  TRANSPONDER_LOGS_DEMO,
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { AuthLoginModal } from './components/Auth/AuthLoginModal';
import { RaceEngineSQORZ } from './components/Admin/RaceEngineSQORZ';
import { TransponderBooth } from './components/Admin/TransponderBooth';
import { CompetitionsManager } from './components/Admin/CompetitionsManager';
import { RankingsManager } from './components/Admin/RankingsManager';
import { CategoriesManager } from './components/Admin/CategoriesManager';
import { DirigentePortal } from './components/Dirigente/DirigentePortal';
import { AtletaPortal } from './components/Atleta/AtletaPortal';
import { LiveScoreboard } from './components/Public/LiveScoreboard';
import { SpectatorsPortal } from './components/Public/SpectatorsPortal';
import { AthletesList } from './components/Admin/AthletesList';
import { ClubsManager } from './components/Admin/ClubsManager';
import { BackupsIntegridadeManager } from './components/Admin/BackupsIntegridadeManager';

export default function App() {
  // Check URL parameters for direct spectator link (e.g. ?modo=espectadores)
  const queryParams = new URLSearchParams(window.location.search);
  const isPublicSpectatorMode =
    queryParams.get('modo') === 'espectadores' ||
    queryParams.get('public') === 'true' ||
    queryParams.get('espectador') === 'true';

  const [currentRole, setCurrentRole] = useState<UserRole | 'ESPECTADOR'>(
    isPublicSpectatorMode ? 'ESPECTADOR' : 'ADMIN'
  );
  const [activeTab, setActiveTab] = useState<string>(
    isPublicSpectatorMode ? 'espectadores' : 'motor-provas'
  );
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Core Persistent State
  const [categorias, setCategorias] = useState<Categoria[]>(() => {
    const saved = localStorage.getItem('bmx_categorias');
    return saved ? JSON.parse(saved) : CATEGORIAS_INICIAIS;
  });

  const [clubes, setClubes] = useState<ClubeEquipe[]>(() => {
    const saved = localStorage.getItem('bmx_clubes');
    return saved ? JSON.parse(saved) : CLUBES_INICIAIS;
  });

  const [atletas, setAtletas] = useState<Atleta[]>(() => {
    const saved = localStorage.getItem('bmx_atletas');
    return saved ? JSON.parse(saved) : ATLETAS_INICIAIS;
  });

  const [rankings, setRankings] = useState<Ranking[]>(() => {
    const saved = localStorage.getItem('bmx_rankings');
    return saved ? JSON.parse(saved) : RANKINGS_INICIAIS;
  });

  const [provas, setProvas] = useState<ProvaEvento[]>(() => {
    const saved = localStorage.getItem('bmx_provas');
    return saved ? JSON.parse(saved) : PROVAS_INICIAIS;
  });

  const [inscricoes, setInscricoes] = useState<Inscricao[]>(() => {
    const saved = localStorage.getItem('bmx_inscricoes');
    return saved ? JSON.parse(saved) : INSCRICOES_INICIAIS;
  });

  const [baterias, setBaterias] = useState<BateriaMoto[]>(() => {
    const saved = localStorage.getItem('bmx_baterias');
    return saved ? JSON.parse(saved) : BATERIAS_DEMO;
  });

  const [transponderLogs, setTransponderLogs] = useState<TransponderValidationLog[]>(() => {
    const saved = localStorage.getItem('bmx_transponder_logs');
    return saved ? JSON.parse(saved) : TRANSPONDER_LOGS_DEMO;
  });

  const [authenticatedAthleteId, setAuthenticatedAthleteId] = useState<string | null>(() => {
    return localStorage.getItem('bmx_auth_athlete_id') || null;
  });

  // LocalStorage Persist Effect
  useEffect(() => {
    localStorage.setItem('bmx_categorias', JSON.stringify(categorias));
    localStorage.setItem('bmx_clubes', JSON.stringify(clubes));
    localStorage.setItem('bmx_atletas', JSON.stringify(atletas));
    localStorage.setItem('bmx_rankings', JSON.stringify(rankings));
    localStorage.setItem('bmx_provas', JSON.stringify(provas));
    localStorage.setItem('bmx_inscricoes', JSON.stringify(inscricoes));
    localStorage.setItem('bmx_baterias', JSON.stringify(baterias));
    localStorage.setItem('bmx_transponder_logs', JSON.stringify(transponderLogs));
    if (authenticatedAthleteId) {
      localStorage.setItem('bmx_auth_athlete_id', authenticatedAthleteId);
    } else {
      localStorage.removeItem('bmx_auth_athlete_id');
    }
  }, [categorias, clubes, atletas, rankings, provas, inscricoes, baterias, transponderLogs, authenticatedAthleteId]);

  // Handle Login Role Success
  const handleLoginSuccess = (
    role: UserRole | 'ESPECTADOR',
    details?: { clubId?: string; athleteId?: string }
  ) => {
    setCurrentRole(role);
    if (role === 'ADMIN') setActiveTab('motor-provas');
    else if (role === 'DIRIGENTE') setActiveTab('equipe-dirigente');
    else if (role === 'ATLETA') {
      if (details?.athleteId) {
        setAuthenticatedAthleteId(details.athleteId);
      }
      setActiveTab('painel-atleta');
    } else setActiveTab('espectadores');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-400 selection:text-slate-950">
      {/* Navigation Header */}
      <Navbar
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenLoginModal={() => setIsAuthModalOpen(true)}
      />

      {/* Login / Auth Modal */}
      <AuthLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentRole={currentRole}
        onLoginSuccess={handleLoginSuccess}
        clubes={clubes}
        atletas={atletas}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* ADMIN TAB VIEWS */}
        {currentRole === 'ADMIN' && activeTab === 'motor-provas' && (
          <RaceEngineSQORZ
            provas={provas}
            setProvas={setProvas}
            categorias={categorias}
            inscricoes={inscricoes}
            setInscricoes={setInscricoes}
            baterias={baterias}
            setBaterias={setBaterias}
          />
        )}

        {currentRole === 'ADMIN' && activeTab === 'transponder-booth' && (
          <TransponderBooth
            inscricoes={inscricoes}
            setInscricoes={setInscricoes}
            transponderLogs={transponderLogs}
            setTransponderLogs={setTransponderLogs}
          />
        )}

        {activeTab === 'provas' && (
          <CompetitionsManager
            provas={provas}
            setProvas={setProvas}
            rankings={rankings}
            categorias={categorias}
          />
        )}

        {currentRole === 'ADMIN' && activeTab === 'inscricoes' && (
          <AthletesList
            inscricoes={inscricoes}
            setInscricoes={setInscricoes}
            provas={provas}
            categorias={categorias}
            atletas={atletas}
            setAtletas={setAtletas}
            clubes={clubes}
          />
        )}

        {currentRole === 'ADMIN' && activeTab === 'clubes' && (
          <ClubsManager clubes={clubes} setClubes={setClubes} />
        )}

        {activeTab === 'rankings' && (
          <RankingsManager
            rankings={rankings}
            setRankings={setRankings}
            provas={provas}
            categorias={categorias}
            inscricoes={inscricoes}
          />
        )}

        {currentRole === 'ADMIN' && activeTab === 'categorias' && (
          <CategoriesManager
            categorias={categorias}
            setCategorias={setCategorias}
          />
        )}

        {currentRole === 'ADMIN' && activeTab === 'backups-integridade' && (
          <BackupsIntegridadeManager
            categorias={categorias}
            setCategorias={setCategorias}
            clubes={clubes}
            setClubes={setClubes}
            atletas={atletas}
            setAtletas={setAtletas}
            rankings={rankings}
            setRankings={setRankings}
            provas={provas}
            setProvas={setProvas}
            inscricoes={inscricoes}
            setInscricoes={setInscricoes}
            baterias={baterias}
            setBaterias={setBaterias}
            transponderLogs={transponderLogs}
            setTransponderLogs={setTransponderLogs}
          />
        )}

        {/* DIRIGENTE TAB VIEWS */}
        {currentRole === 'DIRIGENTE' &&
          (activeTab === 'equipe-dirigente' || activeTab === 'inscrever-equipe') && (
            <DirigentePortal
              clubes={clubes}
              setClubes={setClubes}
              atletas={atletas}
              setAtletas={setAtletas}
              provas={provas}
              categorias={categorias}
              inscricoes={inscricoes}
              setInscricoes={setInscricoes}
            />
          )}

        {/* ATLETA TAB VIEWS */}
        {currentRole === 'ATLETA' && activeTab === 'painel-atleta' && (
          <AtletaPortal
            atletas={atletas}
            baterias={baterias}
            inscricoes={inscricoes}
            rankings={rankings}
            authenticatedAthleteId={authenticatedAthleteId}
            onLogoutAthlete={() => {
              setAuthenticatedAthleteId(null);
              localStorage.removeItem('bmx_auth_athlete_id');
            }}
            onAthleteLoginSuccess={(id) => {
              setAuthenticatedAthleteId(id);
              localStorage.setItem('bmx_auth_athlete_id', id);
            }}
          />
        )}

        {/* PUBLIC & SPECTATOR TAB VIEWS */}
        {activeTab === 'placar-ao-vivo' && (
          <LiveScoreboard
            provas={provas}
            categorias={categorias}
            baterias={baterias}
          />
        )}

        {activeTab === 'espectadores' && (
          <SpectatorsPortal
            provas={provas}
            categorias={categorias}
            inscricoes={inscricoes}
            baterias={baterias}
            clubes={clubes}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-tr from-emerald-500 via-amber-400 to-blue-600 flex items-center justify-center font-black text-slate-950 text-[10px]">
              BMX
            </div>
            <span className="font-bold text-white">BMX BRASIL © 2026</span>
            <span>— Sistema Oficial de Provas, Transponders e Rankings</span>
          </div>

          <div className="flex items-center space-x-4 text-slate-400">
            <button onClick={() => setIsAuthModalOpen(true)} className="hover:text-amber-400">
              🔑 Área Restrita / Login
            </button>
            <span>•</span>
            <button onClick={() => { setActiveTab('espectadores'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-amber-400">
              👀 Espectadores
            </button>
            <span>•</span>
            <span className="hover:text-amber-400 cursor-pointer">União Ciclística Internacional (UCI)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
