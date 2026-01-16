import React, { useState } from 'react';
import { Team } from '../types';
import './TeamEditorModal.css';

interface TeamEditorModalProps {
  teams: Team[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (teams: Team[]) => void;
}

export const TeamEditorModal: React.FC<TeamEditorModalProps> = ({
  teams,
  isOpen,
  onClose,
  onSave,
}) => {
  const [editedTeams, setEditedTeams] = useState<Team[]>(teams);

  React.useEffect(() => {
    if (isOpen) {
      setEditedTeams(teams);
    }
  }, [isOpen, teams]);

  const handleTeamChange = (index: number, field: keyof Team, value: string) => {
    const updated = [...editedTeams];
    updated[index] = { ...updated[index], [field]: value };
    setEditedTeams(updated);
  };

  const handleAddTeam = () => {
    if (editedTeams.length < 16) {
      setEditedTeams([
        ...editedTeams,
        { id: `team-${Date.now()}`, name: `Команда ${editedTeams.length + 1}` },
      ]);
    }
  };

  const handleRemoveTeam = (index: number) => {
    if (editedTeams.length > 0) {
      const updated = editedTeams.filter((_, i) => i !== index);
      setEditedTeams(updated);
    }
  };

  const handleSave = () => {
    if (editedTeams.length === 16) {
      onSave(editedTeams);
      onClose();
    } else {
      alert('Должно быть ровно 16 команд');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редактировать команды</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="teams-list">
            {editedTeams.map((team, index) => (
              <div key={team.id} className="team-editor-row">
                <div className="team-number">{index + 1}</div>
                <input
                  type="text"
                  value={team.name}
                  onChange={(e) => handleTeamChange(index, 'name', e.target.value)}
                  className="team-name-input"
                  placeholder="Название команды"
                />
                <input
                  type="url"
                  value={team.logoUrl || ''}
                  onChange={(e) => handleTeamChange(index, 'logoUrl', e.target.value)}
                  className="team-logo-input"
                  placeholder="URL логотипа (необязательно)"
                />
                <button
                  onClick={() => handleRemoveTeam(index)}
                  className="remove-team-button"
                  disabled={editedTeams.length <= 0}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {editedTeams.length < 16 && (
            <button onClick={handleAddTeam} className="add-team-button">
              + Добавить команду (осталось {16 - editedTeams.length})
            </button>
          )}

          <div className="modal-footer">
            <div className="team-count">
              Команды: {editedTeams.length} / 16
            </div>
            <div className="modal-actions">
              <button onClick={onClose} className="cancel-button">Отмена</button>
              <button
                onClick={handleSave}
                className="save-button"
                disabled={editedTeams.length !== 16}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

