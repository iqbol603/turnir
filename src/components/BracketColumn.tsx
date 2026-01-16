import React from 'react';
import { Match, Team, Round } from '../types';
import { MatchCard } from './MatchCard';
import './BracketColumn.css';

interface BracketColumnProps {
  round: Round;
  matches: Match[];
  teams: Team[];
  onMatchClick: (match: Match) => void;
}

const roundLabels: Record<Round, string> = {
  R16: '1/8 финала',
  QF: 'Четвертьфинал',
  SF: 'Полуфинал',
  UF: 'Финал верхней',
  LB1: 'Нижняя 1',
  LB2: 'Нижняя 2',
  LB3: 'Нижняя 3',
  LB4: 'Нижняя 4',
  LF: 'Финал нижней',
  GF: 'Гранд-финал',
};

export const BracketColumn: React.FC<BracketColumnProps> = ({
  round,
  matches,
  teams,
  onMatchClick,
}) => {
  const roundMatches = matches
    .filter(m => m.round === round)
    .sort((a, b) => a.index - b.index);

  const getTeam = (teamId?: string | null): Team | undefined => {
    if (!teamId) return undefined;
    return teams.find(t => t.id === teamId);
  };

  // Если матчей нет, показываем сообщение
  if (roundMatches.length === 0) {
    return (
      <div className="bracket-column">
        <div className="round-header">
          <h3>{roundLabels[round]}</h3>
          <span className="round-label">{round}</span>
        </div>
        <div className="matches-container">
          <div className="empty-matches-message">Матчи не найдены</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bracket-column">
      <div className="round-header">
        <h3>{roundLabels[round]}</h3>
        <span className="round-label">{round}</span>
      </div>
      <div className="matches-container">
        {roundMatches.map(match => (
          <MatchCard
            key={match.id}
            match={match}
            teamA={getTeam(match.teamAId)}
            teamB={getTeam(match.teamBId)}
            onClick={() => onMatchClick(match)}
          />
        ))}
      </div>
    </div>
  );
};

