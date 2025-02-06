import { supabase } from "../supabase/supabaseClient";

interface AchievementCheck {
  type: string;
  title: string;
  description: string;
  condition: (stats: UserStats) => boolean;
}

interface UserStats {
  totalCards: number;
  learnedCards: number;
  studyStreak: number;
  sessionsCompleted: number;
  totalCorrectAnswers: number;
  categoriesCreated: number;
}

const ACHIEVEMENTS: AchievementCheck[] = [
  {
    type: "FIRST_CATEGORY",
    title: "Getting Started",
    description: "Create your first category",
    condition: (stats) => stats.categoriesCreated >= 1,
  },
  {
    type: "FIRST_STUDY",
    title: "First Steps",
    description: "Complete your first study session",
    condition: (stats) => stats.sessionsCompleted >= 1,
  },
  {
    type: "LEARNING_STREAK",
    title: "Consistent Learner",
    description: "Maintain a 3-day study streak",
    condition: (stats) => stats.studyStreak >= 3,
  },
  {
    type: "MASTER_LEARNER",
    title: "Master Learner",
    description: "Mark 50 cards as learned",
    condition: (stats) => stats.learnedCards >= 50,
  },
  {
    type: "CARD_COLLECTOR",
    title: "Card Collector",
    description: "Create 100 flashcards",
    condition: (stats) => stats.totalCards >= 100,
  },
];

class AchievementService {
  private async getUserStats(userId: string): Promise<UserStats> {
    const { data: flashcards } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", userId);

    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId);

    const { data: sessions } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", userId);

    const { data: user } = await supabase
      .from("users")
      .select("streak_count")
      .eq("id", userId)
      .single();

    return {
      totalCards: flashcards?.length || 0,
      learnedCards: flashcards?.filter((card) => card.is_learned).length || 0,
      studyStreak: user?.streak_count || 0,
      sessionsCompleted: sessions?.length || 0,
      totalCorrectAnswers:
        sessions?.reduce(
          (sum, session) => sum + (session.correct_answers || 0),
          0
        ) || 0,
      categoriesCreated: categories?.length || 0,
    };
  }

  private async getExistingAchievements(userId: string): Promise<string[]> {
    const { data: achievements } = await supabase
      .from("achievements")
      .select("achievement_type")
      .eq("user_id", userId);

    return achievements?.map((a) => a.achievement_type) || [];
  }

  async checkAchievements(userId: string): Promise<void> {
    try {
      const stats = await this.getUserStats(userId);
      const existingAchievements = await this.getExistingAchievements(userId);

      const newAchievements = ACHIEVEMENTS.filter(
        (achievement) =>
          !existingAchievements.includes(achievement.type) &&
          achievement.condition(stats)
      );

      if (newAchievements.length === 0) return;

      const achievementsToInsert = newAchievements.map((achievement) => ({
        user_id: userId,
        achievement_type: achievement.type,
        achieved_at: new Date().toISOString(),
        metadata: {
          title: achievement.title,
          description: achievement.description,
        },
      }));

      const { error } = await supabase
        .from("achievements")
        .insert(achievementsToInsert);

      if (error) throw error;

      // TODO: Show achievement notification to user
    } catch (error) {
      console.error("Error checking achievements:", error);
    }
  }

  async getAchievements(userId: string) {
    try {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("user_id", userId)
        .order("achieved_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching achievements:", error);
      return [];
    }
  }
}

export const achievementService = new AchievementService();
