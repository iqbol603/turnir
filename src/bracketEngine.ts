import { Match, Team, Round, BracketState } from './types';

/**
 * Вычисляет победителя матча на основе счёта
 */
export function calculateWinner(match: Match): string | null {
  if (match.scoreA === null || match.scoreA === undefined || 
      match.scoreB === null || match.scoreB === undefined) {
    return null;
  }
  
  if (match.scoreA > match.scoreB) {
    return match.teamAId || null;
  } else if (match.scoreB > match.scoreA) {
    return match.teamBId || null;
  }
  
  return null;
}

/**
 * Вычисляет проигравшего матча на основе счёта
 */
export function calculateLoser(match: Match): string | null {
  if (match.scoreA === null || match.scoreA === undefined || 
      match.scoreB === null || match.scoreB === undefined) {
    return null;
  }
  
  if (match.scoreA > match.scoreB) {
    return match.teamBId || null;
  } else if (match.scoreB > match.scoreA) {
    return match.teamAId || null;
  }
  
  return null;
}

/**
 * Создаёт начальную сетку Double Elimination для 16 команд
 */
export function createInitialBracket(teams: Team[]): Match[] {
  if (teams.length !== 16) {
    throw new Error('Must have exactly 16 teams');
  }

  const matches: Match[] = [];

  // ========== UPPER BRACKET (Верхняя сетка) ==========
  
  // R16: 8 матчей
  for (let i = 0; i < 8; i++) {
    matches.push({
      id: `r16-${i + 1}`,
      round: 'R16',
      index: i + 1,
      teamAId: teams[i * 2].id,
      teamBId: teams[i * 2 + 1].id,
      scoreA: null,
      scoreB: null,
      bestOf: 1,
      status: 'scheduled',
      winnerId: null,
    });
  }

  // QF: 4 матча
  for (let i = 0; i < 4; i++) {
    matches.push({
      id: `qf-${i + 1}`,
      round: 'QF',
      index: i + 1,
      teamAId: null,
      teamBId: null,
      scoreA: null,
      scoreB: null,
      bestOf: 3,
      status: 'scheduled',
      winnerId: null,
    });
  }

  // SF: 2 матча
  for (let i = 0; i < 2; i++) {
    matches.push({
      id: `sf-${i + 1}`,
      round: 'SF',
      index: i + 1,
      teamAId: null,
      teamBId: null,
      scoreA: null,
      scoreB: null,
      bestOf: 3,
      status: 'scheduled',
      winnerId: null,
    });
  }

  // UF: Upper Final (1 матч)
  matches.push({
    id: 'uf-1',
    round: 'UF',
    index: 1,
    teamAId: null,
    teamBId: null,
    scoreA: null,
    scoreB: null,
    bestOf: 3,
    status: 'scheduled',
    winnerId: null,
  });

  // ========== LOWER BRACKET (Нижняя сетка) ==========

  // LB1: 4 матча (проигравшие из R16)
  for (let i = 0; i < 4; i++) {
    matches.push({
      id: `lb1-${i + 1}`,
      round: 'LB1',
      index: i + 1,
      teamAId: null,
      teamBId: null,
      scoreA: null,
      scoreB: null,
      bestOf: 1,
      status: 'scheduled',
      winnerId: null,
    });
  }

  // LB2: 4 матча (проигравшие из QF + победители LB1)
  for (let i = 0; i < 4; i++) {
    matches.push({
      id: `lb2-${i + 1}`,
      round: 'LB2',
      index: i + 1,
      teamAId: null,
      teamBId: null,
      scoreA: null,
      scoreB: null,
      bestOf: 1,
      status: 'scheduled',
      winnerId: null,
    });
  }

  // LB3: 3 матча (проигравшие из SF + победители LB2)
  for (let i = 0; i < 3; i++) {
    matches.push({
      id: `lb3-${i + 1}`,
      round: 'LB3',
      index: i + 1,
      teamAId: null,
      teamBId: null,
      scoreA: null,
      scoreB: null,
      bestOf: 1,
      status: 'scheduled',
      winnerId: null,
    });
  }

  // LB4: 2 матча (победители LB3)
  for (let i = 0; i < 2; i++) {
    matches.push({
      id: `lb4-${i + 1}`,
      round: 'LB4',
      index: i + 1,
      teamAId: null,
      teamBId: null,
      scoreA: null,
      scoreB: null,
      bestOf: 1,
      status: 'scheduled',
      winnerId: null,
    });
  }

  // LF: Lower Final (1 матч) - проигравший из UF + победитель LB4
  matches.push({
    id: 'lf-1',
    round: 'LF',
    index: 1,
    teamAId: null,
    teamBId: null,
    scoreA: null,
    scoreB: null,
    bestOf: 3,
    status: 'scheduled',
    winnerId: null,
  });

  // GF: Grand Final (1 матч) - победитель UF vs победитель LF
  matches.push({
    id: 'gf-1',
    round: 'GF',
    index: 1,
    teamAId: null,
    teamBId: null,
    scoreA: null,
    scoreB: null,
    bestOf: 5,
    status: 'scheduled',
    winnerId: null,
  });

  return matches;
}

