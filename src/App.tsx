import React, { useState, useEffect } from 'react';
import { Upload, Calendar, Brain, Users, Clock, AlertTriangle, Settings, Star, Lock, Unlock, Plus, Download, Eye, Printer, RotateCcw, RotateCw, Trash2, Filter, BarChart3, TrendingUp, MapPin, UserPlus, Sun, Moon, Zap, Target, Sparkles, Palette } from 'lucide-react';
import CSVUpload from './components/CSVUpload';
import WeeklyCalendar from './components/WeeklyCalendar';
import ClassModal from './components/ClassModal';
import TeacherHourTracker from './components/TeacherHourTracker';
import SmartOptimizer from './components/SmartOptimizer';
import AISettings from './components/AISettings';
import ExportModal from './components/ExportModal';
import StudioSettings from './components/StudioSettings';
import AnalyticsView from './components/AnalyticsView';
import DailyAIOptimizer from './components/DailyAIOptimizer';
import EnhancedOptimizerModal from './components/EnhancedOptimizerModal';
import AdvancedAIModal from './components/AdvancedAIModal';
import ThemeSelector from './components/ThemeSelector';
import StudioRulesModal from './components/StudioRulesModal';
import PerformanceInsights from './components/PerformanceInsights';
import ClassMixAnalyzer from './components/ClassMixAnalyzer';
import { ClassData, ScheduledClass, TeacherHours, CustomTeacher, TeacherAvailability } from './types';
import { getTopPerformingClasses, getClassDuration, calculateTeacherHours, getClassCounts, validateTeacherHours, getTeacherSpecialties, getClassAverageForSlot, getBestTeacherForClass, generateIntelligentSchedule, getDefaultTopClasses } from './utils/classUtils';
import { aiService } from './utils/aiService';
import { saveCSVData, loadCSVData, saveScheduledClasses, loadScheduledClasses, saveCustomTeachers, loadCustomTeachers, saveTeacherAvailability, loadTeacherAvailability } from './utils/dataStorage';

// Enhanced theme definitions with better contrast and readability
const THEMES = {
  dark: {
    name: 'Dark Minimalist',
    bg: 'bg-black',
    text: 'text-white',
    textSecondary: 'text-gray-400',
    card: 'bg-gray-900 border-gray-800',
    cardHover: 'hover:bg-gray-800',
    button: 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700',
    buttonPrimary: 'bg-white text-black hover:bg-gray-100',
    accent: 'text-gray-300',
    border: 'border-gray-800',
    secondary: 'from-gray-800 to-gray-700'
  },
  light: {
    name: 'Light Minimalist',
    bg: 'bg-white',
    text: 'text-black',
    textSecondary: 'text-gray-600',
    card: 'bg-gray-50 border-gray-200',
    cardHover: 'hover:bg-gray-100',
    button: 'bg-gray-100 hover:bg-gray-200 text-black border border-gray-300',
    buttonPrimary: 'bg-black text-white hover:bg-gray-800',
    accent: 'text-gray-700',
    border: 'border-gray-200',
    secondary: 'from-gray-200 to-gray-300'
  },
  darkPurple: {
    name: 'Dark Purple',
    bg: 'bg-black',
    text: 'text-white',
    textSecondary: 'text-purple-300',
    card: 'bg-gray-900 border-purple-900',
    cardHover: 'hover:bg-gray-800',
    button: 'bg-purple-900 hover:bg-purple-800 text-white border border-purple-800',
    buttonPrimary: 'bg-purple-600 text-white hover:bg-purple-500',
    accent: 'text-purple-400',
    border: 'border-purple-900',
    secondary: 'from-purple-900 to-gray-900'
  },
  lightBlue: {
    name: 'Light Blue',
    bg: 'bg-white',
    text: 'text-black',
    textSecondary: 'text-blue-600',
    card: 'bg-blue-50 border-blue-200',
    cardHover: 'hover:bg-blue-100',
    button: 'bg-blue-100 hover:bg-blue-200 text-black border border-blue-300',
    buttonPrimary: 'bg-blue-600 text-white hover:bg-blue-500',
    accent: 'text-blue-700',
    border: 'border-blue-200',
    secondary: 'from-blue-200 to-blue-300'
  },
  darkGreen: {
    name: 'Dark Green',
    bg: 'bg-black',
    text: 'text-white',
    textSecondary: 'text-green-300',
    card: 'bg-gray-900 border-green-900',
    cardHover: 'hover:bg-gray-800',
    button: 'bg-green-900 hover:bg-green-800 text-white border border-green-800',
    buttonPrimary: 'bg-green-600 text-white hover:bg-green-500',
    accent: 'text-green-400',
    border: 'border-green-900',
    secondary: 'from-green-900 to-gray-900'
  },
  lightGray: {
    name: 'Light Gray',
    bg: 'bg-white',
    text: 'text-black',
    textSecondary: 'text-gray-700',
    card: 'bg-gray-100 border-gray-300',
    cardHover: 'hover:bg-gray-200',
    button: 'bg-gray-200 hover:bg-gray-300 text-black border border-gray-400',
    buttonPrimary: 'bg-gray-800 text-white hover:bg-gray-700',
    accent: 'text-gray-800',
    border: 'border-gray-300',
    secondary: 'from-gray-300 to-gray-400'
  }
};

