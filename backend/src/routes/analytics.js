const express = require('express');
const db = require('../config/database');
const { authenticateToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateToken);
router.use(requireAuth);

// Get user progress overview
router.get('/progress', async (req, res) => {
  try {
    const userId = req.user.id;

    // Total stats
    const totalStats = await db('study_sessions')
      .where({ user_id: userId })
      .whereNotNull('completed_at')
      .select([
        db.raw('COUNT(*) as total_sessions'),
        db.raw('SUM(cards_studied) as total_cards_studied'),
        db.raw('SUM(correct_answers) as total_correct'),
        db.raw('AVG(CASE WHEN cards_studied > 0 THEN (correct_answers::decimal / cards_studied * 100) END) as avg_accuracy')
      ])
      .first();

    // Recent activity (last 30 days) - get individual sessions with deck titles
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentActivity = await db('study_sessions')
      .leftJoin('decks', 'study_sessions.deck_id', 'decks.id')
      .where({ 'study_sessions.user_id': userId })
      .whereNotNull('study_sessions.completed_at')
      .where('study_sessions.started_at', '>=', thirtyDaysAgo)
      .select([
        'study_sessions.started_at as date',
        'study_sessions.cards_studied as cards',
        'study_sessions.correct_answers',
        'decks.title as deckTitle'
      ])
      .orderBy('study_sessions.started_at', 'desc')
      .limit(10);

    // Most studied decks
    const topDecks = await db('study_sessions')
      .join('decks', 'study_sessions.deck_id', 'decks.id')
      .where({ 'study_sessions.user_id': userId })
      .whereNotNull('study_sessions.completed_at')
      .select([
        'decks.id',
        'decks.title',
        'decks.category',
        db.raw('COUNT(*) as session_count'),
        db.raw('SUM(cards_studied) as total_cards'),
        db.raw('AVG(CASE WHEN cards_studied > 0 THEN (correct_answers::float / cards_studied * 100) END) as avg_accuracy')
      ])
      .groupBy('decks.id', 'decks.title', 'decks.category')
      .orderBy('session_count', 'desc')
      .limit(10);

    // Study streaks
    const sessions = await db('study_sessions')
      .where({ user_id: userId })
      .whereNotNull('completed_at')
      .select([db.raw('DATE(started_at) as date')])
      .groupBy(db.raw('DATE(started_at)'))
      .orderBy('date', 'desc');

    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date().toISOString().split('T')[0];
    let expectedDate = new Date();
    
    for (const session of sessions) {
      const sessionDate = session.date.toISOString().split('T')[0];
      const expected = expectedDate.toISOString().split('T')[0];
      
      if (sessionDate === expected) {
        tempStreak++;
        if (sessionDate === today || (currentStreak === 0 && tempStreak === 1)) {
          currentStreak = tempStreak;
        }
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
        break;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    res.json({
      totalStats: {
        totalSessions: parseInt(totalStats.total_sessions || 0),
        totalCardsStudied: parseInt(totalStats.total_cards_studied || 0),
        totalCorrect: parseInt(totalStats.total_correct || 0),
        averageAccuracy: Math.round(totalStats.avg_accuracy || 0)
      },
      recentActivity: recentActivity.map(activity => ({
        date: activity.date,
        cards: parseInt(activity.cards || 0),
        deckTitle: activity.deckTitle || 'Unknown Deck',
        accuracy: activity.correct_answers && activity.cards > 0
          ? Math.round((activity.correct_answers / activity.cards) * 100)
          : 0
      })),
      topDecks: topDecks.map(deck => ({
        id: deck.id,
        title: deck.title,
        category: deck.category,
        sessionCount: parseInt(deck.session_count),
        totalCards: parseInt(deck.total_cards),
        averageAccuracy: Math.round(deck.avg_accuracy || 0)
      })),
      streaks: {
        current: currentStreak,
        longest: longestStreak
      }
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get study streaks detail
router.get('/streaks', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get daily study data for the last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    
    const dailyStudy = await db('study_sessions')
      .where({ user_id: userId })
      .whereNotNull('completed_at')
      .where('started_at', '>=', ninetyDaysAgo)
      .select([
        db.raw('DATE(started_at) as date'),
        db.raw('COUNT(*) as sessions'),
        db.raw('SUM(cards_studied) as cards_studied'),
        db.raw('SUM(correct_answers) as correct_answers'),
        db.raw('SUM(EXTRACT(EPOCH FROM (completed_at - started_at))) as total_time')
      ])
      .groupBy(db.raw('DATE(started_at)'))
      .orderBy('date', 'desc');

    // Calculate streaks
    const streakData = [];
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const dates = [];
    for (let i = 0; i < 90; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dates.push(date.toISOString().split('T')[0]);
    }

    dates.reverse(); // Start from oldest

    for (const date of dates) {
      const dayData = dailyStudy.find(d => 
        d.date.toISOString().split('T')[0] === date
      );

      const studiedToday = !!dayData;
      
      if (studiedToday) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }

      streakData.push({
        date,
        studied: studiedToday,
        sessions: dayData ? parseInt(dayData.sessions) : 0,
        cardsStudied: dayData ? parseInt(dayData.cards_studied) : 0,
        accuracy: dayData && dayData.cards_studied > 0 
          ? Math.round((dayData.correct_answers / dayData.cards_studied) * 100)
          : 0,
        timeSpent: dayData ? Math.round(dayData.total_time || 0) : 0
      });
    }

    // Current streak is the streak from the end
    currentStreak = 0;
    for (let i = streakData.length - 1; i >= 0; i--) {
      if (streakData[i].studied) {
        currentStreak++;
      } else {
        break;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    res.json({
      currentStreak,
      longestStreak,
      dailyData: streakData
    });
  } catch (error) {
    console.error('Get streaks error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get AI insights about user's study patterns
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get recent performance data
    const recentSessions = await db('study_sessions')
      .where({ user_id: userId })
      .whereNotNull('completed_at')
      .where('started_at', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .select([
        'cards_studied',
        'correct_answers',
        'avg_response_time',
        'started_at'
      ])
      .orderBy('started_at', 'desc')
      .limit(20);

    if (recentSessions.length === 0) {
      return res.json({
        insights: ['Start studying to get personalized insights!'],
        metrics: {}
      });
    }

    // Calculate insights
    const insights = [];
    
    // Accuracy trend
    const totalCards = recentSessions.reduce((sum, s) => sum + s.cards_studied, 0);
    const totalCorrect = recentSessions.reduce((sum, s) => sum + s.correct_answers, 0);
    const accuracy = totalCards > 0 ? (totalCorrect / totalCards) * 100 : 0;

    if (accuracy >= 90) {
      insights.push('🎯 Excellent accuracy! You\'re mastering the material.');
    } else if (accuracy >= 75) {
      insights.push('📚 Good progress! Consider reviewing difficult cards more often.');
    } else if (accuracy >= 60) {
      insights.push('💪 Keep practicing! Focus on understanding concepts deeply.');
    } else {
      insights.push('🔄 Try using hints and explanations to improve understanding.');
    }

    // Study frequency
    const uniqueDays = new Set(recentSessions.map(s => 
      s.started_at.toISOString().split('T')[0]
    )).size;

    if (uniqueDays >= 20) {
      insights.push('🔥 Amazing consistency! Daily practice is paying off.');
    } else if (uniqueDays >= 10) {
      insights.push('⭐ Great habit! Try to study a little each day.');
    } else {
      insights.push('📅 More regular practice could help improve retention.');
    }

    // Response time analysis
    const avgResponseTime = recentSessions.reduce((sum, s) => sum + (s.avg_response_time || 0), 0) / recentSessions.length;
    
    if (avgResponseTime < 5000) { // Less than 5 seconds
      insights.push('⚡ Quick responses suggest good familiarity with the material.');
    } else if (avgResponseTime > 15000) { // More than 15 seconds
      insights.push('🤔 Taking time to think is good, but consider reviewing basics.');
    }

    res.json({
      insights,
      metrics: {
        recentAccuracy: Math.round(accuracy),
        studyDays: uniqueDays,
        averageResponseTime: Math.round(avgResponseTime / 1000), // Convert to seconds
        totalRecentCards: totalCards
      }
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;