/**
 * Обновляет победителя матча и пересчитывает зависимые матчи
 */
export function updateMatchAndPropagate(
  matches: Match[],
  matchId: string,
  updates: Partial<Match>
): Match[] {
  // Находим исходный матч
  const originalMatch = matches.find(m => m.id === matchId);
  if (!originalMatch) {
    console.warn(`Match with id ${matchId} not found`);
    return matches;
  }

  // Объединяем обновления с исходным матчем, сохраняя все обязательные поля
  const updatedMatch: Match = {
    ...originalMatch,
    ...updates,
    // Убеждаемся, что обязательные поля не потеряны
    id: originalMatch.id,
    round: originalMatch.round,
    index: originalMatch.index,
    bestOf: updates.bestOf ?? originalMatch.bestOf,
    status: updates.status ?? originalMatch.status,
  };

  const updatedMatches = matches.map(m => 
    m.id === matchId ? updatedMatch : m
  );

  // Пересчитываем победителя для обновлённого матча
  const winnerId = calculateWinner(updatedMatch);
  const finalUpdatedMatch = { ...updatedMatch, winnerId };
  
  const finalMatches = updatedMatches.map(m => 
    m.id === matchId ? finalUpdatedMatch : m
  );

  // Пропагируем победителей и проигравших дальше
  return propagateWinnersAndLosers(finalMatches);
}

/**
 * Пропагирует победителей и проигравших из завершённых матчей
 */