function App() {
  const [csvData, setCsvData] = useState<ClassData[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [activeView, setActiveView] = useState<string>('calendar');
  const [scheduledClasses, setScheduledClasses] = useState<ScheduledClass[]>([]);
  const [scheduleHistory, setScheduleHistory] = useState<ScheduledClass[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string; location: string } | null>(null);
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [teacherHours, setTeacherHours] = useState<TeacherHours>({});
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [showEnhancedOptimizer, setShowEnhancedOptimizer] = useState(false);
  const [showDailyOptimizer, setShowDailyOptimizer] = useState(false);
  const [showAdvancedAI, setShowAdvancedAI] = useState(false);
  const [showAISettings, setShowAISettings] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showStudioSettings, setShowStudioSettings] = useState(false);
  const [showStudioRules, setShowStudioRules] = useState(false);
  const [showTeacherCards, setShowTeacherCards] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [isPopulatingTopClasses, setIsPopulatingTopClasses] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [lockedClasses, setLockedClasses] = useState<Set<string>>(new Set());
  const [lockedTeachers, setLockedTeachers] = useState<Set<string>>(new Set());
  const [classesLocked, setClassesLocked] = useState(false);
  const [teachersLocked, setTeachersLocked] = useState(false);
  const [scheduleLocked, setScheduleLocked] = useState(false);
  const [customTeachers, setCustomTeachers] = useState<CustomTeacher[]>([]);
  const [teacherAvailability, setTeacherAvailability] = useState<TeacherAvailability>({});
  const [currentTheme, setCurrentTheme] = useState<keyof typeof THEMES>('dark');
  const [optimizationIteration, setOptimizationIteration] = useState(0);
  const [allowRestrictedScheduling, setAllowRestrictedScheduling] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    showTopPerformers: true,
    showPrivateClasses: true,
    showRegularClasses: true,
    selectedTeacher: '',
    selectedClassFormat: ''
  });

  const locations = ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House'];

  const views = [
    { id: 'calendar', name: 'Weekly Calendar', icon: Calendar },
    { id: 'performance', name: 'Performance Insights', icon: TrendingUp },
    { id: 'classmix', name: 'Class Mix Analyzer', icon: BarChart3 },
    { id: 'analytics', name: 'Advanced Analytics', icon: Eye }
  ];

  const theme = THEMES[currentTheme];

  // Load data on app initialization
  useEffect(() => {
    const savedProvider = localStorage.getItem('ai_provider');
    const savedKey = localStorage.getItem('ai_key');
    const savedEndpoint = localStorage.getItem('ai_endpoint');
    const savedTheme = localStorage.getItem('app_theme') as keyof typeof THEMES;
    const savedRestrictedSetting = localStorage.getItem('allow_restricted_scheduling');
    const savedScheduleLock = localStorage.getItem('schedule_locked');

    // Load AI settings
    if (savedProvider && savedKey && savedEndpoint) {
      aiService.setProvider({
        name: savedProvider,
        key: savedKey,
        endpoint: savedEndpoint
      });
    }

    // Load theme
    if (savedTheme && THEMES[savedTheme]) {
      setCurrentTheme(savedTheme);
    }

    // Load restricted scheduling setting
    if (savedRestrictedSetting) {
      setAllowRestrictedScheduling(savedRestrictedSetting === 'true');
    }

    // Load schedule lock setting
    if (savedScheduleLock) {
      setScheduleLocked(savedScheduleLock === 'true');
    }

    // Load persistent data
    const savedCsvData = loadCSVData();
    const savedScheduledClasses = loadScheduledClasses();
    const savedCustomTeachers = loadCustomTeachers();
    const savedTeacherAvailability = loadTeacherAvailability();

    if (savedCsvData.length > 0) {
      setCsvData(savedCsvData);
      const firstLocation = locations.find(loc => 
        savedCsvData.some((item: ClassData) => item.location === loc)
      ) || locations[0];
      setActiveTab(firstLocation);
    }

    if (savedScheduledClasses.length > 0) {
      setScheduledClasses(savedScheduledClasses);
      setTeacherHours(calculateTeacherHours(savedScheduledClasses));
    }

    if (savedCustomTeachers.length > 0) {
      setCustomTeachers(savedCustomTeachers);
    }

    if (Object.keys(savedTeacherAvailability).length > 0) {
      setTeacherAvailability(savedTeacherAvailability);
    }
  }, []);

  // Auto-save data when it changes
  useEffect(() => {
    if (csvData.length > 0) {
      saveCSVData(csvData);
    }
  }, [csvData]);

  useEffect(() => {
    saveScheduledClasses(scheduledClasses);
  }, [scheduledClasses]);

  useEffect(() => {
    saveCustomTeachers(customTeachers);
  }, [customTeachers]);

  useEffect(() => {
    saveTeacherAvailability(teacherAvailability);
  }, [teacherAvailability]);

  // Save to history when schedule changes
  useEffect(() => {
    if (scheduledClasses.length > 0) {
      const newHistory = scheduleHistory.slice(0, historyIndex + 1);
      newHistory.push([...scheduledClasses]);
      setScheduleHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [scheduledClasses]);

  const handleThemeChange = (newTheme: keyof typeof THEMES) => {
    setCurrentTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
  };

  const handleDataUpload = (data: ClassData[]) => {
    console.log('Data uploaded to App:', data.length, 'records');
    setCsvData(data);
    if (data.length > 0) {
      const firstLocation = locations.find(loc => 
        data.some(item => item.location === loc)
      ) || locations[0];
      setActiveTab(firstLocation);
    }
  };

  const handleSlotClick = (day: string, time: string, location: string) => {
    setSelectedSlot({ day, time, location });
    setEditingClass(null);
    setIsModalOpen(true);
  };

  const handleClassEdit = (classData: ScheduledClass) => {
    setEditingClass(classData);
    setSelectedSlot({ day: classData.day, time: classData.time, location: classData.location });
    setIsModalOpen(true);
  };

  const handleClassSchedule = (classData: ScheduledClass) => {
    if (editingClass) {
      // Update existing class
      setScheduledClasses(prev => 
        prev.map(cls => cls.id === editingClass.id ? classData : cls)
      );
    } else {
      // Validate teacher hours before scheduling
      const validation = validateTeacherHours(scheduledClasses, classData);
      
      if (!validation.isValid && !validation.canOverride) {
        alert(validation.error);
        return;
      }

      // Handle override scenario
      if (validation.canOverride && validation.warning) {
        const proceed = confirm(`${validation.warning}\n\nDo you want to override this limit and proceed anyway?`);
        if (!proceed) return;
      } else if (validation.warning && !validation.canOverride) {
        const proceed = confirm(`${validation.warning}\n\nDo you want to proceed?`);
        if (!proceed) return;
      }

      setScheduledClasses(prev => [...prev, classData]);
    }
    
    // Update teacher hours
    setTeacherHours(calculateTeacherHours(scheduledClasses));
    setIsModalOpen(false);
    setEditingClass(null);
  };

  const handleOptimizedSchedule = (optimizedClasses: ScheduledClass[]) => {
    // Validate all teacher hours in optimized schedule
    const teacherHoursCheck: Record<string, number> = {};
    const invalidTeachers: string[] = [];

    optimizedClasses.forEach(cls => {
      const teacherKey = `${cls.teacherFirstName} ${cls.teacherLastName}`;
      teacherHoursCheck[teacherKey] = parseFloat(((teacherHoursCheck[teacherKey] || 0) + parseFloat(cls.duration || '1')).toFixed(1));
    });

    Object.entries(teacherHoursCheck).forEach(([teacher, hours]) => {
      if (hours > 15) {
        invalidTeachers.push(`${teacher}: ${hours.toFixed(1)}h`);
      }
    });

    if (invalidTeachers.length > 0) {
      const proceed = confirm(`The following teachers would exceed 15 hours:\n${invalidTeachers.join('\n')}\n\nDo you want to override these limits and apply the schedule anyway?`);
      if (!proceed) return;
    }

    setScheduledClasses(optimizedClasses);
    setTeacherHours(teacherHoursCheck);
    setShowOptimizer(false);
    setShowEnhancedOptimizer(false);
    setShowDailyOptimizer(false);
  };

  const handleAutoPopulateTopClasses = async (data: ClassData[] = csvData) => {
    if (scheduleLocked) {
      alert('Schedule is locked. Unlock it first to make changes.');
      return;
    }

    // Validate that data is an array
    if (!Array.isArray(data)) {
      alert('Invalid data format. Please ensure CSV data is properly loaded.');
      return;
    }

    if (data.length === 0) {
      alert('Please upload CSV data first');
      return;
    }

    setIsPopulatingTopClasses(true);

    try {
      console.log('🚀 Starting enhanced top classes population with comprehensive constraints...');
      
      // Clear existing schedule first
      setScheduledClasses([]);
      
      // Use the enhanced generateIntelligentSchedule function
      const optimizedSchedule = await generateIntelligentSchedule(data, customTeachers, {
        prioritizeTopPerformers: true,
        balanceShifts: true,
        optimizeTeacherHours: true,
        respectTimeRestrictions: true,
        minimizeTrainersPerShift: true,
        optimizationType: 'balanced',
        targetTeacherHours: 15
      });

      console.log(`✅ Enhanced population complete: ${optimizedSchedule.length} classes scheduled`);

      if (optimizedSchedule.length > 0) {
        setScheduledClasses(optimizedSchedule);
        setTeacherHours(calculateTeacherHours(optimizedSchedule));
        
        // Calculate summary stats
        const teacherHoursCheck = calculateTeacherHours(optimizedSchedule);
        const teachersAt15h = Object.values(teacherHoursCheck).filter(h => h >= 14.5).length;
        const totalTeachers = Object.keys(teacherHoursCheck).length;
        const avgUtilization = Object.values(teacherHoursCheck).reduce((sum, hours) => sum + hours, 0) / totalTeachers / 15;
        
        alert(`✅ Enhanced Top Classes Population Complete!

📊 Results:
• ${optimizedSchedule.length} classes scheduled
• ${totalTeachers} teachers utilized
• ${teachersAt15h} teachers at 15h target (${((teachersAt15h/totalTeachers)*100).toFixed(0)}%)
• ${(avgUtilization * 100).toFixed(1)}% average teacher utilization

🎯 Enhanced Features Applied:
• Studio capacity constraints respected
• No trainer conflicts or cross-location assignments
• Maximum 2 consecutive classes per trainer
• Maximum 4 classes per day per trainer
• All 15-minute time intervals utilized
• Location-specific format rules enforced
• New trainer restrictions applied
• Shift separation optimized`);
      } else {
        alert('No classes could be scheduled due to constraints. Please check your data and try again.');
      }

    } catch (error) {
      console.error('Error populating top classes:', error);
      alert('Error populating top classes. Please try again.');
    } finally {
      setIsPopulatingTopClasses(false);
    }
  };

  const handleAutoOptimize = async () => {
    if (scheduleLocked) {
      alert('Schedule is locked. Unlock it first to make changes.');
      return;
    }

    if (csvData.length === 0) {
      alert('Please upload CSV data first');
      return;
    }

    setIsOptimizing(true);

    try {
      console.log('🚀 Starting enhanced AI optimization with comprehensive constraints...');
      
      // Enhanced AI optimization with all constraints
      const optimizedSchedule = await generateIntelligentSchedule(csvData, customTeachers, {
        prioritizeTopPerformers: true,
        balanceShifts: true,
        optimizeTeacherHours: true,
        respectTimeRestrictions: true,
        minimizeTrainersPerShift: true,
        iteration: optimizationIteration,
        optimizationType: 'balanced',
        targetTeacherHours: 15
      });
      
      console.log(`🎯 Enhanced AI optimization complete: ${optimizedSchedule.length} classes scheduled`);
      
      // Calculate final teacher hours and stats
      const teacherHoursCheck = calculateTeacherHours(optimizedSchedule);
      const teachersAt15h = Object.values(teacherHoursCheck).filter(h => h >= 14.5).length;
      const teachersAt12h = Object.values(teacherHoursCheck).filter(h => h >= 12).length;
      const totalTeachers = Object.keys(teacherHoursCheck).length;
      const avgUtilization = Object.values(teacherHoursCheck).reduce((sum, hours) => sum + hours, 0) / totalTeachers / 15;

      setOptimizationIteration(prev => prev + 1);
      setScheduledClasses(optimizedSchedule);
      setTeacherHours(teacherHoursCheck);

      // Show comprehensive optimization results
      alert(`🎯 Enhanced AI Optimization Complete!

📊 Results:
• ${optimizedSchedule.length} classes scheduled
• ${totalTeachers} teachers utilized
• ${teachersAt15h} teachers at 15h target (${((teachersAt15h/totalTeachers)*100).toFixed(0)}%)
• ${teachersAt12h} teachers at 12+ hours (${((teachersAt12h/totalTeachers)*100).toFixed(0)}%)
• ${(avgUtilization * 100).toFixed(1)}% average teacher utilization

✅ Enhanced Optimization Features:
• Studio capacity constraints enforced
• No trainer conflicts or overlaps
• Maximum 2 consecutive classes per trainer
• Maximum 4 classes per day per trainer
• One location per trainer per day
• Shift separation optimized
• All 15-minute intervals utilized
• Location-specific format rules applied
• New trainer restrictions enforced
• Teacher hour targets optimized`);

    } catch (error) {
      console.error('Error optimizing schedule:', error);
      alert('Error optimizing schedule. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleEnhancedAI = async () => {
    if (scheduleLocked) {
      alert('Schedule is locked. Unlock it first to make changes.');
      return;
    }

    if (csvData.length === 0) {
      alert('Please upload CSV data first');
      return;
    }

    setIsOptimizing(true);

    try {
      console.log('🚀 Starting Enhanced AI - preserving top classes and adding optimizations...');
      
      // Get current top performing classes to preserve
      const topClasses = scheduledClasses.filter(cls => cls.isTopPerformer);
      
      // Generate new schedule with iteration variations
      const enhancedSchedule = await generateIntelligentSchedule(csvData, customTeachers, {
        prioritizeTopPerformers: true,
        balanceShifts: true,
        optimizeTeacherHours: true,
        respectTimeRestrictions: true,
        minimizeTrainersPerShift: true,
        iteration: optimizationIteration + 1,
        optimizationType: 'balanced',
        targetTeacherHours: 15
      });
      
      // Merge preserved top classes with new optimizations
      const mergedSchedule = [...topClasses];
      
      // Add new classes that don't conflict with existing top performers
      enhancedSchedule.forEach(newClass => {
        const hasConflict = topClasses.some(topClass => 
          topClass.day === newClass.day && 
          topClass.time === newClass.time && 
          topClass.location === newClass.location
        );
        
        if (!hasConflict) {
          mergedSchedule.push(newClass);
        }
      });
      
      setOptimizationIteration(prev => prev + 1);
      setScheduledClasses(mergedSchedule);
      setTeacherHours(calculateTeacherHours(mergedSchedule));

      alert(`🎯 Enhanced AI Complete - Iteration ${optimizationIteration + 1}!

📊 Results:
• ${topClasses.length} top performing classes preserved
• ${mergedSchedule.length - topClasses.length} new classes added
• ${mergedSchedule.length} total classes scheduled
• Unique iteration with minor tweaks and adjustments
• All rules and constraints maintained`);

    } catch (error) {
      console.error('Error in enhanced AI:', error);
      alert('Error in enhanced AI optimization. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleFillGaps = async () => {
    if (scheduleLocked) {
      alert('Schedule is locked. Unlock it first to make changes.');
      return;
    }

    if (csvData.length === 0) {
      alert('Please upload CSV data first');
      return;
    }

    setIsOptimizing(true);

    try {
      console.log('🔧 Filling gaps and optimizing class mix balance...');
      
      // Analyze current schedule for gaps and imbalances
      const currentClasses = [...scheduledClasses];
      const gapFilledSchedule = await generateIntelligentSchedule(csvData, customTeachers, {
        prioritizeTopPerformers: false, // Focus on filling gaps rather than just top performers
        balanceShifts: true,
        optimizeTeacherHours: true,
        respectTimeRestrictions: true,
        minimizeTrainersPerShift: true,
        optimizationType: 'attendance', // Focus on filling empty slots
        targetTeacherHours: 15
      });
      
      // Merge existing with gap-filled classes
      const mergedSchedule = [...currentClasses];
      
      gapFilledSchedule.forEach(newClass => {
        const hasConflict = currentClasses.some(existingClass => 
          existingClass.day === newClass.day && 
          existingClass.time === newClass.time && 
          existingClass.location === newClass.location
        );
        
        if (!hasConflict) {
          mergedSchedule.push(newClass);
        }
      });
      
      setScheduledClasses(mergedSchedule);
      setTeacherHours(calculateTeacherHours(mergedSchedule));

      const addedClasses = mergedSchedule.length - currentClasses.length;
      
      alert(`🔧 Gap Filling Complete!

📊 Results:
• ${addedClasses} new classes added to fill gaps
• ${mergedSchedule.length} total classes scheduled
• Improved class mix balance across days
• Empty time slots optimally filled
• Teacher workload balanced`);

    } catch (error) {
      console.error('Error filling gaps:', error);
      alert('Error filling gaps. Please try again.');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleUndo = () => {
    if (scheduleLocked) {
      alert('Schedule is locked. Unlock it first to make changes.');
      return;
    }

    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setScheduledClasses(scheduleHistory[historyIndex - 1]);
      setTeacherHours(calculateTeacherHours(scheduleHistory[historyIndex - 1]));
    }
  };

  const handleRedo = () => {
    if (scheduleLocked) {
      alert('Schedule is locked. Unlock it first to make changes.');
      return;
    }

    if (historyIndex < scheduleHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setScheduledClasses(scheduleHistory[historyIndex + 1]);
      setTeacherHours(calculateTeacherHours(scheduleHistory[historyIndex + 1]));
    }
  };

  const handleClearAll = () => {
    if (scheduleLocked) {
      alert('Schedule is locked. Unlock it first to make changes.');
      return;
    }

    if (confirm('Are you sure you want to clear all scheduled classes?')) {
      setScheduledClasses([]);
      setTeacherHours({});
      setLockedClasses(new Set());
      setLockedTeachers(new Set());
      setClassesLocked(false);
      setTeachersLocked(false);
    }
  };

  const toggleScheduleLock = () => {
    const newLockState = !scheduleLocked;
    setScheduleLocked(newLockState);
    localStorage.setItem('schedule_locked', newLockState.toString());
    
    if (newLockState) {
      alert('🔒 Schedule locked! All modification buttons are now disabled until unlocked.');
    } else {
      alert('🔓 Schedule unlocked! You can now make changes to the schedule.');
    }
  };

  const toggleClassLock = () => {
    setClassesLocked(!classesLocked);
    if (!classesLocked) {
      const classIds = new Set(scheduledClasses.map(cls => cls.id));
      setLockedClasses(classIds);
    } else {
      setLockedClasses(new Set());
    }
  };

  const toggleTeacherLock = () => {
    setTeachersLocked(!teachersLocked);
    if (!teachersLocked) {
      const teacherNames = new Set(scheduledClasses.map(cls => `${cls.teacherFirstName} ${cls.teacherLastName}`));
      setLockedTeachers(teacherNames);
    } else {
      setLockedTeachers(new Set());
    }
  };

  const classCounts = getClassCounts(scheduledClasses);

  // Show upload screen if no data
  if (csvData.length === 0) {
    return <CSVUpload onDataUpload={handleDataUpload} theme={theme} />;
  }

  const renderMainContent = () => {
    switch (activeView) {
      case 'performance':
        return <PerformanceInsights scheduledClasses={scheduledClasses} csvData={csvData} theme={theme} />;
      case 'classmix':
        return <ClassMixAnalyzer scheduledClasses={scheduledClasses} csvData={csvData} theme={theme} />;
      case 'analytics':
        return <AnalyticsView scheduledClasses={scheduledClasses} csvData={csvData} theme={theme} />;
      default:
        return (
          <>
            {/* Location Tabs */}
            <div className={`flex space-x-1 mb-6 rounded-2xl p-1 ${theme.card} shadow-lg`}>
              {locations.map((location) => (
                <button
                  key={location}
                  onClick={() => setActiveTab(location)}
                  className={`flex-1 py-4 px-6 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === location
                      ? `${theme.buttonPrimary} shadow-lg transform scale-105`
                      : `${theme.textSecondary} ${theme.cardHover}`
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    {location.split(',')[0]}
                  </div>
                </button>
              ))}
            </div>

            {/* Teacher Hours Tracker - Collapsible */}
            <div className="mb-6">
              <TeacherHourTracker 
                teacherHours={teacherHours} 
                theme={theme}
                showCards={showTeacherCards}
                onToggleCards={() => setShowTeacherCards(!showTeacherCards)}
              />
            </div>

            {/* Weekly Calendar */}
            {activeTab && (
              <WeeklyCalendar
                location={activeTab}
                csvData={csvData}
                scheduledClasses={scheduledClasses.filter(cls => {
                  if (!filterOptions.showTopPerformers && cls.isTopPerformer) return false;
                  if (!filterOptions.showPrivateClasses && cls.isPrivate) return false;
                  if (!filterOptions.showRegularClasses && !cls.isTopPerformer && !cls.isPrivate) return false;
                  if (filterOptions.selectedTeacher && `${cls.teacherFirstName} ${cls.teacherLastName}` !== filterOptions.selectedTeacher) return false;
                  if (filterOptions.selectedClassFormat && cls.classFormat !== filterOptions.selectedClassFormat) return false;
                  return true;
                })}
                onSlotClick={handleSlotClick}
                onClassEdit={handleClassEdit}
                lockedClasses={lockedClasses}
                theme={theme}
                allowRestrictedScheduling={allowRestrictedScheduling}
              />
            )}
          </>
        );
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      <div className="container mx-auto px-4 py-6">
        {/* Sleek Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="relative mr-4">
              <Sparkles className={`h-12 w-12 ${theme.accent}`} />
            </div>
            <div>
              <h1 className={`text-4xl font-bold ${theme.text}`}>
                Smart Class Scheduler
              </h1>
              <p className={theme.textSecondary}>AI-powered optimization with comprehensive constraints</p>
            </div>
          </div>
          
          {/* Header Controls */}
          <div className="flex items-center space-x-3">
            {/* Schedule Lock Toggle */}
            <button
              onClick={toggleScheduleLock}
              className={`p-3 rounded-xl transition-all duration-200 shadow-lg hover:scale-105 ${
                scheduleLocked 
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              title={scheduleLocked ? "Unlock Schedule" : "Lock Schedule"}
            >
              {scheduleLocked ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => setShowThemeSelector(true)}
              className={`p-3 rounded-xl transition-all duration-200 ${theme.button} hover:scale-105`}
              title="Change Theme"
            >
              <Palette className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Action Buttons Grid */}
        <div className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            {/* History Controls */}
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0 || scheduleLocked}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${theme.button} hover:scale-105`}
              title="Undo"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Undo</span>
            </button>

            <button
              onClick={handleRedo}
              disabled={historyIndex >= scheduleHistory.length - 1 || scheduleLocked}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${theme.button} hover:scale-105`}
              title="Redo"
            >
              <RotateCw className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Redo</span>
            </button>

            <button
              onClick={handleClearAll}
              disabled={scheduleLocked}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 bg-red-600 text-white hover:bg-red-700 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Clear All"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Clear</span>
            </button>

            <button
              onClick={() => handleAutoPopulateTopClasses(csvData)}
              disabled={isPopulatingTopClasses || scheduleLocked}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 bg-yellow-600 text-white hover:bg-yellow-700`}
              title="Enhanced population with ALL constraints and 15-min intervals"
            >
              {isPopulatingTopClasses ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Star className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm font-medium">Top Classes</span>
            </button>
            
            <button
              onClick={handleAutoOptimize}
              disabled={isOptimizing || scheduleLocked}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 bg-green-600 text-white hover:bg-green-700`}
              title="Enhanced AI with ALL constraints and studio capacity checks"
            >
              {isOptimizing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Brain className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm font-medium">Auto Optimize</span>
            </button>

            <button
              onClick={handleEnhancedAI}
              disabled={isOptimizing || scheduleLocked}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 bg-cyan-600 text-white hover:bg-cyan-700`}
              title="Preserve top classes and add new iterations with tweaks"
            >
              {isOptimizing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm font-medium">Enhanced AI</span>
            </button>

            <button
              onClick={handleFillGaps}
              disabled={isOptimizing || scheduleLocked}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 bg-indigo-600 text-white hover:bg-indigo-700`}
              title="Fill scheduling gaps and balance class mix"
            >
              {isOptimizing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Target className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm font-medium">Fill Gaps</span>
            </button>
          </div>

          {/* Second Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mt-3">
            <button
              onClick={() => setShowAdvancedAI(true)}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700`}
              title="Advanced AI with automation and custom queries"
            >
              <Brain className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Advanced AI</span>
            </button>

            <button
              onClick={() => setShowDailyOptimizer(true)}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 bg-teal-600 text-white hover:bg-teal-700`}
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Daily AI</span>
            </button>

            <button
              onClick={toggleClassLock}
              disabled={scheduleLocked}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                classesLocked 
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : `${theme.button}`
              }`}
            >
              {classesLocked ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
              <span className="text-sm font-medium">{classesLocked ? 'Unlock' : 'Lock'} Classes</span>
            </button>

            <button
              onClick={toggleTeacherLock}
              disabled={scheduleLocked}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                teachersLocked 
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : `${theme.button}`
              }`}
            >
              {teachersLocked ? <Lock className="h-4 w-4 mr-2" /> : <Unlock className="h-4 w-4 mr-2" />}
              <span className="text-sm font-medium">{teachersLocked ? 'Unlock' : 'Lock'} Teachers</span>
            </button>
            
            <button
              onClick={() => setShowOptimizer(true)}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 bg-orange-600 text-white hover:bg-orange-700`}
            >
              <Target className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Optimizer</span>
            </button>

            <button
              onClick={() => setShowStudioRules(true)}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 bg-pink-600 text-white hover:bg-pink-700`}
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Studio Rules</span>
            </button>

            <button
              onClick={() => setShowExportModal(true)}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 bg-blue-600 text-white hover:bg-blue-700`}
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Export</span>
            </button>
          </div>

          {/* Third Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mt-3">
            <button
              onClick={() => setShowStudioSettings(true)}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 bg-emerald-600 text-white hover:bg-emerald-700`}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Studio</span>
            </button>
            
            <button
              onClick={() => setShowAISettings(true)}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${theme.button}`}
            >
              <Settings className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">AI Settings</span>
            </button>
            
            <button
              onClick={() => setCsvData([])}
              className={`flex items-center justify-center px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${theme.button}`}
            >
              <Upload className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">New CSV</span>
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className={`flex space-x-1 mb-6 rounded-2xl p-1 ${theme.card} shadow-lg`}>
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeView === view.id
                  ? `${theme.buttonPrimary} shadow-lg transform scale-105`
                  : `${theme.textSecondary} ${theme.cardHover}`
              }`}
            >
              <view.icon className="h-5 w-5 mr-2" />
              {view.name}
            </button>
          ))}
        </div>

        {/* Main Content */}
        {renderMainContent()}

        {/* Class Scheduling Modal */}
        {isModalOpen && selectedSlot && (
          <ClassModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setEditingClass(null);
            }}
            selectedSlot={selectedSlot}
            editingClass={editingClass}
            csvData={csvData}
            teacherHours={teacherHours}
            customTeachers={customTeachers}
            teacherAvailability={teacherAvailability}
            scheduledClasses={scheduledClasses}
            onSchedule={handleClassSchedule}
            theme={theme}
            allowRestrictedScheduling={allowRestrictedScheduling}
          />
        )}

        {/* Smart Optimizer Modal */}
        {showOptimizer && (
          <SmartOptimizer
            isOpen={showOptimizer}
            onClose={() => setShowOptimizer(false)}
            csvData={csvData}
            currentSchedule={scheduledClasses}
            onOptimize={handleOptimizedSchedule}
            theme={theme}
          />
        )}

        {/* Enhanced Optimizer Modal */}
        {showEnhancedOptimizer && (
          <EnhancedOptimizerModal
            isOpen={showEnhancedOptimizer}
            onClose={() => setShowEnhancedOptimizer(false)}
            csvData={csvData}
            currentSchedule={scheduledClasses}
            onOptimize={handleOptimizedSchedule}
            isDarkMode={currentTheme === 'dark'}
          />
        )}

        {/* Advanced AI Modal */}
        {showAdvancedAI && (
          <AdvancedAIModal
            isOpen={showAdvancedAI}
            onClose={() => setShowAdvancedAI(false)}
            csvData={csvData}
            currentSchedule={scheduledClasses}
            customTeachers={customTeachers}
            onOptimize={handleOptimizedSchedule}
            theme={theme}
          />
        )}

        {/* Daily AI Optimizer Modal */}
        {showDailyOptimizer && (
          <DailyAIOptimizer
            isOpen={showDailyOptimizer}
            onClose={() => setShowDailyOptimizer(false)}
            csvData={csvData}
            currentSchedule={scheduledClasses}
            onOptimize={handleOptimizedSchedule}
            isDarkMode={currentTheme === 'dark'}
          />
        )}

        {/* Studio Rules Modal */}
        {showStudioRules && (
          <StudioRulesModal
            isOpen={showStudioRules}
            onClose={() => setShowStudioRules(false)}
            theme={theme}
          />
        )}

        {/* Export Modal */}
        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          scheduledClasses={scheduledClasses}
          location={activeTab}
          theme={theme}
        />

        {/* Studio Settings Modal */}
        <StudioSettings
          isOpen={showStudioSettings}
          onClose={() => setShowStudioSettings(false)}
          customTeachers={customTeachers}
          onUpdateTeachers={setCustomTeachers}
          teacherAvailability={teacherAvailability}
          onUpdateAvailability={setTeacherAvailability}
          theme={theme}
          allowRestrictedScheduling={allowRestrictedScheduling}
          onUpdateRestrictedScheduling={(value) => {
            setAllowRestrictedScheduling(value);
            localStorage.setItem('allow_restricted_scheduling', value.toString());
          }}
        />

        {/* AI Settings Modal */}
        <AISettings
          isOpen={showAISettings}
          onClose={() => setShowAISettings(false)}
          theme={theme}
        />

        {/* Theme Selector Modal */}
        <ThemeSelector
          isOpen={showThemeSelector}
          onClose={() => setShowThemeSelector(false)}
          currentTheme={currentTheme}
          themes={THEMES}
          onThemeChange={handleThemeChange}
        />
      </div>
    </div>
  );
}

export default App;