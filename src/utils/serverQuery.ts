/**
 * Утилиты для запроса информации с сервера CS2
 */

export interface ServerInfo {
  name: string;
  map: string;
  players: number;
  maxPlayers: number;
  scoreA?: number;
  scoreB?: number;
  teamA?: string;
  teamB?: string;
}

/**
 * Парсит IP адрес и порт из строки
 */
export function parseServerAddress(serverLink: string): { host: string; port: number } | null {
  // Убираем "connect " если есть
  const cleaned = serverLink.replace(/^connect\s+/i, '').trim();
  
  // Парсим IP:PORT
  const match = cleaned.match(/^([\d.]+):(\d+)$/);
  if (match) {
    return {
      host: match[1],
      port: parseInt(match[2], 10)
    };
  }
  
  return null;
}

/**
 * Запрашивает информацию о сервере CS2 через Source Query Protocol
 * Использует CORS прокси для обхода ограничений браузера
 */
export async function queryServerInfo(serverLink: string): Promise<ServerInfo | null> {
  const address = parseServerAddress(serverLink);
  if (!address) {
    throw new Error('Неверный формат адреса сервера');
  }

  try {
    // Используем публичный API для запроса информации о сервере
    // Вариант 1: GameTracker API (если доступен)
    const gameTrackerUrl = `https://api.gametracker.rs/api/server/${address.host}:${address.port}`;
    
    try {
      const response = await fetch(gameTrackerUrl);
      if (response.ok) {
        const data = await response.json();
        return {
          name: data.name || 'CS2 Server',
          map: data.map || 'Unknown',
          players: data.players || 0,
          maxPlayers: data.maxplayers || 0,
        };
      }
    } catch (e) {
      console.log('GameTracker API недоступен, используем альтернативный метод');
    }

    // Вариант 2: Прямой запрос через UDP (требует прокси на бэкенде)
    // Для MVP показываем инструкцию
    throw new Error('Прямой запрос к серверу требует бэкенд-прокси');
    
  } catch (error) {
    console.error('Ошибка запроса информации о сервере:', error);
    throw error;
  }
}

/**
 * Пытается извлечь счёт из названия сервера или карты
 */
export function extractScoreFromServerInfo(info: ServerInfo): { scoreA?: number; scoreB?: number } {
  // Пытаемся найти счёт в названии сервера или других полях
  const scorePattern = /(\d+)\s*[-:]\s*(\d+)/;
  const match = info.name.match(scorePattern) || info.map.match(scorePattern);
  
  if (match) {
    return {
      scoreA: parseInt(match[1], 10),
      scoreB: parseInt(match[2], 10),
    };
  }
  
  return {};
}


