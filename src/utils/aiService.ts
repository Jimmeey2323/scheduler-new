import { ClassData, AIRecommendation, AIProvider, ScheduledClass, OptimizationSuggestion, StudioRules } from '../types';
import { generateIntelligentSchedule } from './classUtils';

class AIService {
  private provider: AIProvider | null = null;

  constructor() {
    // Don't set a default provider with potentially invalid key
    this.provider = null;
  }

  setProvider(provider: AIProvider) {
    this.provider = provider;
    console.log(`🤖 AI Service: Provider set to ${provider.name}`);
  }

  async generateRecommendations(
    historicData: ClassData[],
    day: string,
    time: string,
    location: string,
    currentSchedule: ScheduledClass[] = [],
    studioRules?: StudioRules
  ): Promise<AIRecommendation[]> {
    // Always return fallback recommendations if no provider is configured or key is missing
    if (!this.provider || !this.provider.key || this.provider.key.trim() === '') {
      console.warn('🤖 AI Service: Provider not configured or missing API key, using enhanced fallback recommendations');
      return this.getEnhancedFallbackRecommendations(historicData, location, day, time, currentSchedule, studioRules);
    }

    const relevantData = historicData.filter(
      item => item.location === location && 
      item.dayOfWeek === day && 
      item.classTime.includes(time.slice(0, 5))
    );

    if (relevantData.length === 0) {
      return this.getEnhancedFallbackRecommendations(historicData, location, day, time, currentSchedule, studioRules);
    }

    const prompt = this.buildAdvancedRecommendationPrompt(relevantData, day, time, location, historicData, currentSchedule, studioRules);
    
    try {
      console.log(`🤖 AI Service: Generating recommendations for ${location} on ${day} at ${time}...`);
      const response = await this.callAI(prompt);
      const recommendations = this.parseAIResponse(response, currentSchedule, studioRules);
      console.log(`✅ AI Service: Generated ${recommendations.length} recommendations`);
      return recommendations.sort((a, b) => b.priority - a.priority);
    } catch (error) {
      console.warn('🤖 AI Service: Error generating recommendations, falling back to enhanced local recommendations:', error);
      return this.getEnhancedFallbackRecommendations(historicData, location, day, time, currentSchedule, studioRules);
    }
  }

  async generateOptimizedSchedule(
    historicData: ClassData[],
    currentSchedule: ScheduledClass[],
    customTeachers: any[] = [],
    options: any = {},
    studioRules?: StudioRules
  ): Promise<ScheduledClass[]> {
    if (!this.provider || !this.provider.key || this.provider.key.trim() === '') {
      console.warn('🤖 AI Service: Provider not configured, using enhanced intelligent local optimization');
      return this.generateEnhancedLocalSchedule(historicData, currentSchedule, customTeachers, options, studioRules);
    }

    const prompt = this.buildAdvancedOptimizationPrompt(historicData, currentSchedule, customTeachers, options, studioRules);
    
    try {
      console.log(`🤖 AI Service: Generating optimized schedule with ${options.optimizationType || 'balanced'} strategy...`);
      const response = await this.callAI(prompt);
      const optimizedSchedule = this.parseOptimizedScheduleResponse(response, historicData, currentSchedule, studioRules);
      console.log(`✅ AI Service: Generated optimized schedule with ${optimizedSchedule.length} classes`);
      return optimizedSchedule;
    } catch (error) {
      console.warn('🤖 AI Service: Optimization error, falling back to enhanced intelligent local optimization:', error);
      return this.generateEnhancedLocalSchedule(historicData, currentSchedule, customTeachers, options, studioRules);
    }
  }

  private buildAdvancedRecommendationPrompt(
    data: ClassData[], 
    day: string, 
    time: string, 
    location: string,
    allData: ClassData[],
    currentSchedule: ScheduledClass[] = [],
    studioRules?: StudioRules
  ): string {
    const classPerformance = this.analyzeClassPerformance(data);
    const teacherPerformance = this.analyzeTeacherPerformance(data);
    const timeSlotAnalysis = this.analyzeTimeSlotPerformance(allData, location, day, time);
    const competitorAnalysis = this.analyzeCompetitorSlots(allData, location, day, time);
    
    // Analyze current schedule conflicts
    const currentSlotClasses = currentSchedule.filter(cls => 
      cls.day === day && cls.time === time && cls.location === location
    );
    
    const teacherHours = this.calculateCurrentTeacherHours(currentSchedule);
    const teacherDayClasses = this.calculateTeacherDayClasses(currentSchedule, day);

    return `
      You are an expert fitness studio scheduling AI with deep understanding of trainer optimization and studio capacity constraints. 
      
      CURRENT SCHEDULE STATE ANALYSIS:
      - Current slot (${day} ${time} at ${location}): ${currentSlotClasses.length > 0 ? 
        `OCCUPIED by ${currentSlotClasses.map(cls => `${cls.classFormat} with ${cls.teacherFirstName} ${cls.teacherLastName}`).join(', ')}` : 
        'AVAILABLE'}
      - Total scheduled classes: ${currentSchedule.length}
      - Current teacher hours: ${Object.entries(teacherHours).map(([teacher, hours]) => `${teacher}: ${hours}h`).join(', ')}
      
      STRICT STUDIO RULES (NON-NEGOTIABLE - ANY VIOLATION MAKES RECOMMENDATION INVALID):
      ${studioRules ? `
      1. Teacher Limits: Max ${studioRules.maxWeeklyHours}h/week, ${studioRules.maxDailyHours}h/day, ${studioRules.maxConsecutiveClasses} consecutive classes
      2. Location Rules for ${location}: 
         - Max ${studioRules.locationRules[location]?.maxParallelClasses || 2} parallel classes
         - Restricted formats: ${studioRules.locationRules[location]?.restrictedFormats?.join(', ') || 'None'}
         - Allowed formats: ${studioRules.locationRules[location]?.allowedFormats?.length ? studioRules.locationRules[location].allowedFormats.join(', ') : 'All except restricted'}
      3. Time Restrictions: ${studioRules.restrictedHours.start}-${studioRules.restrictedHours.end} ${studioRules.restrictedHours.privateOnly ? 'private only' : 'restricted'}
      4. New Trainer Limits: Max ${studioRules.newTrainerMaxHours}h/week, formats: ${studioRules.newTrainerFormats.join(', ')}
      5. Priority Teachers: ${studioRules.priorityTeachers.join(', ')}
      ` : `
      1. Max 15h/week per teacher, 4h/day, 2 consecutive classes max
      2. Supreme HQ: PowerCycle only, max 3 parallel classes
      3. Other locations: No PowerCycle, max 2 parallel classes
      4. No classes 12:30-17:00 except private
      5. One location per teacher per day
      `}

      CONFLICT PREVENTION REQUIREMENTS:
      - NEVER suggest a class that conflicts with existing schedule
      - NEVER exceed teacher hour limits or daily limits
      - NEVER violate location-specific format restrictions
      - NEVER schedule same teacher at multiple locations on same day
      - ALWAYS check studio capacity before suggesting parallel classes

      HISTORIC PERFORMANCE DATA:
      ${classPerformance.map(p => `- ${p.classFormat}: ${p.avgParticipants.toFixed(1)} avg participants, ₹${p.avgRevenue.toFixed(0)} revenue, ${p.frequency} classes held`).join('\n')}
      
      TEACHER PERFORMANCE:
      ${teacherPerformance.map(p => `- ${p.teacher}: ${p.avgParticipants.toFixed(1)} avg participants, ${p.classesCount} classes taught`).join('\n')}
      
      TIME SLOT ANALYSIS:
      - Peak attendance: ${timeSlotAnalysis.peakAttendance} participants
      - Average revenue: ₹${timeSlotAnalysis.avgRevenue.toFixed(0)}
      - Success rate: ${(timeSlotAnalysis.successRate * 100).toFixed(1)}%
      - Best performing format: ${timeSlotAnalysis.bestFormat}
      
      COMPETITIVE ANALYSIS:
      - Similar time slots performance: ${competitorAnalysis.similarSlotsAvg.toFixed(1)} avg participants
      - Market opportunity score: ${competitorAnalysis.opportunityScore}/10

      ${currentSlotClasses.length > 0 ? 
        'SLOT IS OCCUPIED - Provide optimization suggestions for existing classes:' :
        'SLOT IS AVAILABLE - Provide new class recommendations:'
      }
      
      Provide up to 5 CONFLICT-FREE recommendations in JSON format:
      {
        "recommendations": [
          {
            "classFormat": "specific class name from data",
            "teacher": "available teacher name (check current hours and conflicts)", 
            "reasoning": "detailed explanation including conflict checks and rule compliance",
            "confidence": 0.85,
            "expectedParticipants": 12,
            "expectedRevenue": 8000,
            "priority": 9,
            "timeSlot": "${time}",
            "location": "${location}",
            "conflictCheck": "verified no conflicts with current schedule",
            "ruleCompliance": "all studio rules verified"
          }
        ]
      }
      
      CRITICAL: Every recommendation MUST be validated against current schedule and studio rules.
      REJECT any suggestion that creates conflicts or violates rules.
    `;
  }

  private buildAdvancedOptimizationPrompt(
    historicData: ClassData[], 
    currentSchedule: ScheduledClass[],
    customTeachers: any[],
    options: any,
    studioRules?: StudioRules
  ): string {
    const priorityTeachers = ['Anisha', 'Vivaran', 'Mrigakshi', 'Pranjali', 'Atulan', 'Cauveri', 'Rohan'];
    const locationAnalysis = this.analyzeLocationPerformance(historicData);
    const teacherUtilization = this.analyzeTeacherUtilization(currentSchedule);
    const currentConflicts = this.analyzeCurrentConflicts(currentSchedule, studioRules);
    
    return `
      You are an expert AI fitness studio scheduler. Analyze the CURRENT SCHEDULE and provide SPECIFIC optimization suggestions.
      
      CURRENT SCHEDULE ANALYSIS (${currentSchedule.length} classes):
      ${currentSchedule.map(cls => `${cls.day} ${cls.time} - ${cls.classFormat} with ${cls.teacherFirstName} ${cls.teacherLastName} at ${cls.location}`).join('\n')}
      
      IDENTIFIED CONFLICTS AND ISSUES:
      ${currentConflicts.length > 0 ? currentConflicts.join('\n') : 'No major conflicts detected'}
      
      STUDIO RULES COMPLIANCE CHECK:
      ${studioRules ? `
      - Teacher hour limits: ${studioRules.maxWeeklyHours}h/week, ${studioRules.maxDailyHours}h/day
      - Location capacity: ${Object.entries(studioRules.locationRules).map(([loc, rules]) => `${loc}: ${rules.maxParallelClasses} max`).join(', ')}
      - Format restrictions: ${Object.entries(studioRules.locationRules).map(([loc, rules]) => `${loc}: ${rules.restrictedFormats.join(', ') || 'None'}`).join('; ')}
      ` : 'Using default studio rules'}

      TEACHER UTILIZATION:
      ${Object.entries(teacherUtilization).map(([teacher, hours]: [string, any]) => 
        `${teacher}: ${hours.toFixed(1)}h/week (${((hours/15)*100).toFixed(0)}% utilization)`
      ).join('\n')}

      Provide SPECIFIC optimization suggestions in JSON format:
      {
        "suggestions": [
          {
            "type": "trainer_change|level_change|timing_change|add_class|remove_class",
            "originalClass": {existing class if applicable},
            "suggestedClass": {new or modified class},
            "reason": "specific reason with rule compliance check",
            "impact": "expected improvement",
            "priority": 8,
            "conflictCheck": "verified no new conflicts created",
            "ruleCompliance": "all applicable rules verified"
          }
        ]
      }
      
      CRITICAL REQUIREMENTS:
      1. Every suggestion MUST be validated against current schedule
      2. NO suggestions that create teacher conflicts or exceed limits
      3. NO suggestions that violate location-specific rules
      4. Focus on actionable, implementable changes only
      5. Prioritize suggestions that resolve existing conflicts first
    `;
  }

  private calculateCurrentTeacherHours(currentSchedule: ScheduledClass[]): Record<string, number> {
    return currentSchedule.reduce((acc, cls) => {
      const teacher = `${cls.teacherFirstName} ${cls.teacherLastName}`;
      acc[teacher] = (acc[teacher] || 0) + parseFloat(cls.duration);
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateTeacherDayClasses(currentSchedule: ScheduledClass[], day: string): Record<string, number> {
    return currentSchedule
      .filter(cls => cls.day === day)
      .reduce((acc, cls) => {
        const teacher = `${cls.teacherFirstName} ${cls.teacherLastName}`;
        acc[teacher] = (acc[teacher] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
  }

  private analyzeCurrentConflicts(currentSchedule: ScheduledClass[], studioRules?: StudioRules): string[] {
    const conflicts: string[] = [];
    const teacherHours = this.calculateCurrentTeacherHours(currentSchedule);
    
    // Check teacher hour violations
    Object.entries(teacherHours).forEach(([teacher, hours]) => {
      const maxHours = studioRules?.maxWeeklyHours || 15;
      if (hours > maxHours) {
        conflicts.push(`${teacher} exceeds ${maxHours}h limit (${hours.toFixed(1)}h)`);
      }
    });
    
    // Check location capacity violations
    const slotOccupancy: Record<string, number> = {};
    currentSchedule.forEach(cls => {
      const slotKey = `${cls.day}-${cls.time}-${cls.location}`;
      slotOccupancy[slotKey] = (slotOccupancy[slotKey] || 0) + 1;
    });
    
    Object.entries(slotOccupancy).forEach(([slotKey, count]) => {
      const [day, time, location] = slotKey.split('-');
      const maxCapacity = studioRules?.locationRules[location]?.maxParallelClasses || 2;
      if (count > maxCapacity) {
        conflicts.push(`${location} exceeds capacity at ${day} ${time} (${count}/${maxCapacity})`);
      }
    });
    
    return conflicts;
  }

  private _validateAISuggestion(
    suggestion: OptimizationSuggestion, 
    currentSchedule: ScheduledClass[], 
    studioRules?: StudioRules
  ): { isValid: boolean; message: string } {
    // Validate teacher hours
    if (suggestion.type === 'trainer_change' || suggestion.type === 'add_class') {
      const teacherName = `${suggestion.suggestedClass.teacherFirstName} ${suggestion.suggestedClass.teacherLastName}`;
      const currentHours = this.calculateCurrentTeacherHours(currentSchedule)[teacherName] || 0;
      const newHours = currentHours + parseFloat(suggestion.suggestedClass.duration);
      const maxHours = studioRules?.maxWeeklyHours || 15;
      
      if (newHours > maxHours) {
        return { isValid: false, message: `${teacherName} would exceed ${maxHours}h limit (${newHours.toFixed(1)}h)` };
      }
    }
    
    // Validate location capacity
    if (suggestion.type === 'add_class' || suggestion.type === 'timing_change') {
      const slotClasses = currentSchedule.filter(cls => 
        cls.day === suggestion.suggestedClass.day && 
        cls.time === suggestion.suggestedClass.time && 
        cls.location === suggestion.suggestedClass.location
      );
      
      const maxCapacity = studioRules?.locationRules[suggestion.suggestedClass.location]?.maxParallelClasses || 2;
      if (slotClasses.length >= maxCapacity) {
        return { isValid: false, message: `${suggestion.suggestedClass.location} at capacity for ${suggestion.suggestedClass.day} ${suggestion.suggestedClass.time}` };
      }
    }
    
    // Validate format restrictions
    const locationRules = studioRules?.locationRules[suggestion.suggestedClass.location];
    if (locationRules?.restrictedFormats.includes(suggestion.suggestedClass.classFormat)) {
      return { isValid: false, message: `${suggestion.suggestedClass.classFormat} not allowed at ${suggestion.suggestedClass.location}` };
    }
    
    return { isValid: true, message: 'Suggestion is valid' };
  }

  private getOptimizationGoals(optimizationType: string): string {
    switch (optimizationType) {
      case 'revenue':
        return `
        1. Maximize revenue per hour across all locations
        2. Prioritize peak hours with highest-performing class-teacher combinations
        3. Achieve 90%+ teacher utilization for priority teachers
        4. Optimize studio capacity utilization during peak hours
        5. Minimize operational complexity (fewer trainers per shift)
        6. Ensure teacher work-life balance (2+ days off)
        `;
      case 'attendance':
        return `
        1. Maximize total attendance across all classes
        2. Prioritize proven high-attendance class-teacher combinations
        3. Achieve balanced class distribution throughout the week
        4. Optimize for consistent attendance patterns
        5. Minimize trainer conflicts and cross-location assignments
        6. Ensure sustainable teacher workload distribution
        `;
      default: // balanced
        return `
        1. Balance revenue optimization with attendance maximization
        2. Achieve 85%+ teacher utilization (12-15h for priority teachers)
        3. Maintain 90%+ class fill rates based on historic data
        4. Minimize operational complexity (fewer trainers per shift)
        5. Ensure teacher work-life balance (2+ days off)
        6. Create diverse class offerings throughout the week
        7. Optimize for peak time slots with best teachers
        `;
    }
  }

  private analyzeTimeSlotPerformance(data: ClassData[], location: string, day: string, time: string) {
    const slotData = data.filter(item => 
      item.location === location && 
      item.dayOfWeek === day && 
      item.classTime.includes(time.slice(0, 5))
    );

    if (slotData.length === 0) {
      return { peakAttendance: 0, avgRevenue: 0, successRate: 0, bestFormat: 'N/A' };
    }

    const peakAttendance = Math.max(...slotData.map(item => item.participants));
    const avgRevenue = slotData.reduce((sum, item) => sum + item.totalRevenue, 0) / slotData.length;
    const avgParticipants = slotData.reduce((sum, item) => sum + item.participants, 0) / slotData.length;
    const successRate = slotData.filter(item => item.participants > avgParticipants).length / slotData.length;
    
    const formatStats = slotData.reduce((acc, item) => {
      if (!acc[item.cleanedClass]) acc[item.cleanedClass] = 0;
      acc[item.cleanedClass] += item.participants;
      return acc;
    }, {} as any);
    
    const bestFormat = Object.entries(formatStats).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A';

    return { peakAttendance, avgRevenue, successRate, bestFormat };
  }

  private analyzeCompetitorSlots(data: ClassData[], location: string, day: string, time: string) {
    const hour = parseInt(time.split(':')[0]);
    const similarSlots = data.filter(item => {
      const itemHour = parseInt(item.classTime.split(':')[0]);
      return item.location === location && 
             item.dayOfWeek === day && 
             Math.abs(itemHour - hour) <= 1; // Within 1 hour
    });

    const similarSlotsAvg = similarSlots.length > 0 
      ? similarSlots.reduce((sum, item) => sum + item.participants, 0) / similarSlots.length 
      : 0;

    // Calculate opportunity score based on performance gaps
    const opportunityScore = Math.min(10, Math.max(1, 
      (similarSlotsAvg > 8 ? 9 : similarSlotsAvg > 5 ? 7 : 5) + 
      (similarSlots.length > 10 ? 1 : 0)
    ));

    return { similarSlotsAvg, opportunityScore };
  }

  private analyzeLocationPerformance(data: ClassData[]) {
    const locations = ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House'];
    
    return locations.reduce((acc, location) => {
      const locationData = data.filter(item => item.location === location);
      if (locationData.length === 0) {
        acc[location] = { avgParticipants: 0, totalClasses: 0, avgRevenue: 0 };
        return acc;
      }

      acc[location] = {
        avgParticipants: locationData.reduce((sum, item) => sum + item.participants, 0) / locationData.length,
        totalClasses: locationData.length,
        avgRevenue: locationData.reduce((sum, item) => sum + item.totalRevenue, 0) / locationData.length
      };
      return acc;
    }, {} as any);
  }

  private analyzeTeacherUtilization(schedule: ScheduledClass[]) {
    return schedule.reduce((acc, cls) => {
      const teacher = `${cls.teacherFirstName} ${cls.teacherLastName}`;
      acc[teacher] = (acc[teacher] || 0) + parseFloat(cls.duration);
      return acc;
    }, {} as any);
  }

  private async generateEnhancedLocalSchedule(
    historicData: ClassData[],
    currentSchedule: ScheduledClass[],
    customTeachers: any[],
    options: any,
    studioRules?: StudioRules
): Promise<ScheduledClass[]> {
    console.log(`🔄 AI Service: Generating enhanced local schedule with ${options.optimizationType || 'balanced'} optimization...`);
    
    // Use the enhanced generateIntelligentSchedule function from classUtils
    const schedule = await generateIntelligentSchedule(historicData, customTeachers, {
      prioritizeTopPerformers: true,
      balanceShifts: true,
      optimizeTeacherHours: true,
      respectTimeRestrictions: true,
      minimizeTrainersPerShift: true,
      optimizationType: options.optimizationType || 'balanced',
      iteration: options.iteration || 0
    });

    console.log(`✅ AI Service: Generated enhanced local schedule with ${schedule.length} classes`);
    return schedule;
  }

  private parseOptimizedScheduleResponse(
    response: string, 
    historicData: ClassData[], 
    currentSchedule: ScheduledClass[] = [], 
    studioRules?: StudioRules
  ): ScheduledClass[] {
    try {
      const parsed = JSON.parse(response);
      const schedule = parsed.optimizedSchedule || parsed.suggestions || [];
      
      const validatedSchedule = schedule.map((cls: any, index: number) => ({
        id: `ai-optimized-${Date.now()}-${index}`,
        day: cls.day,
        time: cls.time,
        location: cls.location,
        classFormat: cls.classFormat,
        teacherFirstName: cls.teacherFirstName,
        teacherLastName: cls.teacherLastName,
        duration: cls.duration || '1',
        participants: cls.expectedParticipants,
        revenue: cls.expectedRevenue,
        isTopPerformer: cls.isTopPerformer || cls.priority >= 8
      })).filter((cls: ScheduledClass) => {
        // Validate each class against current schedule and rules
        const mockSuggestion: OptimizationSuggestion = {
          type: 'add_class',
          suggestedClass: cls,
          reason: 'AI generated',
          impact: 'Optimization',
          priority: 5
        };
        return this._validateAISuggestion(mockSuggestion, currentSchedule, studioRules).isValid;
      });
      
      return validatedSchedule;
    } catch (error) {
      console.error('🤖 AI Service: Failed to parse optimized schedule response:', error);
      return this.generateEnhancedLocalSchedule(historicData, currentSchedule, [], {}, studioRules);
    }
  }

  async optimizeSchedule(
    historicData: ClassData[],
    currentSchedule: ScheduledClass[],
    teacherAvailability: any = {},
    studioRules?: StudioRules
  ): Promise<OptimizationSuggestion[]> {
    // Always return fallback optimizations if no provider is configured or key is missing
    if (!this.provider || !this.provider.key || this.provider.key.trim() === '') {
      console.warn('🤖 AI Service: Provider not configured or missing API key, using enhanced fallback optimizations');
      return this.getEnhancedFallbackOptimizations(historicData, currentSchedule, studioRules);
    }

    const prompt = this.buildOptimizationPrompt(historicData, currentSchedule, teacherAvailability, studioRules);
    
    try {
      console.log('🤖 AI Service: Generating optimization suggestions...');
      const response = await this.callAI(prompt);
      const suggestions = this.parseOptimizationResponse(response, currentSchedule, studioRules);
      console.log(`✅ AI Service: Generated ${suggestions.length} optimization suggestions`);
      return suggestions.sort((a, b) => b.priority - a.priority);
    } catch (error) {
      console.warn('🤖 AI Service: Optimization error, falling back to enhanced local optimizations:', error);
      return this.getEnhancedFallbackOptimizations(historicData, currentSchedule, studioRules);
    }
  }

  private buildOptimizationPrompt(
    historicData: ClassData[], 
    currentSchedule: ScheduledClass[],
    teacherAvailability: any,
    studioRules?: StudioRules
  ): string {
    const priorityTeachers = ['Anisha', 'Vivaran', 'Mrigakshi', 'Pranjali', 'Atulan', 'Cauveri', 'Rohan'];
    const currentConflicts = this.analyzeCurrentConflicts(currentSchedule, studioRules);
    
    return `
      Analyze the current fitness studio schedule and provide SPECIFIC optimization suggestions:
      
      Current Schedule:
      ${currentSchedule.map(cls => `${cls.day} ${cls.time} - ${cls.classFormat} with ${cls.teacherFirstName} ${cls.teacherLastName} at ${cls.location}`).join('\n')}
      
      CURRENT CONFLICTS DETECTED:
      ${currentConflicts.length > 0 ? currentConflicts.join('\n') : 'No major conflicts detected'}
      
      STUDIO RULES TO ENFORCE:
      ${studioRules ? `
      - Teacher limits: ${studioRules.maxWeeklyHours}h/week, ${studioRules.maxDailyHours}h/day
      - Location capacity: ${Object.entries(studioRules.locationRules).map(([loc, rules]) => `${loc}: ${rules.maxParallelClasses} max`).join(', ')}
      - Format restrictions: ${Object.entries(studioRules.locationRules).map(([loc, rules]) => `${loc}: restricted ${rules.restrictedFormats.join(', ') || 'none'}`).join('; ')}
      ` : 'Using default rules: 15h/week, 4h/day, location capacity limits'}
      
      Provide SPECIFIC, ACTIONABLE optimization suggestions in JSON format:
      {
        "suggestions": [
          {
            "type": "trainer_change|level_change|timing_change|add_class|remove_class",
            "originalClass": {...},
            "suggestedClass": {...},
            "reason": "specific reason with conflict resolution focus",
            "impact": "expected improvement with metrics",
            "priority": 8,
            "validationStatus": "valid",
            "validationMessage": "checked against all rules and conflicts"
          }
        ]
      }
      
      CRITICAL: Focus on resolving existing conflicts first, then optimization improvements.
      Every suggestion MUST be validated against current schedule and studio rules.
    `;
  }

  private analyzeClassPerformance(data: ClassData[]) {
    const classStats = data.reduce((acc, item) => {
      if (!acc[item.cleanedClass]) {
        acc[item.cleanedClass] = { participants: 0, revenue: 0, count: 0 };
      }
      acc[item.cleanedClass].participants += item.participants;
      acc[item.cleanedClass].revenue += item.totalRevenue;
      acc[item.cleanedClass].count += 1;
      return acc;
    }, {} as any);

    return Object.entries(classStats)
      .map(([classFormat, stats]: [string, any]) => ({
        classFormat,
        avgParticipants: stats.participants / stats.count,
        avgRevenue: stats.revenue / stats.count,
        frequency: stats.count
      }))
      .sort((a, b) => b.avgParticipants - a.avgParticipants);
  }

  private analyzeTeacherPerformance(data: ClassData[]) {
    const teacherStats = data.reduce((acc, item) => {
      if (!acc[item.teacherName]) {
        acc[item.teacherName] = { participants: 0, count: 0 };
      }
      acc[item.teacherName].participants += item.participants;
      acc[item.teacherName].count += 1;
      return acc;
    }, {} as any);

    return Object.entries(teacherStats)
      .map(([teacher, stats]: [string, any]) => ({
        teacher,
        avgParticipants: stats.participants / stats.count,
        classesCount: stats.count
      }))
      .sort((a, b) => b.avgParticipants - a.avgParticipants);
  }

  private async callAI(prompt: string): Promise<string> {
    if (!this.provider) throw new Error('No AI provider configured');
    if (!this.provider.key || this.provider.key.trim() === '') {
      throw new Error('No API key provided');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.provider.key}`
    };

    let body: any;
    let url = this.provider.endpoint;

    switch (this.provider.name) {
      case 'OpenAI':
        body = {
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4000
        };
        break;
      
      case 'Anthropic':
        headers['anthropic-version'] = '2023-06-01';
        body = {
          model: 'claude-3-sonnet-20240229',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 4000
        };
        break;
      
      case 'DeepSeek':
        body = {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4000
        };
        break;
      
      case 'Groq':
        body = {
          model: 'mixtral-8x7b-32768',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4000
        };
        break;
      
      default:
        throw new Error('Unsupported AI provider');
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API error (${response.status}): ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      
      if (this.provider.name === 'Anthropic') {
        return data.content?.[0]?.text || '';
      } else {
        return data.choices?.[0]?.message?.content || '';
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to AI service. Please check your internet connection.');
      }
      throw error;
    }
  }

  private parseAIResponse(response: string, currentSchedule: ScheduledClass[] = [], studioRules?: StudioRules): AIRecommendation[] {
    try {
      const parsed = JSON.parse(response);
      const recommendations = (parsed.recommendations || []).map((rec: any) => ({
        ...rec,
        priority: rec.priority || 5
      }));
      
      // Validate recommendations against current schedule
      return recommendations.filter((rec: AIRecommendation) => {
        // Check if the recommended slot is available
        const slotConflict = currentSchedule.some(cls => 
          cls.day === rec.timeSlot?.split(' ')[0] && 
          cls.time === rec.timeSlot && 
          cls.location === rec.location
        );
        
        if (slotConflict) {
          console.warn(`🤖 AI Service: Filtered out conflicting recommendation for ${rec.timeSlot} at ${rec.location}`);
          return false;
        }
        
        return true;
      });
    } catch (error) {
      console.error('🤖 AI Service: Failed to parse AI response:', error);
      return [];
    }
  }

  private parseOptimizationResponse(response: string, currentSchedule: ScheduledClass[] = [], studioRules?: StudioRules): OptimizationSuggestion[] {
    try {
      const parsed = JSON.parse(response);
      const suggestions = (parsed.suggestions || []).map((sug: any) => ({
        ...sug,
        priority: sug.priority || 5,
        type: this.mapSuggestionType(sug.type)
      }));
      
      // Validate each suggestion
      return suggestions.filter((sug: OptimizationSuggestion) => {
        const validation = this._validateAISuggestion(sug, currentSchedule, studioRules);
        if (!validation.isValid) {
          console.warn(`🤖 AI Service: Filtered out invalid suggestion: ${validation.message}`);
          return false;
        }
        sug.validationStatus = 'valid';
        sug.validationMessage = validation.message;
        return true;
      });
    } catch (error) {
      console.error('🤖 AI Service: Failed to parse optimization response:', error);
      return [];
    }
  }

  private mapSuggestionType(type: string): OptimizationSuggestion['type'] {
    switch (type) {
      case 'teacher_change': return 'trainer_change';
      case 'format_change': return 'level_change';
      case 'time_change': return 'timing_change';
      case 'new_class': return 'add_class';
      default: return type as OptimizationSuggestion['type'];
    }
  }

  private getEnhancedFallbackRecommendations(
    data: ClassData[], 
    location: string, 
    day: string, 
    time: string,
    currentSchedule: ScheduledClass[] = [],
    studioRules?: StudioRules
): AIRecommendation[] {
    console.log(`🔄 AI Service: Generating enhanced fallback recommendations for ${location} on ${day} at ${time}`);
    
    // Check if slot is already occupied
    const slotOccupied = currentSchedule.some(cls => 
      cls.day === day && cls.time === time && cls.location === location
    );
    
    if (slotOccupied) {
      console.log(`🔄 AI Service: Slot ${day} ${time} at ${location} is occupied, no recommendations`);
      return [];
    }
    
    const locationData = data.filter(item => item.location === location);
    const classStats = this.analyzeClassPerformance(locationData);

    // If no location data, use all data
    const analysisData = locationData.length > 0 ? locationData : data;
    const finalStats = locationData.length > 0 ? classStats : this.analyzeClassPerformance(data);

    // Filter by location rules
    const validStats = finalStats.filter(stats => {
      const locationRules = studioRules?.locationRules[location];
      if (locationRules?.restrictedFormats.includes(stats.classFormat)) {
        return false;
      }
      return true;
    });

    return validStats.slice(0, 5).map((stats, index) => ({
      classFormat: stats.classFormat,
      teacher: 'Best Available (Enhanced)',
      reasoning: `High-performing class with ${stats.avgParticipants.toFixed(1)} average participants (validated against current schedule and studio rules)`,
      confidence: Math.min(0.9, stats.frequency / 10),
      expectedParticipants: Math.round(stats.avgParticipants),
      expectedRevenue: Math.round(stats.avgRevenue),
      priority: 10 - index * 2,
      timeSlot: time,
      location: location
    }));
  }

  private getEnhancedFallbackOptimizations(
    historicData: ClassData[],
    currentSchedule: ScheduledClass[],
    studioRules?: StudioRules
  ): OptimizationSuggestion[] {
    console.log('🔄 AI Service: Generating enhanced fallback optimizations...');
    
    // Enhanced optimization logic as fallback
    const suggestions: OptimizationSuggestion[] = [];
    
    // Find teachers with too many hours
    const teacherHours = this.calculateCurrentTeacherHours(currentSchedule);
    const teacherDailyClasses: Record<string, Record<string, number>> = {};
    const teacherLocations: Record<string, Record<string, string[]>> = {};
    
    currentSchedule.forEach(cls => {
      const teacherName = `${cls.teacherFirstName} ${cls.teacherLastName}`;
      
      if (!teacherDailyClasses[teacherName]) teacherDailyClasses[teacherName] = {};
      if (!teacherLocations[teacherName]) teacherLocations[teacherName] = {};
      
      teacherDailyClasses[teacherName][cls.day] = (teacherDailyClasses[teacherName][cls.day] || 0) + 1;
      
      if (!teacherLocations[teacherName][cls.day]) teacherLocations[teacherName][cls.day] = [];
      if (!teacherLocations[teacherName][cls.day].includes(cls.location)) {
        teacherLocations[teacherName][cls.day].push(cls.location);
      }
    });

    // Suggest redistributing hours for overloaded teachers
    Object.entries(teacherHours).forEach(([teacher, hours]) => {
      const maxHours = studioRules?.maxWeeklyHours || 15;
      if (hours > maxHours) {
        const overloadedClasses = currentSchedule.filter(cls => 
          `${cls.teacherFirstName} ${cls.teacherLastName}` === teacher
        );
        
        const excessHours = hours - maxHours;
        let redistributedHours = 0;
        
        for (const cls of overloadedClasses) {
          if (redistributedHours >= excessHours) break;
          
          const alternativeTeacher = this.findAlternativeTeacher(cls, currentSchedule, teacherHours, studioRules);
          
          if (alternativeTeacher) {
            suggestions.push({
              type: 'trainer_change',
              originalClass: cls,
              suggestedClass: {
                ...cls,
                teacherFirstName: alternativeTeacher.split(' ')[0],
                teacherLastName: alternativeTeacher.split(' ').slice(1).join(' ')
              },
              reason: `${teacher} exceeds ${maxHours}h limit (${hours.toFixed(1)}h). Redistribute to maintain compliance.`,
              impact: 'Better work-life balance, reduced teacher fatigue, and improved class quality through optimal trainer assignment',
              priority: 9,
              validationStatus: 'valid',
              validationMessage: 'Reduces teacher overload while maintaining quality'
            });
          }
          
          redistributedHours += parseFloat(cls.duration);
        }
      } else if (hours < (maxHours - 3) && studioRules?.priorityTeachers.some(pt => teacher.includes(pt))) {
        // Suggest adding classes for underutilized priority teachers
        const availableHours = maxHours - hours;
        const potentialClasses = this.findPotentialClassesForTeacher(teacher, currentSchedule, historicData, studioRules);
        
        for (const potentialClass of potentialClasses.slice(0, 2)) {
          if (parseFloat(potentialClass.duration) <= availableHours) {
            suggestions.push({
              type: 'add_class',
              suggestedClass: potentialClass,
              reason: `${teacher} is underutilized (${hours.toFixed(1)}h/${maxHours}h)`,
              impact: `Increases ${teacher}'s hours to ${(hours + parseFloat(potentialClass.duration)).toFixed(1)}h`,
              priority: 7,
              validationStatus: 'valid',
              validationMessage: 'Optimizes priority teacher utilization'
            });
          }
        }
      }
    });

    // Check for cross-location assignments
    Object.entries(teacherLocations).forEach(([teacher, dayLocations]) => {
      Object.entries(dayLocations).forEach(([day, locations]) => {
        if (locations.length > 1) {
          const crossLocationClasses = currentSchedule.filter(cls => 
            `${cls.teacherFirstName} ${cls.teacherLastName}` === teacher && cls.day === day
          );
          
          if (crossLocationClasses.length > 1) {
            suggestions.push({
              type: 'trainer_change',
              originalClass: crossLocationClasses[1],
              suggestedClass: {
                ...crossLocationClasses[1],
                teacherFirstName: 'Location-Consistent',
                teacherLastName: 'Teacher'
              },
              reason: `${teacher} assigned to multiple locations on ${day} (${locations.join(', ')})`,
              impact: 'Improved operational efficiency, reduced travel time, and better trainer focus',
              priority: 9,
              validationStatus: 'valid',
              validationMessage: 'Enforces one location per teacher per day rule'
            });
          }
        }
      });
    });

    // Check for daily class limits
    Object.entries(teacherDailyClasses).forEach(([teacher, dailyClasses]) => {
      Object.entries(dailyClasses).forEach(([day, classCount]) => {
        if (classCount > 4) {
          const dayClasses = currentSchedule.filter(cls => 
            `${cls.teacherFirstName} ${cls.teacherLastName}` === teacher && cls.day === day
          );
          
          if (dayClasses.length > 0) {
            suggestions.push({
              type: 'trainer_change',
              originalClass: dayClasses[dayClasses.length - 1],
              suggestedClass: {
                ...dayClasses[dayClasses.length - 1],
                teacherFirstName: 'Alternative',
                teacherLastName: 'Teacher'
              },
              reason: `${teacher} has ${classCount} classes on ${day}, exceeding daily limit`,
              impact: 'Prevents trainer fatigue and maintains high-quality instruction throughout the day',
              priority: 8,
              validationStatus: 'valid',
              validationMessage: 'Enforces daily class limits'
            });
          }
        }
      });
    });

    console.log(`✅ AI Service: Generated ${suggestions.length} enhanced fallback optimization suggestions`);
    return suggestions.slice(0, 5); // Return top 5 suggestions
  }

  private findAlternativeTeacher(
    cls: ScheduledClass, 
    currentSchedule: ScheduledClass[], 
    teacherHours: Record<string, number>, 
    studioRules?: StudioRules
  ): string | null {
    const maxHours = studioRules?.maxWeeklyHours || 15;
    const classDuration = parseFloat(cls.duration);
    
    // Find teachers with available capacity
    const availableTeachers = Object.entries(teacherHours)
      .filter(([teacher, hours]) => hours + classDuration <= maxHours)
      .map(([teacher]) => teacher);
    
    // Check if any available teacher is not already scheduled at the same time
    for (const teacher of availableTeachers) {
      const hasConflict = currentSchedule.some(existingCls => 
        `${existingCls.teacherFirstName} ${existingCls.teacherLastName}` === teacher &&
        existingCls.day === cls.day &&
        existingCls.time === cls.time
      );
      
      if (!hasConflict) {
        return teacher;
      }
    }
    
    return null;
  }

  private findPotentialClassesForTeacher(
    teacher: string, 
    currentSchedule: ScheduledClass[], 
    historicData: ClassData[], 
    studioRules?: StudioRules
  ): ScheduledClass[] {
    // Find successful classes this teacher has taught
    const teacherClasses = historicData.filter(item => 
      item.teacherName === teacher && 
      item.participants >= (studioRules?.minParticipantsThreshold || 5)
    );
    
    if (teacherClasses.length === 0) return [];
    
    // Find best performing class formats for this teacher
    const formatStats = teacherClasses.reduce((acc, item) => {
      if (!acc[item.cleanedClass]) {
        acc[item.cleanedClass] = { participants: 0, count: 0 };
      }
      acc[item.cleanedClass].participants += item.participants;
      acc[item.cleanedClass].count += 1;
      return acc;
    }, {} as any);
    
    const bestFormats = Object.entries(formatStats)
      .map(([format, stats]: [string, any]) => ({
        format,
        avgParticipants: stats.participants / stats.count
      }))
      .sort((a, b) => b.avgParticipants - a.avgParticipants)
      .slice(0, 3);
    
    // Generate potential classes
    const potentialClasses: ScheduledClass[] = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const timeSlots = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '17:30', '18:00', '18:30', '19:00', '19:30'];
    const locations = ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House'];
    
    for (const { format } of bestFormats) {
      for (const location of locations) {
        // Check location restrictions
        const locationRules = studioRules?.locationRules[location];
        if (locationRules?.restrictedFormats.includes(format)) continue;
        
        for (const day of days) {
          for (const time of timeSlots) {
            // Check if slot is available
            const existingClass = currentSchedule.find(cls => 
              cls.location === location && cls.day === day && cls.time === time
            );
            
            if (!existingClass) {
              potentialClasses.push({
                id: `potential-${Date.now()}-${Math.random()}`,
                day,
                time,
                location,
                classFormat: format,
                teacherFirstName: teacher.split(' ')[0],
                teacherLastName: teacher.split(' ').slice(1).join(' '),
                duration: '1',
                participants: Math.round(formatStats[format].participants / formatStats[format].count)
              });
            }
          }
        }
      }
    }
    
    return potentialClasses.slice(0, 5);
  }
}

export const aiService = new AIService();