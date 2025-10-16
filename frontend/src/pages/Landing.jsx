import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Brain,
  Sparkles,
  Trophy,
  Target,
  Zap,
  BarChart3,
  Lightbulb,
  Clock,
  ArrowRight,
  Check
} from 'lucide-react'
import Button from '../components/ui/Button'

export default function Landing() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Generate personalized flashcards and quizzes on any topic using advanced AI technology.'
    },
    {
      icon: Sparkles,
      title: 'Smart Quiz Generation',
      description: 'Automatically create multiple-choice quizzes with hints and detailed explanations.'
    },
    {
      icon: BarChart3,
      title: 'Progress Analytics',
      description: 'Track your learning journey with detailed insights, streaks, and performance metrics.'
    },
    {
      icon: Lightbulb,
      title: 'Progressive Hints',
      description: 'Get AI-generated hints when you need them, from subtle clues to detailed explanations.'
    },
    {
      icon: Target,
      title: 'Adaptive Difficulty',
      description: 'Choose from beginner to expert levels, with content tailored to your skill level.'
    },
    {
      icon: Clock,
      title: 'Study Anywhere',
      description: 'Fully responsive design works seamlessly on mobile, tablet, and desktop devices.'
    }
  ]

  const stats = [
    { value: '10,000+', label: 'Cards Generated' },
    { value: '500+', label: 'Active Users' },
    { value: '95%', label: 'Success Rate' },
    { value: '24/7', label: 'AI Available' }
  ]

  const benefits = [
    'Generate unlimited flashcards and quizzes',
    'AI-powered hints and explanations',
    'Track your progress with detailed analytics',
    'Study on any device, anywhere',
    'Customizable difficulty levels',
    'Daily study streaks and achievements'
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-lg border-b border-surface-light"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Brain className="h-8 w-8 text-primary" />
              <span className="ml-2 text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                AI Study Buddy
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/login">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(118, 75, 162, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.15) 0%, transparent 50%)',
              ]
            }}
            transition={{ duration: 10, repeat: Infinity }}
            className="absolute inset-0"
          />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div variants={fadeInUp} className="mb-6 sm:mb-8">
              <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium">
                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                Powered by Advanced AI
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-4 sm:mb-6"
            >
              Learn Smarter with
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                AI-Powered Flashcards
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-base sm:text-lg md:text-xl text-text-secondary max-w-3xl mx-auto mb-8 sm:mb-12 px-4"
            >
              Generate personalized study materials on any topic in seconds.
              Master any subject with AI-generated quizzes, hints, and detailed analytics.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4"
            >
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto group">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Login to Account
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-12 sm:mt-16 max-w-4xl mx-auto"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="bg-surface/50 backdrop-blur-sm border border-surface-light rounded-xl p-4 sm:p-6"
                >
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-text-secondary">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-surface/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-3 sm:mb-4"
            >
              Everything You Need to Excel
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto"
            >
              Powerful features designed to accelerate your learning and help you achieve your goals
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-surface border border-surface-light rounded-xl p-6 sm:p-8 hover:border-primary/50 transition-colors"
              >
                <div className="bg-primary/10 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                  <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-text-primary mb-2 sm:mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-text-secondary">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-4 sm:mb-6">
                Why Choose AI Study Buddy?
              </h2>
              <p className="text-base sm:text-lg text-text-secondary mb-6 sm:mb-8">
                Join thousands of students who are already learning smarter, not harder.
                Our AI-powered platform adapts to your learning style and helps you achieve better results.
              </p>
              <div className="space-y-3 sm:space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mr-3 mt-0.5">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-sm sm:text-base text-text-secondary">{benefit}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl p-6 sm:p-8 md:p-12 border border-primary/20">
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="bg-surface w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center">
                      <Trophy className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-text-primary">Track Progress</div>
                      <div className="text-xs sm:text-sm text-text-secondary">Real-time analytics</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="bg-surface w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center">
                      <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-secondary" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-text-primary">Study Streaks</div>
                      <div className="text-xs sm:text-sm text-text-secondary">Build consistency</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="bg-surface w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center">
                      <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-bold text-text-primary">Smart AI</div>
                      <div className="text-xs sm:text-sm text-text-secondary">Personalized learning</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/10 to-secondary/10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-text-primary mb-4 sm:mb-6">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-text-secondary mb-8 sm:mb-10 max-w-2xl mx-auto">
            Join AI Study Buddy today and experience a smarter way to learn.
            Start generating personalized study materials in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto group">
                Create Free Account
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary mt-4 sm:mt-6">
            No credit card required • Free to start • AI-powered
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-surface border-t border-surface-light py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center">
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="ml-2 text-base sm:text-lg font-bold text-text-primary">
                AI Study Buddy
              </span>
            </div>
            <div className="text-xs sm:text-sm text-text-secondary text-center md:text-left">
              © 2025 AI Study Buddy. All rights reserved. • Powered by OpenAI
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
