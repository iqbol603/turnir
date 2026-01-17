import React, { useState, useEffect } from 'react';
import { BracketState, Match, Team } from '../types';
import { BracketColumn } from './BracketColumn';
import { MatchDetailsDrawer } from './MatchDetailsDrawer';
import { TeamEditorModal } from './TeamEditorModal';
import { createInitialBracket, updateMatchAndPropagate, resetBracket, propagateWinners, migrateBracketStructure } from '../bracketEngine';
import { saveBracketState, loadBracketState } from '../storage';
import './BracketPage.css';

const defaultTeams: Team[] = Array.from({ length: 16 }, (_, i) => ({
  id: `team-${i + 1}`,
  name: `Команда ${i + 1}`,
}));

export const BracketPage: React.FC = () => {
  const [bracketState, setBracketState] = useState<BracketState>(() => {
    const saved = loadBracketState();
    if (saved) {
      // Проверяем, есть ли матчи нижней сетки (Double Elimination)
      const hasLowerBracket = saved.matches.some(m => 
        m.round === 'LB1' || m.round === 'LB2' || m.round === 'LB3' || m.round === 'LB4' || m.round === 'LF' || m.round === 'GF'
      );
      const hasUpperFinal = saved.matches.some(m => m.round === 'UF');
      
      // Проверяем правильное количество матчей в LB3 (должно быть 3) и LB4 (должно быть 2)
      const lb3Matches = saved.matches.filter(m => m.round === 'LB3');
      const lb4Matches = saved.matches.filter(m => m.round === 'LB4');
      const hasCorrectStructure = lb3Matches.length === 3 && lb4Matches.length === 2;
      
      // Обновляем информацию о турнире
      const updatedState = {
        ...saved,
        tournamentName: 'Турнир по Counter-Strike 2 среди сотрудников Вавилон-Т и Вавилон-М',
        tournamentDates: '2026',
        organizer: 'Организатор отдел Маркетинг Вавилон-Т',
      };
      
      // Если нет нижней сетки или верхнего финала, пересоздаём сетку
      if (!hasLowerBracket || !hasUpperFinal) {
        return {
          ...updatedState,
          matches: createInitialBracket(saved.teams),
        };
      }
      
      // Если структура неправильная (не хватает матчей), мигрируем с сохранением результатов
      if (!hasCorrectStructure) {
        return {
          ...updatedState,
          matches: migrateBracketStructure(saved.matches, saved.teams),
        };
      }
      
      return updatedState;
    }
    return {
      teams: defaultTeams,
      matches: createInitialBracket(defaultTeams),
      tournamentName: 'турнир по Counter-Strike 2 среди сотрудников Вавилон-Т и Вавилон-М',
      tournamentDates: '2026',
      organizer: 'Организатор отдел Маркетинг Вавилон-Т',
    };
  });

  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isTeamEditorOpen, setIsTeamEditorOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('admin') === '1';
  });

  // Сохраняем состояние при изменении
  useEffect(() => {
    // Сохраняем всегда, чтобы применить миграцию данных
    if (bracketState.matches.length > 0) {
      saveBracketState(bracketState);
    }
  }, [bracketState]);

  const handleMatchClick = (match: Match) => {
    console.log('🖱️ Клик по матчу:', match.id, match.round);
    setSelectedMatch(match);
    setIsDetailsOpen(true);
    console.log('✅ Модальное окно должно открыться');
  };

  const handleMatchUpdate = (matchId: string, updates: Partial<Match>) => {
    console.log('🔄 Обновление матча:', { matchId, updates });
    
    try {
      const updatedMatches = updateMatchAndPropagate(
        bracketState.matches,
        matchId,
        updates
      );
      
      const newState = {
        ...bracketState,
        matches: updatedMatches,
      };
      
      console.log('✅ Состояние обновлено:', newState);
      setBracketState(newState);
      
      // Обновляем выбранный матч, чтобы изменения отображались сразу
      const updatedMatch = updatedMatches.find(m => m.id === matchId);
      if (updatedMatch) {
        console.log('✅ Матч обновлён:', updatedMatch);
        setSelectedMatch(updatedMatch);
      }
    } catch (error) {
      console.error('❌ Ошибка при обновлении матча:', error);
      alert('Ошибка при сохранении: ' + (error as Error).message);
    }
  };

  const handleTeamsSave = (teams: Team[]) => {
    const newMatches = createInitialBracket(teams);
    setBracketState({
      ...bracketState,
      teams,
      matches: newMatches,
    });
  };

  const handleResetBracket = () => {
    if (confirm('Вы уверены, что хотите сбросить все счёты и победителей?')) {
      const resetMatches = resetBracket(bracketState.matches);
      setBracketState({
        ...bracketState,
        matches: resetMatches,
      });
    }
  };

  const handleExportJSON = () => {
    const json = JSON.stringify(bracketState, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      alert('Состояние сетки скопировано в буфер обмена!');
    }).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = json;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Состояние сетки скопировано в буфер обмена!');
    });
  };

  const handleImportJSON = () => {
    const json = prompt('Вставьте JSON состояние сетки:');
    if (json) {
      try {
        const imported = JSON.parse(json) as BracketState;
        if (imported.teams && imported.matches) {
          // Проверяем структуру и мигрируем при необходимости
          const lb3Matches = imported.matches.filter(m => m.round === 'LB3');
          const lb4Matches = imported.matches.filter(m => m.round === 'LB4');
          const hasCorrectStructure = lb3Matches.length === 3 && lb4Matches.length === 2;
          
          let finalMatches = imported.matches;
          if (!hasCorrectStructure) {
            // Мигрируем структуру с сохранением результатов
            finalMatches = migrateBracketStructure(imported.matches, imported.teams);
          } else {
            // Просто пересчитываем распространение команд
            finalMatches = propagateWinners(imported.matches);
          }
          
          setBracketState({
            ...imported,
            matches: finalMatches,
            tournamentName: imported.tournamentName || 'Турнир по Counter-Strike 2 среди сотрудников Вавилон-Т и Вавилон-М',
            tournamentDates: imported.tournamentDates || '2026',
            organizer: imported.organizer || 'Организатор отдел Маркетинг Вавилон-Т',
          });
          alert('Состояние сетки успешно импортировано! Структура автоматически обновлена.');
        } else {
          alert('Неверный формат состояния сетки');
        }
      } catch (error) {
        alert('Ошибка при разборе JSON: ' + error);
      }
    }
  };

  const toggleAdmin = () => {
    const newAdmin = !isAdmin;
    setIsAdmin(newAdmin);
    const url = new URL(window.location.href);
    if (newAdmin) {
      url.searchParams.set('admin', '1');
    } else {
      url.searchParams.delete('admin');
    }
    window.history.pushState({}, '', url);
  };

  return (
    <div className="bracket-page">
      <header className="tournament-header">
        <div className="header-content">
          <h1>{bracketState.tournamentName || 'турнир по Counter-Strike 2 среди сотрудников Вавилон-Т и Вавилон-М'}</h1>
          <div className="header-info">
            {bracketState.tournamentDates && (
              <span className="tournament-dates">{bracketState.tournamentDates}</span>
            )}
            {bracketState.organizer && (
              <span className="tournament-organizer">{bracketState.organizer}</span>
            )}
          </div>
        </div>
      </header>

      <div className="controls-panel">
        <div className="controls-left">
          <button
            onClick={toggleAdmin}
            className={`admin-toggle ${isAdmin ? 'active' : ''}`}
          >
            {isAdmin ? '👑 Режим администратора' : '👁️ Режим просмотра'}
          </button>
        </div>
        <div className="controls-right">
          {isAdmin && (
            <>
              <button
                onClick={() => setIsTeamEditorOpen(true)}
                className="control-button"
              >
                Редактировать команды
              </button>
              <button
                onClick={handleResetBracket}
                className="control-button"
              >
                Сбросить сетку
              </button>
            </>
          )}
          <button
            onClick={handleExportJSON}
            className="control-button"
          >
            Экспорт JSON
          </button>
          {isAdmin && (
            <button
              onClick={handleImportJSON}
              className="control-button"
            >
              Импорт JSON
            </button>
          )}
        </div>
      </div>

      <div className="brackets-wrapper">
        <div className="bracket-section">
          <h2 className="bracket-title">Верхняя сетка</h2>
          <div className="bracket-container upper-bracket">
            <BracketColumn
              round="R16"
              matches={bracketState.matches}
              teams={bracketState.teams}
              onMatchClick={handleMatchClick}
            />
            <BracketColumn
              round="QF"
              matches={bracketState.matches}
              teams={bracketState.teams}
              onMatchClick={handleMatchClick}
            />
            <BracketColumn
              round="SF"
              matches={bracketState.matches}
              teams={bracketState.teams}
              onMatchClick={handleMatchClick}
            />
            <BracketColumn
              round="UF"
              matches={bracketState.matches}
              teams={bracketState.teams}
              onMatchClick={handleMatchClick}
            />
          </div>
        </div>

        <div className="bracket-section">
          <h2 className="bracket-title">Нижняя сетка</h2>
          <div className="bracket-container lower-bracket">
            <BracketColumn
              round="LB1"
              matches={bracketState.matches}
              teams={bracketState.teams}
              onMatchClick={handleMatchClick}
            />
            <BracketColumn
              round="LB2"
              matches={bracketState.matches}
              teams={bracketState.teams}
              onMatchClick={handleMatchClick}
            />
            <BracketColumn
              round="LB3"
              matches={bracketState.matches}
              teams={bracketState.teams}
              onMatchClick={handleMatchClick}
            />
            <BracketColumn
              round="LB4"
              matches={bracketState.matches}
              teams={bracketState.teams}
              onMatchClick={handleMatchClick}
            />
            <BracketColumn
              round="LF"
              matches={bracketState.matches}
              teams={bracketState.teams}
              onMatchClick={handleMatchClick}
            />
          </div>
        </div>

        <div className="bracket-section grand-final-section">
          <h2 className="bracket-title">Гранд-финал</h2>
          <div className="bracket-container grand-final">
            <BracketColumn
              round="GF"
              matches={bracketState.matches}
              teams={bracketState.teams}
              onMatchClick={handleMatchClick}
            />
          </div>
        </div>
      </div>

      <MatchDetailsDrawer
        match={selectedMatch}
        teams={bracketState.teams}
        isOpen={isDetailsOpen}
        isAdmin={isAdmin}
        onClose={() => setIsDetailsOpen(false)}
        onUpdate={handleMatchUpdate}
      />

      <TeamEditorModal
        teams={bracketState.teams}
        isOpen={isTeamEditorOpen && isAdmin}
        onClose={() => setIsTeamEditorOpen(false)}
        onSave={handleTeamsSave}
      />
    </div>
  );
};

