import type { StudySession } from "../types";

export function processDailyStats(sessions: StudySession[]): Array<{
  date: string;
  reviews: number;
  correct: number;
}> {
  const dailyStats = new Map<string, { reviews: number; correct: number }>();

  sessions.forEach((session) => {
    const date = new Date(session.started_at).toISOString().split("T")[0];
    const existing = dailyStats.get(date) || { reviews: 0, correct: 0 };

    dailyStats.set(date, {
      reviews: existing.reviews + session.cards_reviewed,
      correct: existing.correct + session.correct_answers,
    });
  });

  return Array.from(dailyStats.entries()).map(([date, stats]) => ({
    date,
    ...stats,
  }));
}

export function calculateStreak(sessions: StudySession[]): number {
  if (!sessions.length) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sessionDates = sessions.map((session) => {
    const date = new Date(session.started_at);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  });

  let streak = 0;
  let currentDate = today.getTime();

  while (sessionDates.includes(currentDate)) {
    streak++;
    currentDate -= 24 * 60 * 60 * 1000; // Subtract one day
  }

  return streak;
}

export function calculateTotalTime(sessions: StudySession[]): number {
  return sessions.reduce((total, session) => {
    if (!session.ended_at) return total;
    const duration =
      new Date(session.ended_at).getTime() -
      new Date(session.started_at).getTime();
    return total + duration / 1000 / 60; // Convert to minutes
  }, 0);
}
