import React, { useState, useEffect } from 'react';
import { Match, Team, MatchStatus, BestOf } from '../types';
import { queryServerInfo, parseServerAddress, extractScoreFromServerInfo } from '../utils/serverQuery';
import './MatchDetailsDrawer.css';

interface MatchDetailsDrawerProps {
  match: Match | null;
  teams: Team[];
  isOpen: boolean;
  isAdmin: boolean;
  onClose: () => void;
  onUpdate: (matchId: string, updates: Partial<Match>) => void;
}

const statusOptions: MatchStatus[] = ['scheduled', 'live', 'done'];
const bestOfOptions: BestOf[] = [1, 3, 5];
const mapOptions = ['Mirage', 'Inferno', 'Dust2', 'Overpass', 'Nuke', 'Vertigo', 'Ancient', 'Anubis'];

export const MatchDetailsDrawer: React.FC<MatchDetailsDrawerProps> = ({
  match,
  teams,
  isOpen,
  isAdmin,
  onClose,
  onUpdate,
}) => {
  const [formData, setFormData] = useState<Partial<Match>>({});
  const [isQueryingServer, setIsQueryingServer] = useState(false);
  const [serverInfo, setServerInfo] = useState<string | null>(null);

  // Все хуки должны быть до раннего return!
  useEffect(() => {
    if (match) {
      console.log('📝 Загрузка данных матча в форму:', match);
      setFormData({ ...match });
    }
  }, [match]);

  useEffect(() => {
    if (isOpen && match) {
      console.log('📂 Модальное окно открыто:', match.id);
      // Блокируем скролл страницы когда модалка открыта
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, match]);

  // Ранний return только после всех хуков!
  if (!match) {
    console.log('⚠️ Матч не выбран');
    return null;
  }

  const teamA = teams.find(t => t.id === match.teamAId);
  const teamB = teams.find(t => t.id === match.teamBId);

  const handleFieldChange = (field: keyof Match, value: any) => {
    const updates = { [field]: value };
    const newFormData = { ...formData, ...updates };
    setFormData(newFormData);
    // Не применяем изменения сразу, только обновляем форму
  };

  const handleSave = () => {
    if (isAdmin && match) {
      // Применяем все изменения из formData, объединяя с существующим матчем
      // Создаём объект обновлений, включая все поля из formData
      const updates: Partial<Match> = {};
      
      // Копируем все поля из formData, которые были изменены
      (Object.keys(formData) as Array<keyof Match>).forEach(key => {
        const value = formData[key];
        // Включаем все значения, даже если они null или пустые строки
        if (value !== undefined) {
          updates[key] = value as any;
        }
      });
      
      // Убеждаемся, что обязательные поля присутствуют
      if (updates.scoreA === undefined && formData.scoreA === undefined) {
        updates.scoreA = match.scoreA ?? null;
      }
      if (updates.scoreB === undefined && formData.scoreB === undefined) {
        updates.scoreB = match.scoreB ?? null;
      }
      
      console.log('💾 Сохранение матча:', {
        matchId: match.id,
        updates,
        formData,
        originalMatch: match
      });
      
      onUpdate(match.id, updates);
      
      // Показываем уведомление
      alert('✅ Изменения сохранены!');
    } else if (!isAdmin) {
      alert('❌ Вы не в режиме администратора! Добавьте ?admin=1 к URL');
    }
  };

  const handleStreamAdd = () => {
    const newStream = prompt('Введите URL стрима:');
    if (newStream) {
      const streams = [...(formData.streams || []), newStream];
      handleFieldChange('streams', streams);
    }
  };

  const handleStreamRemove = (index: number) => {
    const streams = formData.streams?.filter((_, i) => i !== index) || [];
    handleFieldChange('streams', streams);
  };

  console.log('🎨 Рендер модального окна:', { 
    isOpen, 
    hasMatch: !!match, 
    className: `drawer-overlay ${isOpen ? 'open' : ''}`,
    matchId: match?.id 
  });

  // Не рендерим если нет матча или не открыто
  if (!match || !isOpen) {
    return null;
  }

  return (
    <div 
      className="drawer-overlay open" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(5px)'
      }}
    >
      <div 
        className="drawer-content" 
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 100000
        }}
      >
        <div className="drawer-header">
          <h2>Детали матча</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="drawer-body">
          <div className="match-teams-section">
            <div className="team-display">
              <div className="team-info">
                {teamA?.logoUrl && (
                  <img src={teamA.logoUrl} alt={teamA.name} className="team-logo-large" />
                )}
                <span className="team-name-large">{teamA?.name || 'TBD'}</span>
              </div>
              {isAdmin && (
                <select
                  value={match.teamAId || ''}
                  onChange={(e) => handleFieldChange('teamAId', e.target.value || null)}
                  className="team-select"
                >
                  <option value="">TBD</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="score-section">
              <div className="score-display">
                <span className="score-value">{(formData.scoreA !== undefined && formData.scoreA !== null) ? formData.scoreA : (match.scoreA ?? '-')}</span>
                <span className="score-separator">:</span>
                <span className="score-value">{(formData.scoreB !== undefined && formData.scoreB !== null) ? formData.scoreB : (match.scoreB ?? '-')}</span>
              </div>
              {isAdmin && (
                <div className="score-inputs">
                  <input
                    type="number"
                    min="0"
                    value={formData.scoreA ?? ''}
                    onChange={(e) => handleFieldChange('scoreA', e.target.value ? parseInt(e.target.value) : null)}
                    className="score-input"
                    placeholder="Счёт A"
                  />
                  <span>:</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.scoreB ?? ''}
                    onChange={(e) => handleFieldChange('scoreB', e.target.value ? parseInt(e.target.value) : null)}
                    className="score-input"
                    placeholder="Счёт B"
                  />
                </div>
              )}
            </div>

            <div className="team-display">
              <div className="team-info">
                {teamB?.logoUrl && (
                  <img src={teamB.logoUrl} alt={teamB.name} className="team-logo-large" />
                )}
                <span className="team-name-large">{teamB?.name || 'TBD'}</span>
              </div>
              {isAdmin && (
                <select
                  value={match.teamBId || ''}
                  onChange={(e) => handleFieldChange('teamBId', e.target.value || null)}
                  className="team-select"
                >
                  <option value="">TBD</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="match-details-grid">
            <div className="detail-item">
              <label>Раунд</label>
              <span>{match.round}</span>
            </div>

            <div className="detail-item">
              <label>Статус</label>
              {isAdmin ? (
                <select
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value as MatchStatus)}
                  className="detail-input"
                >
                  {statusOptions.map(status => {
                    const statusLabels: Record<MatchStatus, string> = {
                      scheduled: 'Запланирован',
                      live: 'В прямом эфире',
                      done: 'Завершён',
                    };
                    return <option key={status} value={status}>{statusLabels[status]}</option>;
                  })}
                </select>
              ) : (
                <span>{match.status === 'scheduled' ? 'Запланирован' : match.status === 'live' ? 'В прямом эфире' : 'Завершён'}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Лучший из (Best Of)</label>
              <div className="best-of-hint">Формат матча: BO1 = 1 карта, BO3 = до 2 побед, BO5 = до 3 побед</div>
              {isAdmin ? (
                <select
                  value={formData.bestOf}
                  onChange={(e) => handleFieldChange('bestOf', parseInt(e.target.value) as BestOf)}
                  className="detail-input"
                >
                  {bestOfOptions.map(bo => (
                    <option key={bo} value={bo}>BO{bo}</option>
                  ))}
                </select>
              ) : (
                <span>BO{match.bestOf}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Карта</label>
              {isAdmin ? (
                <select
                  value={formData.map || ''}
                  onChange={(e) => handleFieldChange('map', e.target.value || undefined)}
                  className="detail-input"
                >
                  <option value="">Не выбрана</option>
                  {mapOptions.map(map => (
                    <option key={map} value={map}>{map}</option>
                  ))}
                </select>
              ) : (
                <span>{match.map || 'Не выбрана'}</span>
              )}
            </div>

            <div className="detail-item">
              <label>Время начала</label>
              {isAdmin ? (
                <input
                  type="datetime-local"
                  value={formData.startTime ? new Date(formData.startTime).toISOString().slice(0, 16) : ''}
                  onChange={(e) => handleFieldChange('startTime', e.target.value || undefined)}
                  className="detail-input"
                />
              ) : (
                <span>{match.startTime ? new Date(match.startTime).toLocaleString('ru-RU') : 'Не установлено'}</span>
              )}
            </div>

            {match.winnerId && (
              <div className="detail-item">
                <label>Победитель</label>
                <span className="winner-badge">
                  {teams.find(t => t.id === match.winnerId)?.name || 'Неизвестно'}
                </span>
              </div>
            )}
          </div>

          {isAdmin && (
            <>
              <div className="detail-section">
                <label>Заметки</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value || undefined)}
                  className="notes-textarea"
                  placeholder="Дополнительные заметки..."
                  rows={3}
                />
              </div>

              <div className="detail-section">
                <label>Ссылка на сервер (Server Link)</label>
                <div className="field-hint">IP адрес или команда подключения к игровому серверу CS2 (например: 192.168.1.1:27015 или connect 192.168.1.1:27015)</div>
                <div className="server-input-container">
                  <input
                    type="text"
                    value={formData.serverLink || ''}
                    onChange={(e) => handleFieldChange('serverLink', e.target.value || undefined)}
                    className="detail-input"
                    placeholder="192.168.1.1:27015 или connect 192.168.1.1:27015"
                  />
                  {formData.serverLink && parseServerAddress(formData.serverLink) && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!formData.serverLink) return;
                        
                        setIsQueryingServer(true);
                        setServerInfo(null);
                        
                        try {
                          const info = await queryServerInfo(formData.serverLink);
                          
                          if (info) {
                            // Обновляем информацию о матче
                            const updates: Partial<Match> = {
                              map: info.map !== 'Unknown' ? info.map : formData.map,
                            };
                            
                            // Пытаемся извлечь счёт
                            const score = extractScoreFromServerInfo(info);
                            if (score.scoreA !== undefined && score.scoreB !== undefined) {
                              updates.scoreA = score.scoreA;
                              updates.scoreB = score.scoreB;
                            }
                            
                            // Обновляем форму
                            setFormData({ ...formData, ...updates });
                            
                            setServerInfo(
                              `Сервер: ${info.name}\n` +
                              `Карта: ${info.map}\n` +
                              `Игроки: ${info.players}/${info.maxPlayers}\n` +
                              (score.scoreA !== undefined ? `Счёт: ${score.scoreA}:${score.scoreB}` : '')
                            );
                            
                            console.log('✅ Информация о сервере получена:', info);
                          }
                        } catch (error: any) {
                          const errorMsg = error.message || 'Не удалось получить информацию о сервере';
                          setServerInfo(`❌ Ошибка: ${errorMsg}\n\nПримечание: Для получения информации о сервере требуется бэкенд-прокси или публичный API.`);
                          console.error('Ошибка запроса сервера:', error);
                          
                          // Показываем инструкцию
                          alert(
                            'Автоматический запрос информации о сервере требует бэкенд-прокси.\n\n' +
                            'Альтернатива:\n' +
                            '1. Введите счёт вручную\n' +
                            '2. Используйте GameTracker или другие сервисы для мониторинга сервера\n' +
                            '3. Настройте бэкенд-прокси для Source Query Protocol'
                          );
                        } finally {
                          setIsQueryingServer(false);
                        }
                      }}
                      className="query-server-button"
                      disabled={isQueryingServer}
                      title="Запросить информацию о сервере (карта, игроки, счёт)"
                    >
                      {isQueryingServer ? '⏳ Запрос...' : '🔍 Запросить информацию'}
                    </button>
                  )}
                </div>
                {serverInfo && (
                  <div className="server-info-display">
                    <pre>{serverInfo}</pre>
                  </div>
                )}
              </div>

              <div className="detail-section">
                <label>Стримы (Streams)</label>
                <div className="field-hint">Ссылки на трансляции матча (YouTube, Twitch, и т.д.). Зрители смогут перейти по этим ссылкам для просмотра матча в прямом эфире.</div>
                <div className="streams-list">
                  {formData.streams?.map((stream, index) => (
                    <div key={index} className="stream-item">
                      <a href={stream} target="_blank" rel="noopener noreferrer">{stream}</a>
                      <button onClick={() => handleStreamRemove(index)} className="remove-button">×</button>
                    </div>
                  ))}
                  <button onClick={handleStreamAdd} className="add-button">+ Добавить стрим</button>
                </div>
              </div>
            </>
          )}

          {!isAdmin && (
            <>
              {match.notes && (
                <div className="detail-section">
                  <label>Notes</label>
                  <p className="notes-text">{match.notes}</p>
                </div>
              )}

              {match.serverLink && (
                <div className="detail-section">
                  <label>Ссылка на сервер</label>
                  <div className="server-link-container">
                    <div className="server-address">{match.serverLink}</div>
                    <div className="server-buttons">
                      <a 
                        href={`steam://connect/${match.serverLink.replace(/^(connect\s+)?/i, '')}`} 
                        className="link-button server-connect-button"
                        title="Подключиться через Steam"
                        onClick={(e) => {
                          const serverAddress = match.serverLink.replace(/^(connect\s+)?/i, '');
                          const timestamp = new Date().toLocaleString('ru-RU');
                          const logMessage = `[${timestamp}] Попытка подключения к серверу: ${serverAddress}`;
                          
                          // Логируем в консоль
                          console.log('%c🔌 ПОДКЛЮЧЕНИЕ К СЕРВЕРУ', 'color: #4a9eff; font-weight: bold; font-size: 14px;');
                          console.log(`Сервер: ${serverAddress}`);
                          console.log(`Матч: ${match.round} - Матч ${match.index}`);
                          console.log(`Время: ${timestamp}`);
                          console.log('---');
                          
                          // Сохраняем в localStorage для истории
                          const connectionLogs = JSON.parse(localStorage.getItem('cs2_connection_logs') || '[]');
                          connectionLogs.push({
                            timestamp,
                            server: serverAddress,
                            matchId: match.id,
                            matchRound: match.round,
                            action: 'steam_connect'
                          });
                          // Храним только последние 50 записей
                          if (connectionLogs.length > 50) {
                            connectionLogs.shift();
                          }
                          localStorage.setItem('cs2_connection_logs', JSON.stringify(connectionLogs));
                          
                          // Показываем уведомление
                          alert(`Подключение к серверу ${serverAddress}\n\nПроверьте консоль браузера (F12) для логов подключения.`);
                        }}
                      >
                        🎮 Подключиться
                      </a>
                      <button
                        onClick={() => {
                          const connectCommand = match.serverLink.startsWith('connect') 
                            ? match.serverLink 
                            : `connect ${match.serverLink}`;
                          const timestamp = new Date().toLocaleString('ru-RU');
                          const serverAddress = match.serverLink.replace(/^(connect\s+)?/i, '');
                          
                          navigator.clipboard.writeText(connectCommand).then(() => {
                            // Логируем в консоль
                            console.log('%c📋 КОПИРОВАНИЕ КОМАНДЫ', 'color: #44ff44; font-weight: bold; font-size: 14px;');
                            console.log(`Команда: ${connectCommand}`);
                            console.log(`Сервер: ${serverAddress}`);
                            console.log(`Матч: ${match.round} - Матч ${match.index}`);
                            console.log(`Время: ${timestamp}`);
                            console.log('---');
                            
                            // Сохраняем в localStorage
                            const connectionLogs = JSON.parse(localStorage.getItem('cs2_connection_logs') || '[]');
                            connectionLogs.push({
                              timestamp,
                              server: serverAddress,
                              matchId: match.id,
                              matchRound: match.round,
                              action: 'copy_command',
                              command: connectCommand
                            });
                            if (connectionLogs.length > 50) {
                              connectionLogs.shift();
                            }
                            localStorage.setItem('cs2_connection_logs', JSON.stringify(connectionLogs));
                            
                            alert(`Команда скопирована!\n\n${connectCommand}\n\nВставьте её в консоль CS2 (F1)\n\nПроверьте консоль браузера (F12) для логов.`);
                          }).catch(() => {
                            const textarea = document.createElement('textarea');
                            textarea.value = connectCommand;
                            document.body.appendChild(textarea);
                            textarea.select();
                            document.execCommand('copy');
                            document.body.removeChild(textarea);
                            alert('Команда скопирована! Вставьте её в консоль CS2 (F1)');
                          });
                        }}
                        className="link-button server-copy-button"
                        title="Скопировать команду подключения"
                      >
                        📋 Копировать команду
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        const logs = JSON.parse(localStorage.getItem('cs2_connection_logs') || '[]');
                        if (logs.length === 0) {
                          alert('История подключений пуста');
                          return;
                        }
                        const logsText = logs.map((log: any, index: number) => 
                          `${index + 1}. [${log.timestamp}] ${log.action === 'steam_connect' ? '🎮 Подключение' : '📋 Копирование'} к ${log.server}\n   Матч: ${log.matchRound}`
                        ).join('\n\n');
                        console.log('%c📜 ИСТОРИЯ ПОДКЛЮЧЕНИЙ', 'color: #ffd700; font-weight: bold; font-size: 16px;');
                        console.log(logsText);
                        alert(`История подключений (${logs.length} записей):\n\n${logsText}\n\nТакже проверьте консоль браузера (F12) для подробных логов.`);
                      }}
                      className="link-button server-log-button"
                      title="Показать историю подключений"
                    >
                      📜 История подключений
                    </button>
                  </div>
                </div>
              )}

              {match.streams && match.streams.length > 0 && (
                <div className="detail-section">
                  <label>Стримы (Streams)</label>
                  <div className="field-hint">Ссылки на трансляции матча для просмотра в прямом эфире</div>
                  <div className="streams-list">
                    {match.streams.map((stream, index) => (
                      <a key={index} href={stream} target="_blank" rel="noopener noreferrer" className="link-button">
                        Стрим {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {isAdmin && (
            <div className="drawer-footer">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSave();
                }} 
                className="save-match-button"
                type="button"
              >
                💾 Сохранить изменения
              </button>
              <div className="save-hint">
                Измените поля выше и нажмите кнопку для сохранения
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