export function propagateWinnersAndLosers(matches: Match[]): Match[] {
  const result = [...matches];

  // ========== UPPER BRACKET PROPAGATION ==========

  // Обновляем QF на основе R16 (победители)
  const r16Matches = result.filter(m => m.round === 'R16').sort((a, b) => a.index - b.index);
  const qfMatches = result.filter(m => m.round === 'QF').sort((a, b) => a.index - b.index);
  
  for (let i = 0; i < 4; i++) {
    const r16Match1 = r16Matches[i * 2];
    const r16Match2 = r16Matches[i * 2 + 1];
    const qfMatch = qfMatches[i];

    if (!r16Match1 || !r16Match2 || !qfMatch) continue;

    const winner1 = r16Match1.winnerId || (r16Match1.status === 'done' ? calculateWinner(r16Match1) : null);
    const winner2 = r16Match2.winnerId || (r16Match2.status === 'done' ? calculateWinner(r16Match2) : null);

    const needsReset = qfMatch.teamAId !== winner1 || qfMatch.teamBId !== winner2;
    
    const qfIndex = result.findIndex(m => m.id === qfMatch.id);
    if (qfIndex !== -1) {
      result[qfIndex] = {
        ...result[qfIndex],
        teamAId: winner1,
        teamBId: winner2,
        scoreA: needsReset ? null : result[qfIndex].scoreA,
        scoreB: needsReset ? null : result[qfIndex].scoreB,
        winnerId: needsReset ? null : result[qfIndex].winnerId,
      };
    }
  }

  // Обновляем SF на основе QF (победители)
  const updatedQfMatches = result.filter(m => m.round === 'QF').sort((a, b) => a.index - b.index);
  const sfMatches = result.filter(m => m.round === 'SF').sort((a, b) => a.index - b.index);
  
  for (let i = 0; i < 2; i++) {
    const qfMatch1 = updatedQfMatches[i * 2];
    const qfMatch2 = updatedQfMatches[i * 2 + 1];
    const sfMatch = sfMatches[i];

    if (!qfMatch1 || !qfMatch2 || !sfMatch) continue;

    const winner1 = qfMatch1.winnerId || (qfMatch1.status === 'done' ? calculateWinner(qfMatch1) : null);
    const winner2 = qfMatch2.winnerId || (qfMatch2.status === 'done' ? calculateWinner(qfMatch2) : null);

    const needsReset = sfMatch.teamAId !== winner1 || sfMatch.teamBId !== winner2;
    
    const sfIndex = result.findIndex(m => m.id === sfMatch.id);
    if (sfIndex !== -1) {
      result[sfIndex] = {
        ...result[sfIndex],
        teamAId: winner1,
        teamBId: winner2,
        scoreA: needsReset ? null : result[sfIndex].scoreA,
        scoreB: needsReset ? null : result[sfIndex].scoreB,
        winnerId: needsReset ? null : result[sfIndex].winnerId,
      };
    }
  }

  // Обновляем UF на основе SF (победители)
  const updatedSfMatches = result.filter(m => m.round === 'SF').sort((a, b) => a.index - b.index);
  const ufMatch = result.find(m => m.round === 'UF');
  
  if (ufMatch && updatedSfMatches.length === 2) {
    const sfMatch1 = updatedSfMatches[0];
    const sfMatch2 = updatedSfMatches[1];

    const winner1 = sfMatch1.winnerId || (sfMatch1.status === 'done' ? calculateWinner(sfMatch1) : null);
    const winner2 = sfMatch2.winnerId || (sfMatch2.status === 'done' ? calculateWinner(sfMatch2) : null);

    const needsReset = ufMatch.teamAId !== winner1 || ufMatch.teamBId !== winner2;
    
    const ufIndex = result.findIndex(m => m.id === ufMatch.id);
    if (ufIndex !== -1) {
      result[ufIndex] = {
        ...result[ufIndex],
        teamAId: winner1,
        teamBId: winner2,
        scoreA: needsReset ? null : result[ufIndex].scoreA,
        scoreB: needsReset ? null : result[ufIndex].scoreB,
        winnerId: needsReset ? null : result[ufIndex].winnerId,
      };
    }
  }

  // ========== LOWER BRACKET PROPAGATION ==========

  // Обновляем r16Matches из result, чтобы использовать актуальные данные
  const updatedR16Matches = result.filter(m => m.round === 'R16').sort((a, b) => a.index - b.index);

  // LB1: проигравшие из R16
  const lb1Matches = result.filter(m => m.round === 'LB1').sort((a, b) => a.index - b.index);
  for (let i = 0; i < 4; i++) {
    const r16Match1 = updatedR16Matches[i * 2];
    const r16Match2 = updatedR16Matches[i * 2 + 1];
    const lb1Match = lb1Matches[i];

    if (!r16Match1 || !r16Match2 || !lb1Match) continue;

    // Проигравший определяется, если есть winnerId (матч завершён) или статус 'done'
    const hasWinner1 = r16Match1.winnerId !== null && r16Match1.winnerId !== undefined;
    const hasWinner2 = r16Match2.winnerId !== null && r16Match2.winnerId !== undefined;
    const isDone1 = r16Match1.status === 'done';
    const isDone2 = r16Match2.status === 'done';

    const loser1 = (hasWinner1 || isDone1) ? calculateLoser(r16Match1) : null;
    const loser2 = (hasWinner2 || isDone2) ? calculateLoser(r16Match2) : null;

    const needsReset = lb1Match.teamAId !== loser1 || lb1Match.teamBId !== loser2;
    
    const lb1Index = result.findIndex(m => m.id === lb1Match.id);
    if (lb1Index !== -1) {
      result[lb1Index] = {
        ...result[lb1Index],
        teamAId: loser1,
        teamBId: loser2,
        scoreA: needsReset ? null : result[lb1Index].scoreA,
        scoreB: needsReset ? null : result[lb1Index].scoreB,
        winnerId: needsReset ? null : result[lb1Index].winnerId,
      };
    }
  }

  // LB2: проигравшие из QF + победители LB1
  const lb2Matches = result.filter(m => m.round === 'LB2').sort((a, b) => a.index - b.index);
  const updatedLb1Matches = result.filter(m => m.round === 'LB1').sort((a, b) => a.index - b.index);
  
  for (let i = 0; i < 4; i++) {
    const qfMatch = updatedQfMatches[i];
    const lb1Match = updatedLb1Matches[i];
    const lb2Match = lb2Matches[i];

    if (!qfMatch || !lb1Match || !lb2Match) continue;

    const hasQfWinner = qfMatch.winnerId !== null && qfMatch.winnerId !== undefined;
    const isQfDone = qfMatch.status === 'done';
    const qfLoser = (hasQfWinner || isQfDone) ? calculateLoser(qfMatch) : null;
    const lb1Winner = lb1Match.winnerId || (lb1Match.status === 'done' ? calculateWinner(lb1Match) : null);

    const needsReset = lb2Match.teamAId !== qfLoser || lb2Match.teamBId !== lb1Winner;
    
    const lb2Index = result.findIndex(m => m.id === lb2Match.id);
    if (lb2Index !== -1) {
      result[lb2Index] = {
        ...result[lb2Index],
        teamAId: qfLoser,
        teamBId: lb1Winner,
        scoreA: needsReset ? null : result[lb2Index].scoreA,
        scoreB: needsReset ? null : result[lb2Index].scoreB,
        winnerId: needsReset ? null : result[lb2Index].winnerId,
      };
    }
  }

  // LB3: проигравшие из SF + победители LB2 (3 матча)
  const lb3Matches = result.filter(m => m.round === 'LB3').sort((a, b) => a.index - b.index);
  const updatedLb2Matches = result.filter(m => m.round === 'LB2').sort((a, b) => a.index - b.index);
  
  // LB3-1: проигравший SF-1 vs победитель LB2-1
  if (lb3Matches[0] && updatedSfMatches[0] && updatedLb2Matches[0]) {
    const sfMatch = updatedSfMatches[0];
    const lb2Match = updatedLb2Matches[0];
    const lb3Match = lb3Matches[0];

    const hasSfWinner = sfMatch.winnerId !== null && sfMatch.winnerId !== undefined;
    const isSfDone = sfMatch.status === 'done';
    const sfLoser = (hasSfWinner || isSfDone) ? calculateLoser(sfMatch) : null;
    const lb2Winner = lb2Match.winnerId || (lb2Match.status === 'done' ? calculateWinner(lb2Match) : null);

    // Сбрасываем результаты только если команды изменились И матч ещё не был сыгран
    const teamAChanged = lb3Match.teamAId !== sfLoser;
    const teamBChanged = lb3Match.teamBId !== lb2Winner;
    const isMatchDone = lb3Match.status === 'done';
    const needsReset = (teamAChanged || teamBChanged) && !isMatchDone;
    
    const lb3Index = result.findIndex(m => m.id === lb3Match.id);
    if (lb3Index !== -1) {
      result[lb3Index] = {
        ...result[lb3Index],
        teamAId: sfLoser,
        teamBId: lb2Winner,
        scoreA: needsReset ? null : result[lb3Index].scoreA,
        scoreB: needsReset ? null : result[lb3Index].scoreB,
        winnerId: needsReset ? null : result[lb3Index].winnerId,
      };
    }
  }

  // LB3-2: проигравший SF-2 vs победитель LB2-2
  if (lb3Matches[1] && updatedSfMatches[1] && updatedLb2Matches[1]) {
    const sfMatch = updatedSfMatches[1];
    const lb2Match = updatedLb2Matches[1];
    const lb3Match = lb3Matches[1];

    const hasSfWinner = sfMatch.winnerId !== null && sfMatch.winnerId !== undefined;
    const isSfDone = sfMatch.status === 'done';
    const sfLoser = (hasSfWinner || isSfDone) ? calculateLoser(sfMatch) : null;
    const lb2Winner = lb2Match.winnerId || (lb2Match.status === 'done' ? calculateWinner(lb2Match) : null);

    // Сбрасываем результаты только если команды изменились И матч ещё не был сыгран
    const teamAChanged = lb3Match.teamAId !== sfLoser;
    const teamBChanged = lb3Match.teamBId !== lb2Winner;
    const isMatchDone = lb3Match.status === 'done';
    const needsReset = (teamAChanged || teamBChanged) && !isMatchDone;
    
    const lb3Index = result.findIndex(m => m.id === lb3Match.id);
    if (lb3Index !== -1) {
      result[lb3Index] = {
        ...result[lb3Index],
        teamAId: sfLoser,
        teamBId: lb2Winner,
        scoreA: needsReset ? null : result[lb3Index].scoreA,
        scoreB: needsReset ? null : result[lb3Index].scoreB,
        winnerId: needsReset ? null : result[lb3Index].winnerId,
      };
    }
  }

  // LB3-3: победитель LB2-3 vs победитель LB2-4
  if (lb3Matches[2] && updatedLb2Matches[2] && updatedLb2Matches[3]) {
    const lb2Match3 = updatedLb2Matches[2];
    const lb2Match4 = updatedLb2Matches[3];
    const lb3Match = lb3Matches[2];

    const lb2Winner3 = lb2Match3.winnerId || (lb2Match3.status === 'done' ? calculateWinner(lb2Match3) : null);
    const lb2Winner4 = lb2Match4.winnerId || (lb2Match4.status === 'done' ? calculateWinner(lb2Match4) : null);

    const needsReset = lb3Match.teamAId !== lb2Winner3 || lb3Match.teamBId !== lb2Winner4;
    
    const lb3Index = result.findIndex(m => m.id === lb3Match.id);
    if (lb3Index !== -1) {
      result[lb3Index] = {
        ...result[lb3Index],
        teamAId: lb2Winner3,
        teamBId: lb2Winner4,
        scoreA: needsReset ? null : result[lb3Index].scoreA,
        scoreB: needsReset ? null : result[lb3Index].scoreB,
        winnerId: needsReset ? null : result[lb3Index].winnerId,
      };
    }
  }

  // LB4: победители LB3 (2 матча)
  const lb4Matches = result.filter(m => m.round === 'LB4').sort((a, b) => a.index - b.index);
  const updatedLb3Matches = result.filter(m => m.round === 'LB3').sort((a, b) => a.index - b.index);
  
  // LB4-1: победитель LB3-1 vs победитель LB3-2
  if (lb4Matches[0] && updatedLb3Matches[0] && updatedLb3Matches[1]) {
    const lb3Match1 = updatedLb3Matches[0];
    const lb3Match2 = updatedLb3Matches[1];
    const lb4Match = lb4Matches[0];

    const winner1 = lb3Match1.winnerId || (lb3Match1.status === 'done' ? calculateWinner(lb3Match1) : null);
    const winner2 = lb3Match2.winnerId || (lb3Match2.status === 'done' ? calculateWinner(lb3Match2) : null);

    const needsReset = lb4Match.teamAId !== winner1 || lb4Match.teamBId !== winner2;
    
    const lb4Index = result.findIndex(m => m.id === lb4Match.id);
    if (lb4Index !== -1) {
      result[lb4Index] = {
        ...result[lb4Index],
        teamAId: winner1,
        teamBId: winner2,
        scoreA: needsReset ? null : result[lb4Index].scoreA,
        scoreB: needsReset ? null : result[lb4Index].scoreB,
        winnerId: needsReset ? null : result[lb4Index].winnerId,
      };
    }
  }

  // LB4-2: победитель LB3-3 vs победитель LB4-1
  if (lb4Matches[1] && updatedLb3Matches[2]) {
    const lb3Match3 = updatedLb3Matches[2];
    const lb4Match1 = result.find(m => m.round === 'LB4' && m.index === 1);
    const lb4Match2 = lb4Matches[1];

    const lb3Winner3 = lb3Match3.winnerId || (lb3Match3.status === 'done' ? calculateWinner(lb3Match3) : null);
    const lb4Winner1 = lb4Match1?.winnerId || (lb4Match1?.status === 'done' ? calculateWinner(lb4Match1!) : null);

    const needsReset = lb4Match2.teamAId !== lb3Winner3 || lb4Match2.teamBId !== lb4Winner1;
    
    const lb4Index = result.findIndex(m => m.id === lb4Match2.id);
    if (lb4Index !== -1) {
      result[lb4Index] = {
        ...result[lb4Index],
        teamAId: lb3Winner3,
        teamBId: lb4Winner1,
        scoreA: needsReset ? null : result[lb4Index].scoreA,
        scoreB: needsReset ? null : result[lb4Index].scoreB,
        winnerId: needsReset ? null : result[lb4Index].winnerId,
      };
    }
  }

  // LF: проигравший из UF + победитель LB4-2
  const lfMatch = result.find(m => m.round === 'LF');
  const updatedUfMatch = result.find(m => m.round === 'UF');
  const updatedLb4Matches = result.filter(m => m.round === 'LB4').sort((a, b) => a.index - b.index);
  const updatedLb4Match2 = updatedLb4Matches.find(m => m.index === 2);
  
  if (lfMatch && updatedUfMatch && updatedLb4Match2) {
    const hasUfWinner = updatedUfMatch.winnerId !== null && updatedUfMatch.winnerId !== undefined;
    const isUfDone = updatedUfMatch.status === 'done';
    const ufLoser = (hasUfWinner || isUfDone) ? calculateLoser(updatedUfMatch) : null;
    const lb4Winner2 = updatedLb4Match2.winnerId || (updatedLb4Match2.status === 'done' ? calculateWinner(updatedLb4Match2) : null);

    const needsReset = lfMatch.teamAId !== ufLoser || lfMatch.teamBId !== lb4Winner2;
    
    const lfIndex = result.findIndex(m => m.id === lfMatch.id);
    if (lfIndex !== -1) {
      result[lfIndex] = {
        ...result[lfIndex],
        teamAId: ufLoser,
        teamBId: lb4Winner2,
        scoreA: needsReset ? null : result[lfIndex].scoreA,
        scoreB: needsReset ? null : result[lfIndex].scoreB,
        winnerId: needsReset ? null : result[lfIndex].winnerId,
      };
    }
  }

  // GF: победитель UF vs победитель LF
  const gfMatch = result.find(m => m.round === 'GF');
  const finalUfMatch = result.find(m => m.round === 'UF');
  const finalLfMatch = result.find(m => m.round === 'LF');
  
  if (gfMatch && finalUfMatch && finalLfMatch) {
    const ufWinner = finalUfMatch.winnerId || (finalUfMatch.status === 'done' ? calculateWinner(finalUfMatch) : null);
    const lfWinner = finalLfMatch.winnerId || (finalLfMatch.status === 'done' ? calculateWinner(finalLfMatch) : null);

    const needsReset = gfMatch.teamAId !== ufWinner || gfMatch.teamBId !== lfWinner;
    
    const gfIndex = result.findIndex(m => m.id === gfMatch.id);
    if (gfIndex !== -1) {
      result[gfIndex] = {
        ...result[gfIndex],
        teamAId: ufWinner,
        teamBId: lfWinner,
        scoreA: needsReset ? null : result[gfIndex].scoreA,
        scoreB: needsReset ? null : result[gfIndex].scoreB,
        winnerId: needsReset ? null : result[gfIndex].winnerId,
      };
    }
  }

  return result;
}

