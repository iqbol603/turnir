import React from 'react';
import { Match, Team } from '../types';
import './MatchCard.css';

interface MatchCardProps {
  match: Match;
  teamA?: Team;
  teamB?: Team;
  onClick: () => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, teamA, teamB, onClick }) => {
  const getStatusColor = () => {
    switch (match.status) {
      case 'live':
        return '#ff4444';
      case 'done':
        return '#44ff44';
      default:
        return '#888';
    }
  };

  const getStatusText = () => {
    switch (match.status) {
      case 'live':
        return 'В ПРЯМОМ ЭФИРЕ';
      case 'done':
        return 'ЗАВЕРШЁН';
      default:
        return 'ЗАПЛАНИРОВАН';
    }
  };

  const isWinner = (teamId?: string | null) => {
    if (!teamId || !match.winnerId) return false;
    return match.winnerId === teamId;
  };

  return (
    <div 
      className="match-card" 
      onClick={(e) => {
        e.stopPropagation();
        console.log('🖱️ Клик по карточке матча');
        onClick();
      }}
    >
      <div className="match-status" style={{ backgroundColor: getStatusColor() }}>
        {getStatusText()}
      </div>
      
      <div className="match-teams">
        <div className={`team-row ${isWinner(teamA?.id) ? 'winner' : ''}`}>
          <div className="team-name">
            {teamA?.logoUrl && (
              <img src={teamA.logoUrl} alt={teamA.name} className="team-logo" />
            )}
            <span>{teamA?.name || 'TBD'}</span>
          </div>
          <div className="team-score">
            {match.scoreA !== null && match.scoreA !== undefined ? match.scoreA : '-'}
          </div>
        </div>
        
        <div className="match-vs">ПРОТИВ</div>
        
        <div className={`team-row ${isWinner(teamB?.id) ? 'winner' : ''}`}>
          <div className="team-name">
            {teamB?.logoUrl && (
              <img src={teamB.logoUrl} alt={teamB.name} className="team-logo" />
            )}
            <span>{teamB?.name || 'TBD'}</span>
          </div>
          <div className="team-score">
            {match.scoreB !== null && match.scoreB !== undefined ? match.scoreB : '-'}
          </div>
        </div>
      </div>
      
      <div className="match-info">
        <span className="best-of">BO{match.bestOf}</span>
        {match.map && <span className="map">{match.map}</span>}
      </div>
    </div>
  );
};

