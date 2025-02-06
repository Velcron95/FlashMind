import { supabase } from "../supabase/supabaseClient";

export interface StudyStats {
  totalCards: number;
  cardsLearned: number;
  totalStudyTime: number;
  averageAccuracy: number;
  streakDays: number;
  lastStudyDate: string | null;
  categoryProgress: Record<string, CategoryProgress>;
  weeklyActivity: WeeklyActivity[];
}

interface CategoryProgress {
  totalCards: number;
  cardsLearned: number;
  accuracy: number;
  lastStudied: string | null;
}

interface WeeklyActivity {
  date: string;
  cardsStudied: number;
  accuracy: number;
  studyTime: number;
}

export class StatisticsService {
  private static instance: StatisticsService;

  private constructor() {}

  static getInstance(): StatisticsService {
    if (!StatisticsService.instance) {
      StatisticsService.instance = new StatisticsService();
    }
    return StatisticsService.instance;
  }

  async getUserStats(userId: string): Promise<StudyStats> {
    try {
      // Get total cards and learned cards
      const { data: flashcards } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", userId);

      const totalCards = flashcards?.length || 0;
      const cardsLearned =
        flashcards?.filter((card) => card.is_learned).length || 0;

      // Get study sessions for the last 7 days
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const { data: recentSessions } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", userId)
        .gte("started_at", oneWeekAgo.toISOString())
        .order("started_at", { ascending: true });

      // Calculate weekly activity
      const weeklyActivity = this.calculateWeeklyActivity(recentSessions || []);

      // Get category progress
      const categoryProgress = await this.getCategoryProgress(userId);

      // Get user streak and last study date
      const { data: userData } = await supabase
        .from("users")
        .select("streak_count")
        .eq("id", userId)
        .single();

      const lastSession = recentSessions?.[recentSessions.length - 1];

      return {
        totalCards,
        cardsLearned,
        totalStudyTime: weeklyActivity.reduce(
          (sum, day) => sum + day.studyTime,
          0
        ),
        averageAccuracy:
          weeklyActivity.reduce((sum, day) => sum + day.accuracy, 0) /
          (weeklyActivity.length || 1),
        streakDays: userData?.streak_count || 0,
        lastStudyDate: lastSession?.ended_at || null,
        categoryProgress,
        weeklyActivity,
      };
    } catch (e) {
      console.error("Error getting user stats:", e);
      return this.getEmptyStats();
    }
  }

  private async getCategoryProgress(
    userId: string
  ): Promise<Record<string, CategoryProgress>> {
    const progress: Record<string, CategoryProgress> = {};

    try {
      const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId);

      for (const category of categories || []) {
        const { data: cards } = await supabase
          .from("flashcards")
          .select("*")
          .eq("category_id", category.id);

        const { data: sessions } = await supabase
          .from("study_sessions")
          .select("*")
          .eq("category_id", category.id)
          .order("ended_at", { ascending: false })
          .limit(1);

        const totalCards = cards?.length || 0;
        const cardsLearned =
          cards?.filter((card) => card.is_learned).length || 0;
        const lastSession = sessions?.[0];

        progress[category.id] = {
          totalCards,
          cardsLearned,
          accuracy:
            lastSession?.correct_answers && lastSession?.cards_reviewed
              ? (lastSession.correct_answers / lastSession.cards_reviewed) * 100
              : 0,
          lastStudied: lastSession?.ended_at || null,
        };
      }
    } catch (e) {
      console.error("Error getting category progress:", e);
    }

    return progress;
  }

  private calculateWeeklyActivity(sessions: any[]): WeeklyActivity[] {
    const weeklyActivity: WeeklyActivity[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      const daysSessions = sessions.filter(
        (session) => session.started_at.split("T")[0] === dateStr
      );

      const cardsStudied = daysSessions.reduce(
        (sum, session) => sum + session.cards_reviewed,
        0
      );

      const accuracy =
        daysSessions.reduce((sum, session) => {
          const sessionAccuracy =
            (session.correct_answers / session.cards_reviewed) * 100;
          return sum + sessionAccuracy;
        }, 0) / (daysSessions.length || 1);

      const studyTime = daysSessions.reduce((sum, session) => {
        const start = new Date(session.started_at).getTime();
        const end = new Date(session.ended_at).getTime();
        return sum + (end - start) / 1000; // Convert to seconds
      }, 0);

      weeklyActivity.push({
        date: dateStr,
        cardsStudied,
        accuracy,
        studyTime,
      });
    }

    return weeklyActivity;
  }

  private getEmptyStats(): StudyStats {
    return {
      totalCards: 0,
      cardsLearned: 0,
      totalStudyTime: 0,
      averageAccuracy: 0,
      streakDays: 0,
      lastStudyDate: null,
      categoryProgress: {},
      weeklyActivity: [],
    };
  }
}

export const statisticsService = StatisticsService.getInstance();
