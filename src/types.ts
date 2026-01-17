export type Round = "R16" | "QF" | "SF" | "UF" | "LB1" | "LB2" | "LB3A" | "LB3" | "LB4A" | "LB4" | "LF" | "GF";
// R16, QF, SF - верхняя сетка
// UF - Upper Final (финал верхней сетки)
// LB1, LB2, LB3A, LB3, LB4A, LB4 - раунды нижней сетки
// LF - Lower Final (финал нижней сетки)
// GF - Grand Final (гранд-финал)

export type MatchStatus = "scheduled" | "live" | "done";

export type BestOf = 1 | 3 | 5;

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface Match {
  id: string;
  round: Round;
  index: number; // порядок матча в раунде
  teamAId?: string | null;
  teamBId?: string | null;
  scoreA?: number | null;
  scoreB?: number | null;
  bestOf: BestOf;
  map?: string;
  startTime?: string;
  status: MatchStatus;
  winnerId?: string | null;
  notes?: string;
  serverLink?: string;
  streams?: string[];
}

export interface BracketState {
  teams: Team[];
  matches: Match[];
  tournamentName?: string;
  tournamentDates?: string;
  organizer?: string;
}