/**
 * Мигрирует структуру сетки, добавляя недостающие матчи и сохраняя существующие результаты
 */
export function migrateBracketStructure(matches: Match[], teams: Team[]): Match[] {
  const lb3Matches = matches.filter(m => m.round === 'LB3').sort((a, b) => a.index - b.index);
  const lb4Matches = matches.filter(m => m.round === 'LB4').sort((a, b) => a.index - b.index);
  
  // Создаём карту существующих матчей для сохранения результатов
  const existingMatchesMap = new Map<string, Match>();
  matches.forEach(m => existingMatchesMap.set(m.id, { ...m }));
  
  const result = [...matches];
  
  // Добавляем недостающие матчи LB3 (должно быть 3)
  if (lb3Matches.length < 3) {
    for (let i = lb3Matches.length + 1; i <= 3; i++) {
      const existingMatch = matches.find(m => m.round === 'LB3' && m.index === i);
      if (!existingMatch) {
        result.push({
          id: `lb3-${i}`,
          round: 'LB3',
          index: i,
          teamAId: null,
          teamBId: null,
          scoreA: null,
          scoreB: null,
          bestOf: 1,
          status: 'scheduled',
          winnerId: null,
        });
      }
    }
  }
  
  // Добавляем недостающие матчи LB4 (должно быть 2)
  if (lb4Matches.length < 2) {
    for (let i = lb4Matches.length + 1; i <= 2; i++) {
      const existingMatch = matches.find(m => m.round === 'LB4' && m.index === i);
      if (!existingMatch) {
        result.push({
          id: `lb4-${i}`,
          round: 'LB4',
          index: i,
          teamAId: null,
          teamBId: null,
          scoreA: null,
          scoreB: null,
          bestOf: 1,
          status: 'scheduled',
          winnerId: null,
        });
      }
    }
  }
  
  // Пересчитываем распространение команд
  const propagated = propagateWinnersAndLosers(result);
  
  // Восстанавливаем результаты существующих матчей, если команды не изменились
  return propagated.map(match => {
    const existingMatch = existingMatchesMap.get(match.id);
    if (existingMatch) {
      // Если команды не изменились, сохраняем результаты
      const teamsUnchanged = 
        match.teamAId === existingMatch.teamAId && 
        match.teamBId === existingMatch.teamBId;
      
      if (teamsUnchanged && existingMatch.status === 'done') {
        return {
          ...match,
          scoreA: existingMatch.scoreA,
          scoreB: existingMatch.scoreB,
          winnerId: existingMatch.winnerId,
          status: existingMatch.status,
        };
      }
    }
    return match;
  });
}

/**
 * Сбрасывает все счёты и победителей, но сохраняет команды в R16
 */
export function resetBracket(matches: Match[]): Match[] {
  return matches.map(match => {
    if (match.round === 'R16') {
      // В R16 сохраняем команды, но сбрасываем счёт
      return {
        ...match,
        scoreA: null,
        scoreB: null,
        winnerId: null,
        status: 'scheduled' as const,
      };
    } else {
      // В остальных раундах сбрасываем всё
      return {
        ...match,
        teamAId: null,
        teamBId: null,
        scoreA: null,
        scoreB: null,
        winnerId: null,
        status: 'scheduled' as const,
      };
    }
  });
}

// Для обратной совместимости
export const propagateWinners = propagateWinnersAndLosers;
