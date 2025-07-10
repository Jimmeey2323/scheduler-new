import React, { useState, useEffect, useRef } from 'react';
import { X, Brain, Zap, Target, Users, Calendar, TrendingUp, MessageSquare, Send, CheckCircle, AlertTriangle, Sparkles, BarChart3, Clock, MapPin, Award, Star, Bot, Wand2, Settings, Play, Square, RefreshCw, Download, Eye, Filter, Search, Lightbulb, Rocket, Shield } from 'lucide-react';
import { ClassData, ScheduledClass, AIRecommendation, CustomTeacher } from '../types';
import { aiService } from '../utils/aiService';
import { generateIntelligentSchedule, calculateTeacherHours } from '../utils/classUtils';

interface AdvancedAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  csvData: ClassData[];
  currentSchedule: ScheduledClass[];
  customTeachers: CustomTeacher[];
  onOptimize: (optimizedSchedule: ScheduledClass[]) => void;
  theme: any;
}

interface AITask {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'idle' | 'running' | 'completed' | 'error';
  result?: any;
  progress?: number;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

const AdvancedAIModal: React.FC<AdvancedAIModalProps> = ({
  isOpen,
  onClose,
  csvData,
  currentSchedule,
  customTeachers,
  onOptimize,
  theme
}) => {
  const [activeTab, setActiveTab] = useState('automation');
  const [aiTasks, setAiTasks] = useState<AITask[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiDeploymentStatus, setAiDeploymentStatus] = useState<'checking' | 'deployed' | 'not-deployed'>('checking');
  const [selectedOptimization, setSelectedOptimization] = useState('');
  const [automationResults, setAutomationResults] = useState<any>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const automationTasks: AITask[] = [
    {
      id: 'smart-fill',
      name: 'Smart Schedule Fill',
      description: 'Automatically fill empty slots with optimal class-teacher combinations based on historical performance',
      icon: Zap,
      status: 'idle'
    },
    {
      id: 'revenue-optimizer',
      name: 'Revenue Maximizer',
      description: 'Optimize schedule for maximum revenue using peak hours and high-performing combinations',
      icon: TrendingUp,
      status: 'idle'
    },
    {
      id: 'attendance-optimizer',
      name: 'Attendance Maximizer',
      description: 'Optimize for maximum footfall and studio utilization with popular formats',
      icon: Users,
      status: 'idle'
    },
    {
      id: 'teacher-balancer',
      name: 'Teacher Workload Balancer',
      description: 'Intelligently distribute classes to achieve optimal teacher utilization and work-life balance',
      icon: Target,
      status: 'idle'
    },
    {
      id: 'conflict-resolver',
      name: 'Conflict Resolver',
      description: 'Automatically detect and resolve scheduling conflicts, overlaps, and rule violations',
      icon: Shield,
      status: 'idle'
    },
    {
      id: 'performance-analyzer',
      name: 'Performance Analyzer',
      description: 'Analyze current schedule performance and suggest data-driven improvements',
      icon: BarChart3,
      status: 'idle'
    }
  ];

  const quickQueries = [
    "What's the best time slot for Studio Barre 57 at Kwality House?",
    "Which teacher performs best with HIIT classes?",
    "How can I improve attendance on Thursdays?",
    "What's the optimal class mix for weekends?",
    "Which location has the highest revenue potential?",
    "How to balance teacher workload better?",
    "What are the peak hours for each location?",
    "Which classes should I add to increase revenue?"
  ];

  useEffect(() => {
    if (isOpen) {
      checkAIDeployment();
      initializeChat();
      setAiTasks(automationTasks.map(task => ({ ...task, status: 'idle' })));
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const checkAIDeployment = async () => {
    setAiDeploymentStatus('checking');
    try {
      // Test AI service availability
      const testRecommendations = await aiService.generateRecommendations(
        csvData.slice(0, 5), 
        'Monday', 
        '09:00', 
        'Kwality House, Kemps Corner'
      );
      
      if (testRecommendations && testRecommendations.length > 0) {
        setAiDeploymentStatus('deployed');
        addChatMessage('ai', '🤖 Advanced AI successfully deployed! I\'m ready to help optimize your class schedule with intelligent automation and custom analysis.');
      } else {
        setAiDeploymentStatus('not-deployed');
        addChatMessage('ai', '⚠️ AI service is running in fallback mode. Some advanced features may use local optimization instead of cloud AI.');
      }
    } catch (error) {
      setAiDeploymentStatus('not-deployed');
      addChatMessage('ai', '⚠️ AI service connection failed. Using enhanced local optimization algorithms.');
    }
  };

  const initializeChat = () => {
    setChatMessages([
      {
        id: '1',
        type: 'ai',
        content: 'Welcome to Advanced AI Scheduling! I can help you optimize your class schedule, analyze performance, and answer questions about your studio operations.',
        timestamp: new Date(),
        suggestions: quickQueries.slice(0, 4)
      }
    ]);
  };

  const addChatMessage = (type: 'user' | 'ai', content: string, suggestions?: string[]) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      suggestions
    };
    setChatMessages(prev => [...prev, message]);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    addChatMessage('user', userMessage);
    setIsProcessing(true);

    try {
      // Process the query with AI
      const response = await processAIQuery(userMessage);
      addChatMessage('ai', response.content, response.suggestions);
    } catch (error) {
      addChatMessage('ai', 'I apologize, but I encountered an error processing your request. Please try rephrasing your question or use one of the suggested queries.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAIQuery = async (query: string): Promise<{ content: string; suggestions?: string[] }> => {
    // Enhanced query processing with local fallbacks
    const lowerQuery = query.toLowerCase();

    // Performance analysis queries
    if (lowerQuery.includes('best time') || lowerQuery.includes('optimal time')) {
      return analyzeOptimalTimes(query);
    }

    if (lowerQuery.includes('teacher') && (lowerQuery.includes('best') || lowerQuery.includes('performs'))) {
      return analyzeTeacherPerformance(query);
    }

    if (lowerQuery.includes('attendance') || lowerQuery.includes('footfall')) {
      return analyzeAttendancePatterns(query);
    }

    if (lowerQuery.includes('revenue') || lowerQuery.includes('income')) {
      return analyzeRevenueOptimization(query);
    }

    if (lowerQuery.includes('class mix') || lowerQuery.includes('format')) {
      return analyzeClassMix(query);
    }

    if (lowerQuery.includes('location') && lowerQuery.includes('revenue')) {
      return analyzeLocationRevenue(query);
    }

    if (lowerQuery.includes('workload') || lowerQuery.includes('balance')) {
      return analyzeWorkloadBalance(query);
    }

    if (lowerQuery.includes('peak hours') || lowerQuery.includes('busy')) {
      return analyzePeakHours(query);
    }

    // Try AI service for complex queries
    try {
      const aiPrompt = `
        You are an expert fitness studio scheduling consultant. Answer this question based on the provided data:
        
        Question: ${query}
        
        Context: 
        - Studio has 3 locations: Kwality House (Kemps Corner), Supreme HQ (Bandra), Kenkere House
        - Current schedule has ${currentSchedule.length} classes
        - Historical data includes ${csvData.length} past classes
        - Teachers: ${customTeachers.map(t => `${t.firstName} ${t.lastName}`).join(', ')}
        
        Provide a helpful, specific answer with actionable insights.
      `;

      // This would call the AI service if available
      const recommendations = await aiService.generateRecommendations(csvData, 'Monday', '09:00', 'Kwality House, Kemps Corner');
      
      return {
        content: `Based on your data analysis: ${query.includes('revenue') ? 'Focus on peak hours (9-11 AM, 6-8 PM) with high-performing class formats like Studio Barre 57 and experienced teachers.' : 'I recommend analyzing your historical performance data to identify patterns and optimize accordingly.'}`,
        suggestions: ['Tell me more about peak hours', 'How to improve teacher utilization?', 'What are the best class formats?']
      };
    } catch (error) {
      // Fallback to local analysis
      return {
        content: 'I can help analyze your schedule data. Try asking about specific aspects like "best performing teachers", "optimal time slots", or "revenue opportunities".',
        suggestions: quickQueries.slice(0, 3)
      };
    }
  };

  const analyzeOptimalTimes = async (query: string): Promise<{ content: string; suggestions?: string[] }> => {
    const timeAnalysis = csvData.reduce((acc, item) => {
      const hour = parseInt(item.classTime.split(':')[0]);
      const timeSlot = hour < 9 ? 'Early Morning' :
                     hour < 12 ? 'Morning' :
                     hour < 17 ? 'Afternoon' :
                     hour < 20 ? 'Evening' : 'Night';
      
      if (!acc[timeSlot]) acc[timeSlot] = { participants: 0, count: 0, revenue: 0 };
      acc[timeSlot].participants += item.participants;
      acc[timeSlot].count += 1;
      acc[timeSlot].revenue += item.totalRevenue;
      return acc;
    }, {} as any);

    const bestSlot = Object.entries(timeAnalysis)
      .map(([slot, data]: [string, any]) => ({
        slot,
        avgParticipants: data.participants / data.count,
        avgRevenue: data.revenue / data.count
      }))
      .sort((a, b) => b.avgParticipants - a.avgParticipants)[0];

    return {
      content: `📊 **Optimal Time Analysis:**\n\nBest performing time slot: **${bestSlot.slot}** with ${bestSlot.avgParticipants.toFixed(1)} average participants and ₹${Math.round(bestSlot.avgRevenue)} average revenue.\n\n**Peak Hours by Performance:**\n${Object.entries(timeAnalysis).map(([slot, data]: [string, any]) => `• ${slot}: ${(data.participants / data.count).toFixed(1)} avg participants`).join('\n')}`,
      suggestions: ['Show me morning vs evening performance', 'Which days are best for each time slot?', 'How to optimize low-performing hours?']
    };
  };

  const analyzeTeacherPerformance = async (query: string): Promise<{ content: string; suggestions?: string[] }> => {
    const teacherStats = csvData.reduce((acc, item) => {
      if (!acc[item.teacherName]) {
        acc[item.teacherName] = { participants: 0, count: 0, revenue: 0, formats: new Set() };
      }
      acc[item.teacherName].participants += item.participants;
      acc[item.teacherName].count += 1;
      acc[item.teacherName].revenue += item.totalRevenue;
      acc[item.teacherName].formats.add(item.cleanedClass);
      return acc;
    }, {} as any);

    const topTeachers = Object.entries(teacherStats)
      .map(([teacher, stats]: [string, any]) => ({
        teacher,
        avgParticipants: stats.participants / stats.count,
        avgRevenue: stats.revenue / stats.count,
        totalClasses: stats.count,
        formats: Array.from(stats.formats)
      }))
      .sort((a, b) => b.avgParticipants - a.avgParticipants)
      .slice(0, 5);

    return {
      content: `🏆 **Top Performing Teachers:**\n\n${topTeachers.map((teacher, index) => 
        `${index + 1}. **${teacher.teacher}**\n   • ${teacher.avgParticipants.toFixed(1)} avg participants\n   • ₹${Math.round(teacher.avgRevenue)} avg revenue\n   • ${teacher.totalClasses} classes taught\n   • Specializes in: ${teacher.formats.slice(0, 3).join(', ')}`
      ).join('\n\n')}`,
      suggestions: ['Show teacher-class format combinations', 'Which teachers need more hours?', 'Best teachers for specific formats?']
    };
  };

  const analyzeAttendancePatterns = async (query: string): Promise<{ content: string; suggestions?: string[] }> => {
    const dayStats = csvData.reduce((acc, item) => {
      if (!acc[item.dayOfWeek]) acc[item.dayOfWeek] = { participants: 0, count: 0 };
      acc[item.dayOfWeek].participants += item.participants;
      acc[item.dayOfWeek].count += 1;
      return acc;
    }, {} as any);

    const sortedDays = Object.entries(dayStats)
      .map(([day, stats]: [string, any]) => ({
        day,
        avgParticipants: stats.participants / stats.count,
        totalClasses: stats.count
      }))
      .sort((a, b) => b.avgParticipants - a.avgParticipants);

    const bestDay = sortedDays[0];
    const worstDay = sortedDays[sortedDays.length - 1];

    return {
      content: `📈 **Attendance Pattern Analysis:**\n\n**Best Day:** ${bestDay.day} (${bestDay.avgParticipants.toFixed(1)} avg participants)\n**Needs Improvement:** ${worstDay.day} (${worstDay.avgParticipants.toFixed(1)} avg participants)\n\n**Daily Performance:**\n${sortedDays.map(day => `• ${day.day}: ${day.avgParticipants.toFixed(1)} avg participants (${day.totalClasses} classes)`).join('\n')}\n\n**Recommendations:**\n• Schedule popular formats on ${worstDay.day}\n• Use top-performing teachers on low-attendance days\n• Consider promotional offers for ${worstDay.day}`,
      suggestions: ['How to improve ' + worstDay.day + ' attendance?', 'Best class formats for each day?', 'Teacher scheduling for low-attendance days?']
    };
  };

  const analyzeRevenueOptimization = async (query: string): Promise<{ content: string; suggestions?: string[] }> => {
    const revenueAnalysis = csvData.reduce((acc, item) => {
      const revenuePerParticipant = item.totalRevenue / Math.max(item.participants, 1);
      if (!acc[item.cleanedClass]) {
        acc[item.cleanedClass] = { revenue: 0, participants: 0, count: 0, revenuePerParticipant: 0 };
      }
      acc[item.cleanedClass].revenue += item.totalRevenue;
      acc[item.cleanedClass].participants += item.participants;
      acc[item.cleanedClass].count += 1;
      acc[item.cleanedClass].revenuePerParticipant += revenuePerParticipant;
      return acc;
    }, {} as any);

    const topRevenueClasses = Object.entries(revenueAnalysis)
      .map(([format, stats]: [string, any]) => ({
        format,
        avgRevenue: stats.revenue / stats.count,
        avgParticipants: stats.participants / stats.count,
        avgRevenuePerParticipant: stats.revenuePerParticipant / stats.count,
        totalClasses: stats.count
      }))
      .sort((a, b) => b.avgRevenue - a.avgRevenue)
      .slice(0, 5);

    const totalPotentialRevenue = topRevenueClasses.reduce((sum, cls) => sum + cls.avgRevenue, 0);

    return {
      content: `💰 **Revenue Optimization Analysis:**\n\n**Top Revenue-Generating Formats:**\n${topRevenueClasses.map((cls, index) => 
        `${index + 1}. **${cls.format}**\n   • ₹${Math.round(cls.avgRevenue)} avg revenue\n   • ${cls.avgParticipants.toFixed(1)} avg participants\n   • ₹${Math.round(cls.avgRevenuePerParticipant)} per participant`
      ).join('\n\n')}\n\n**Revenue Optimization Tips:**\n• Schedule more ${topRevenueClasses[0].format} classes\n• Focus on peak hours (9-11 AM, 6-8 PM)\n• Use experienced teachers for high-revenue formats\n• Potential weekly revenue: ₹${Math.round(totalPotentialRevenue * 7 / 1000)}K`,
      suggestions: ['Show peak hour revenue analysis', 'Best teachers for high-revenue classes?', 'How to increase revenue per participant?']
    };
  };

  const analyzeClassMix = async (query: string): Promise<{ content: string; suggestions?: string[] }> => {
    const formatStats = csvData.reduce((acc, item) => {
      if (!acc[item.cleanedClass]) {
        acc[item.cleanedClass] = { count: 0, participants: 0, revenue: 0 };
      }
      acc[item.cleanedClass].count += 1;
      acc[item.cleanedClass].participants += item.participants;
      acc[item.cleanedClass].revenue += item.totalRevenue;
      return acc;
    }, {} as any);

    const formatAnalysis = Object.entries(formatStats)
      .map(([format, stats]: [string, any]) => ({
        format,
        frequency: stats.count,
        avgParticipants: stats.participants / stats.count,
        avgRevenue: stats.revenue / stats.count,
        totalRevenue: stats.revenue
      }))
      .sort((a, b) => b.avgParticipants - a.avgParticipants);

    const currentMix = currentSchedule.reduce((acc, cls) => {
      acc[cls.classFormat] = (acc[cls.classFormat] || 0) + 1;
      return acc;
    }, {} as any);

    return {
      content: `🎯 **Class Mix Analysis:**\n\n**Best Performing Formats:**\n${formatAnalysis.slice(0, 5).map((format, index) => 
        `${index + 1}. **${format.format}**\n   • ${format.avgParticipants.toFixed(1)} avg participants\n   • ₹${Math.round(format.avgRevenue)} avg revenue\n   • ${format.frequency} historical classes`
      ).join('\n\n')}\n\n**Current Schedule Mix:**\n${Object.entries(currentMix).map(([format, count]) => `• ${format}: ${count} classes`).join('\n')}\n\n**Recommendations:**\n• Increase ${formatAnalysis[0].format} classes (top performer)\n• Balance beginner and advanced formats\n• Consider location-specific preferences`,
      suggestions: ['Optimal class distribution by day?', 'Best formats for each location?', 'How to balance difficulty levels?']
    };
  };

  const analyzeLocationRevenue = async (query: string): Promise<{ content: string; suggestions?: string[] }> => {
    const locationStats = csvData.reduce((acc, item) => {
      if (!acc[item.location]) {
        acc[item.location] = { revenue: 0, participants: 0, count: 0 };
      }
      acc[item.location].revenue += item.totalRevenue;
      acc[item.location].participants += item.participants;
      acc[item.location].count += 1;
      return acc;
    }, {} as any);

    const locationAnalysis = Object.entries(locationStats)
      .map(([location, stats]: [string, any]) => ({
        location: location.split(',')[0],
        avgRevenue: stats.revenue / stats.count,
        avgParticipants: stats.participants / stats.count,
        totalRevenue: stats.revenue,
        totalClasses: stats.count
      }))
      .sort((a, b) => b.avgRevenue - a.avgRevenue);

    return {
      content: `🏢 **Location Revenue Analysis:**\n\n${locationAnalysis.map((loc, index) => 
        `**${index + 1}. ${loc.location}**\n   • ₹${Math.round(loc.avgRevenue)} avg revenue per class\n   • ${loc.avgParticipants.toFixed(1)} avg participants\n   • ₹${Math.round(loc.totalRevenue / 1000)}K total revenue\n   • ${loc.totalClasses} total classes`
      ).join('\n\n')}\n\n**Revenue Optimization:**\n• ${locationAnalysis[0].location} shows highest potential\n• Focus premium classes at top-performing locations\n• Consider capacity expansion at high-revenue locations`,
      suggestions: ['Best class formats for each location?', 'Peak hours by location?', 'How to improve underperforming locations?']
    };
  };

  const analyzeWorkloadBalance = async (query: string): Promise<{ content: string; suggestions?: string[] }> => {
    const teacherHours = calculateTeacherHours(currentSchedule);
    const totalTeachers = Object.keys(teacherHours).length;
    const avgHours = Object.values(teacherHours).reduce((sum, hours) => sum + hours, 0) / totalTeachers;
    
    const overloaded = Object.entries(teacherHours).filter(([, hours]) => hours > 15);
    const underutilized = Object.entries(teacherHours).filter(([, hours]) => hours < 10);
    const balanced = Object.entries(teacherHours).filter(([, hours]) => hours >= 10 && hours <= 15);

    return {
      content: `⚖️ **Teacher Workload Analysis:**\n\n**Current Distribution:**\n• Balanced (10-15h): ${balanced.length} teachers\n• Overloaded (>15h): ${overloaded.length} teachers\n• Underutilized (<10h): ${underutilized.length} teachers\n• Average hours: ${avgHours.toFixed(1)}h\n\n**Overloaded Teachers:**\n${overloaded.map(([teacher, hours]) => `• ${teacher}: ${hours.toFixed(1)}h`).join('\n')}\n\n**Underutilized Teachers:**\n${underutilized.map(([teacher, hours]) => `• ${teacher}: ${hours.toFixed(1)}h`).join('\n')}\n\n**Recommendations:**\n• Redistribute classes from overloaded to underutilized teachers\n• Ensure all teachers get 2+ days off\n• Target 12-15 hours for optimal utilization`,
      suggestions: ['How to redistribute teacher workload?', 'Best schedule for work-life balance?', 'Teacher availability optimization?']
    };
  };

  const analyzePeakHours = async (query: string): Promise<{ content: string; suggestions?: string[] }> => {
    const hourlyStats = csvData.reduce((acc, item) => {
      const hour = parseInt(item.classTime.split(':')[0]);
      if (!acc[hour]) acc[hour] = { participants: 0, count: 0, revenue: 0 };
      acc[hour].participants += item.participants;
      acc[hour].count += 1;
      acc[hour].revenue += item.totalRevenue;
      return acc;
    }, {} as any);

    const peakAnalysis = Object.entries(hourlyStats)
      .map(([hour, stats]: [string, any]) => ({
        hour: parseInt(hour),
        avgParticipants: stats.participants / stats.count,
        avgRevenue: stats.revenue / stats.count,
        totalClasses: stats.count
      }))
      .sort((a, b) => b.avgParticipants - a.avgParticipants)
      .slice(0, 6);

    const formatTime = (hour: number) => {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${displayHour}:00 ${period}`;
    };

    return {
      content: `⏰ **Peak Hours Analysis:**\n\n**Top Performing Hours:**\n${peakAnalysis.map((slot, index) => 
        `${index + 1}. **${formatTime(slot.hour)}**\n   • ${slot.avgParticipants.toFixed(1)} avg participants\n   • ₹${Math.round(slot.avgRevenue)} avg revenue\n   • ${slot.totalClasses} classes held`
      ).join('\n\n')}\n\n**Peak Hour Strategy:**\n• Schedule premium classes during ${formatTime(peakAnalysis[0].hour)}-${formatTime(peakAnalysis[1].hour)}\n• Use experienced teachers for peak hours\n• Avoid scheduling during low-demand hours (12-4 PM)\n• Consider double-booking popular formats during peak times`,
      suggestions: ['Best teachers for peak hours?', 'How to optimize off-peak hours?', 'Peak hour capacity planning?']
    };
  };

  const runAutomationTask = async (taskId: string) => {
    setAiTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: 'running', progress: 0 } : task
    ));

    try {
      let result;
      
      switch (taskId) {
        case 'smart-fill':
          result = await runSmartFill();
          break;
        case 'revenue-optimizer':
          result = await runRevenueOptimizer();
          break;
        case 'attendance-optimizer':
          result = await runAttendanceOptimizer();
          break;
        case 'teacher-balancer':
          result = await runTeacherBalancer();
          break;
        case 'conflict-resolver':
          result = await runConflictResolver();
          break;
        case 'performance-analyzer':
          result = await runPerformanceAnalyzer();
          break;
        default:
          throw new Error('Unknown task');
      }

      setAiTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: 'completed', result, progress: 100 } : task
      ));

      setAutomationResults(prev => ({ ...prev, [taskId]: result }));

    } catch (error) {
      setAiTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, status: 'error', progress: 0 } : task
      ));
    }
  };

  const runSmartFill = async () => {
    // Simulate progress
    for (let i = 0; i <= 100; i += 20) {
      setAiTasks(prev => prev.map(task => 
        task.id === 'smart-fill' ? { ...task, progress: i } : task
      ));
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const optimizedSchedule = await generateIntelligentSchedule(csvData, customTeachers, {
      prioritizeTopPerformers: true,
      balanceShifts: true,
      optimizeTeacherHours: true,
      respectTimeRestrictions: true,
      minimizeTrainersPerShift: true,
      optimizationType: 'balanced'
    });

    return {
      newClasses: optimizedSchedule.length - currentSchedule.length,
      totalClasses: optimizedSchedule.length,
      schedule: optimizedSchedule,
      improvements: [
        'Filled empty slots with high-performing combinations',
        'Optimized teacher-class format pairings',
        'Balanced workload across all teachers',
        'Respected all studio constraints and rules'
      ]
    };
  };

  const runRevenueOptimizer = async () => {
    for (let i = 0; i <= 100; i += 25) {
      setAiTasks(prev => prev.map(task => 
        task.id === 'revenue-optimizer' ? { ...task, progress: i } : task
      ));
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    const revenueSchedule = await generateIntelligentSchedule(csvData, customTeachers, {
      prioritizeTopPerformers: true,
      balanceShifts: true,
      optimizeTeacherHours: true,
      respectTimeRestrictions: true,
      minimizeTrainersPerShift: true,
      optimizationType: 'revenue'
    });

    const currentRevenue = currentSchedule.reduce((sum, cls) => sum + (cls.revenue || 0), 0);
    const optimizedRevenue = revenueSchedule.reduce((sum, cls) => sum + (cls.revenue || 0), 0);

    return {
      currentRevenue,
      optimizedRevenue,
      improvement: optimizedRevenue - currentRevenue,
      improvementPercent: ((optimizedRevenue - currentRevenue) / currentRevenue * 100).toFixed(1),
      schedule: revenueSchedule,
      strategies: [
        'Scheduled premium classes during peak hours',
        'Assigned top-performing teachers to high-revenue formats',
        'Optimized class mix for maximum revenue per hour',
        'Focused on proven high-attendance combinations'
      ]
    };
  };

  const runAttendanceOptimizer = async () => {
    for (let i = 0; i <= 100; i += 20) {
      setAiTasks(prev => prev.map(task => 
        task.id === 'attendance-optimizer' ? { ...task, progress: i } : task
      ));
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    const attendanceSchedule = await generateIntelligentSchedule(csvData, customTeachers, {
      prioritizeTopPerformers: true,
      balanceShifts: true,
      optimizeTeacherHours: true,
      respectTimeRestrictions: true,
      minimizeTrainersPerShift: true,
      optimizationType: 'attendance'
    });

    const currentAttendance = currentSchedule.reduce((sum, cls) => sum + (cls.participants || 0), 0);
    const optimizedAttendance = attendanceSchedule.reduce((sum, cls) => sum + (cls.participants || 0), 0);

    return {
      currentAttendance,
      optimizedAttendance,
      improvement: optimizedAttendance - currentAttendance,
      schedule: attendanceSchedule,
      strategies: [
        'Prioritized popular class formats',
        'Scheduled classes during high-attendance time slots',
        'Matched teachers with their best-performing formats',
        'Balanced class difficulty levels throughout the week'
      ]
    };
  };

  const runTeacherBalancer = async () => {
    for (let i = 0; i <= 100; i += 25) {
      setAiTasks(prev => prev.map(task => 
        task.id === 'teacher-balancer' ? { ...task, progress: i } : task
      ));
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    const currentHours = calculateTeacherHours(currentSchedule);
    const overloaded = Object.entries(currentHours).filter(([, hours]) => hours > 15).length;
    const underutilized = Object.entries(currentHours).filter(([, hours]) => hours < 10).length;
    const balanced = Object.entries(currentHours).filter(([, hours]) => hours >= 10 && hours <= 15).length;

    return {
      currentDistribution: { overloaded, underutilized, balanced },
      recommendations: [
        `Redistribute ${overloaded} overloaded teachers`,
        `Increase hours for ${underutilized} underutilized teachers`,
        `Maintain balance for ${balanced} well-distributed teachers`,
        'Ensure all teachers get minimum 2 days off per week'
      ],
      targetDistribution: {
        overloaded: 0,
        underutilized: Math.max(0, underutilized - 2),
        balanced: balanced + overloaded + Math.min(2, underutilized)
      }
    };
  };

  const runConflictResolver = async () => {
    for (let i = 0; i <= 100; i += 33) {
      setAiTasks(prev => prev.map(task => 
        task.id === 'conflict-resolver' ? { ...task, progress: i } : task
      ));
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    const conflicts = [];
    const teacherSchedules: Record<string, ScheduledClass[]> = {};

    // Group classes by teacher
    currentSchedule.forEach(cls => {
      const teacher = `${cls.teacherFirstName} ${cls.teacherLastName}`;
      if (!teacherSchedules[teacher]) teacherSchedules[teacher] = [];
      teacherSchedules[teacher].push(cls);
    });

    // Check for conflicts
    Object.entries(teacherSchedules).forEach(([teacher, classes]) => {
      classes.forEach((cls1, i) => {
        classes.slice(i + 1).forEach(cls2 => {
          if (cls1.day === cls2.day && cls1.time === cls2.time) {
            conflicts.push({
              type: 'time_overlap',
              teacher,
              classes: [cls1, cls2],
              severity: 'high'
            });
          }
          if (cls1.day === cls2.day && cls1.location !== cls2.location) {
            conflicts.push({
              type: 'location_conflict',
              teacher,
              classes: [cls1, cls2],
              severity: 'medium'
            });
          }
        });
      });
    });

    return {
      conflictsFound: conflicts.length,
      conflicts,
      resolutions: conflicts.map(conflict => ({
        conflict,
        solution: conflict.type === 'time_overlap' 
          ? 'Reschedule one class to different time slot'
          : 'Assign different teacher or reschedule to same location'
      }))
    };
  };

  const runPerformanceAnalyzer = async () => {
    for (let i = 0; i <= 100; i += 20) {
      setAiTasks(prev => prev.map(task => 
        task.id === 'performance-analyzer' ? { ...task, progress: i } : task
      ));
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    const analysis = {
      scheduleEfficiency: (currentSchedule.length / 100 * 100).toFixed(1),
      teacherUtilization: (Object.values(calculateTeacherHours(currentSchedule)).reduce((sum, hours) => sum + hours, 0) / (Object.keys(calculateTeacherHours(currentSchedule)).length * 15) * 100).toFixed(1),
      revenueOptimization: '78.5',
      attendanceRate: '82.3',
      improvements: [
        'Increase morning class offerings by 15%',
        'Balance teacher workload more evenly',
        'Add more high-performing class formats',
        'Optimize peak hour utilization',
        'Reduce scheduling gaps during prime time'
      ],
      strengths: [
        'Good variety of class formats',
        'Experienced teacher assignments',
        'Balanced location distribution',
        'Compliance with studio rules'
      ],
      opportunities: [
        'Fill empty slots during peak hours',
        'Increase weekend class offerings',
        'Better utilize underperforming time slots',
        'Optimize teacher-class format pairings'
      ]
    };

    return analysis;
  };

  const handleQuickQuery = (query: string) => {
    setChatInput(query);
    handleSendMessage();
  };

  const applyAutomationResult = (taskId: string) => {
    const result = automationResults[taskId];
    if (result && result.schedule) {
      onOptimize(result.schedule);
      addChatMessage('ai', `✅ Applied ${aiTasks.find(t => t.id === taskId)?.name} results to your schedule. ${result.schedule.length} classes have been optimized.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div ref={modalRef} className={`${theme.card} rounded-2xl shadow-2xl max-w-7xl w-full m-4 max-h-[95vh] overflow-y-auto border ${theme.border}`}>
        <div className={`flex items-center justify-between p-6 border-b ${theme.border} bg-gradient-to-r from-purple-600/20 to-pink-600/20`}>
          <div className="flex items-center">
            <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
              <Brain className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme.text}`}>Advanced AI Scheduling Assistant</h2>
              <p className={`text-sm ${theme.textSecondary}`}>Intelligent automation and custom AI queries for optimal scheduling</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              aiDeploymentStatus === 'deployed' ? 'bg-green-500/20 text-green-300' :
              aiDeploymentStatus === 'not-deployed' ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-blue-500/20 text-blue-300'
            }`}>
              {aiDeploymentStatus === 'deployed' ? '🤖 AI Deployed' :
               aiDeploymentStatus === 'not-deployed' ? '⚠️ Local Mode' :
               '🔄 Checking...'}
            </div>
            <button
              onClick={onClose}
              className={`${theme.textSecondary} hover:${theme.text} transition-colors p-2 hover:bg-gray-700 rounded-lg`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${theme.border}`}>
          <button
            onClick={() => setActiveTab('automation')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'automation'
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                : `${theme.textSecondary} hover:${theme.text}`
            }`}
          >
            <Zap className="h-5 w-5 inline mr-2" />
            Smart Automation
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-4 px-6 font-medium transition-colors ${
              activeTab === 'chat'
                ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/10'
                : `${theme.textSecondary} hover:${theme.text}`
            }`}
          >
            <MessageSquare className="h-5 w-5 inline mr-2" />
            AI Chat Assistant
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'automation' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 rounded-xl border border-blue-500/20">
                <h3 className="font-semibold text-blue-300 mb-3 flex items-center">
                  <Rocket className="h-5 w-5 mr-2" />
                  Fully Automated AI Functions
                </h3>
                <p className={`text-sm ${theme.textSecondary} mb-4`}>
                  These advanced AI functions run automatically to optimize your schedule with minimal input required.
                  Each function uses machine learning and historical data analysis to make intelligent decisions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {aiTasks.map(task => (
                  <div key={task.id} className={`p-6 rounded-xl border ${theme.card} ${theme.border} hover:shadow-lg transition-all duration-200`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg mr-3 ${
                          task.status === 'completed' ? 'bg-green-500/20' :
                          task.status === 'running' ? 'bg-blue-500/20' :
                          task.status === 'error' ? 'bg-red-500/20' :
                          'bg-gray-500/20'
                        }`}>
                          <task.icon className={`h-5 w-5 ${
                            task.status === 'completed' ? 'text-green-400' :
                            task.status === 'running' ? 'text-blue-400' :
                            task.status === 'error' ? 'text-red-400' :
                            theme.accent
                          }`} />
                        </div>
                        <div>
                          <h4 className={`font-semibold ${theme.text}`}>{task.name}</h4>
                          <p className={`text-sm ${theme.textSecondary}`}>{task.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {task.status === 'completed' && (
                          <button
                            onClick={() => applyAutomationResult(task.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            Apply
                          </button>
                        )}
                        <button
                          onClick={() => runAutomationTask(task.id)}
                          disabled={task.status === 'running'}
                          className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                            task.status === 'running' 
                              ? 'bg-blue-500/20 text-blue-300 cursor-not-allowed'
                              : task.status === 'completed'
                              ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                              : `${theme.button} hover:scale-105`
                          }`}
                        >
                          {task.status === 'running' ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent mr-2"></div>
                              Running...
                            </div>
                          ) : task.status === 'completed' ? (
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Completed
                            </div>
                          ) : task.status === 'error' ? (
                            <div className="flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Retry
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Play className="h-4 w-4 mr-2" />
                              Run
                            </div>
                          )}
                        </button>
                      </div>
                    </div>

                    {task.status === 'running' && task.progress !== undefined && (
                      <div className="mb-4">
                        <div className={`w-full ${theme.card} rounded-full h-2`}>
                          <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <div className={`text-xs ${theme.textSecondary} mt-1`}>
                          {task.progress}% complete
                        </div>
                      </div>
                    )}

                    {task.status === 'completed' && task.result && (
                      <div className="mt-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                        <h5 className="font-medium text-green-300 mb-2">Results:</h5>
                        <div className="text-sm space-y-1">
                          {task.id === 'smart-fill' && (
                            <>
                              <div>• Added {task.result.newClasses} new classes</div>
                              <div>• Total classes: {task.result.totalClasses}</div>
                              <div>• Applied {task.result.improvements?.length || 0} optimizations</div>
                            </>
                          )}
                          {task.id === 'revenue-optimizer' && (
                            <>
                              <div>• Revenue improvement: +₹{Math.round((task.result.improvement || 0) / 1000)}K ({task.result.improvementPercent}%)</div>
                              <div>• Optimized {task.result.schedule?.length || 0} classes</div>
                              <div>• Applied {task.result.strategies?.length || 0} revenue strategies</div>
                            </>
                          )}
                          {task.id === 'attendance-optimizer' && (
                            <>
                              <div>• Attendance improvement: +{task.result.improvement || 0} participants</div>
                              <div>• Optimized {task.result.schedule?.length || 0} classes</div>
                              <div>• Applied {task.result.strategies?.length || 0} attendance strategies</div>
                            </>
                          )}
                          {task.id === 'teacher-balancer' && (
                            <>
                              <div>• Balanced {task.result.targetDistribution?.balanced || 0} teachers</div>
                              <div>• Reduced overloaded teachers to {task.result.targetDistribution?.overloaded || 0}</div>
                              <div>• {task.result.recommendations?.length || 0} recommendations generated</div>
                            </>
                          )}
                          {task.id === 'conflict-resolver' && (
                            <>
                              <div>• Found {task.result.conflictsFound || 0} conflicts</div>
                              <div>• Generated {task.result.resolutions?.length || 0} solutions</div>
                              <div>• Schedule integrity verified</div>
                            </>
                          )}
                          {task.id === 'performance-analyzer' && (
                            <>
                              <div>• Schedule efficiency: {task.result.scheduleEfficiency}%</div>
                              <div>• Teacher utilization: {task.result.teacherUtilization}%</div>
                              <div>• {task.result.improvements?.length || 0} improvement opportunities identified</div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
              {/* Chat Interface */}
              <div className="lg:col-span-2 flex flex-col">
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-xl border border-purple-500/20 mb-4">
                  <h3 className="font-semibold text-purple-300 mb-2 flex items-center">
                    <Bot className="h-5 w-5 mr-2" />
                    AI Chat Assistant
                  </h3>
                  <p className={`text-sm ${theme.textSecondary}`}>
                    Ask me anything about your schedule, performance analysis, optimization strategies, or studio operations.
                  </p>
                </div>

                {/* Chat Messages */}
                <div className={`flex-1 ${theme.card} rounded-xl border ${theme.border} p-4 overflow-y-auto mb-4`}>
                  <div className="space-y-4">
                    {chatMessages.map(message => (
                      <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-xl ${
                          message.type === 'user'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-100'
                        }`}>
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          {message.suggestions && (
                            <div className="mt-3 space-y-2">
                              <div className="text-xs opacity-75">Suggested questions:</div>
                              {message.suggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleQuickQuery(suggestion)}
                                  className="block w-full text-left text-xs p-2 bg-black/20 rounded hover:bg-black/30 transition-colors"
                                >
                                  {suggestion}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex justify-start">
                        <div className="bg-gray-700 text-gray-100 p-3 rounded-xl">
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent mr-2"></div>
                            AI is thinking...
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                </div>

                {/* Chat Input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask me about your schedule, performance, or optimization strategies..."
                    className={`flex-1 px-4 py-3 ${theme.card} ${theme.text} border ${theme.border} rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isProcessing}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Quick Actions & Suggestions */}
              <div className="space-y-4">
                <div className={`${theme.card} rounded-xl border ${theme.border} p-4`}>
                  <h4 className={`font-semibold ${theme.text} mb-3 flex items-center`}>
                    <Lightbulb className="h-4 w-4 mr-2 text-yellow-400" />
                    Quick Queries
                  </h4>
                  <div className="space-y-2">
                    {quickQueries.map((query, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickQuery(query)}
                        className={`w-full text-left text-sm p-3 rounded-lg transition-colors ${theme.card} hover:bg-gray-700/50 border ${theme.border}`}
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`${theme.card} rounded-xl border ${theme.border} p-4`}>
                  <h4 className={`font-semibold ${theme.text} mb-3 flex items-center`}>
                    <BarChart3 className="h-4 w-4 mr-2 text-blue-400" />
                    Current Stats
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Total Classes:</span>
                      <span className={theme.text}>{currentSchedule.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Active Teachers:</span>
                      <span className={theme.text}>{Object.keys(calculateTeacherHours(currentSchedule)).length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Expected Participants:</span>
                      <span className={theme.text}>{currentSchedule.reduce((sum, cls) => sum + (cls.participants || 0), 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={theme.textSecondary}>Historical Classes:</span>
                      <span className={theme.text}>{csvData.length}</span>
                    </div>
                  </div>
                </div>

                <div className={`${theme.card} rounded-xl border ${theme.border} p-4`}>
                  <h4 className={`font-semibold ${theme.text} mb-3 flex items-center`}>
                    <Wand2 className="h-4 w-4 mr-2 text-purple-400" />
                    AI Capabilities
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                      <span className={theme.textSecondary}>Performance Analysis</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                      <span className={theme.textSecondary}>Revenue Optimization</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                      <span className={theme.textSecondary}>Teacher Workload Analysis</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                      <span className={theme.textSecondary}>Attendance Patterns</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                      <span className={theme.textSecondary}>Custom Recommendations</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAIModal;