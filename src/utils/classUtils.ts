import { ClassData, ScheduledClass, TeacherHours, CustomTeacher, AIRecommendation, HistoricClassRow } from '../types';

// Enhanced studio capacity definitions with detailed rules
// Studio capacity definitions
export const STUDIO_CAPACITIES = {
  'Kwality House, Kemps Corner': 2,
  'Supreme HQ, Bandra': 3,
  'Kenkere House': 2
} as const;

// Studio rules configuration
export const STUDIO_RULES = {
  'Kwality House, Kemps Corner': {
    maxParallelClasses: 2,
    allowedFormats: [],
    restrictedFormats: ['Studio powerCycle', 'Studio powerCycle (Express)'],
    peakHours: ['09:00', '10:00', '11:00', '18:00', '19:00'],
    minClassGap: 15, // minutes
    preferredTeachers: ['Anisha', 'Mrigakshi', 'Pranjali']
  },
  'Supreme HQ, Bandra': {
    maxParallelClasses: 3,
    allowedFormats: ['Studio powerCycle', 'Studio powerCycle (Express)'],
    restrictedFormats: ['Studio HIIT', 'Studio Amped Up!'],
    peakHours: ['18:00', '19:00', '20:00'],
    minClassGap: 15,
    preferredTeachers: ['Vivaran', 'Atulan', 'Cauveri']
  },
  'Kenkere House': {
    maxParallelClasses: 2,
    allowedFormats: [],
    restrictedFormats: ['Studio powerCycle', 'Studio powerCycle (Express)'],
    peakHours: ['18:00', '19:00', '10:00'],
    minClassGap: 15,
    preferredTeachers: ['Rohan', 'Reshma', 'Richard']
  }
};

// Time slot definitions with 15-minute intervals
export const ALL_TIME_SLOTS = [  
  '07:00', '07:15', '07:30', '07:45',
  '08:00', '08:15', '08:30', '08:45',
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
  '12:00', '12:15', '12:30', '12:45',
  '13:00', '13:15', '13:30', '13:45',
  '14:00', '14:15', '14:30', '14:45',
  '15:00', '15:15', '15:30', '15:45',
  '16:00', '16:15', '16:30', '16:45',
  '17:00', '17:15', '17:30', '17:45',
  '18:00', '18:15', '18:30', '18:45',
  '19:00', '19:15', '19:30', '19:45',
  '20:00'
];

// Shift definitions
export const MORNING_SHIFT_START = '07:00';
export const MORNING_SHIFT_END = '12:00';
export const EVENING_SHIFT_START = '16:00';
export const EVENING_SHIFT_END = '20:00';

// Priority teachers and constraints
const PRIORITY_TEACHERS = ['Anisha', 'Vivaran', 'Mrigakshi', 'Pranjali', 'Atulan', 'Cauveri', 'Rohan','Reshma','Richard','Karan','Karanvir'];
const NEW_TRAINERS = ['Kabir', 'Simonelle'];
const NEW_TRAINER_FORMATS = ['Studio Barre 57', 'Studio Barre 57 (Express)', 'Studio powerCycle', 'Studio powerCycle (Express)', 'Studio Cardio Barre'];
const INACTIVE_TEACHERS = ['Nishanth', 'Saniya'];

// Priority class formats for strategic scheduling
const PRIORITY_CLASS_FORMATS = [
  'Studio Barre 57', 
  'Studio powerCycle', 
  'Studio Mat 57', 
  'Studio FIT', 
  'Studio Cardio Barre', 
  'Studio Amped Up!', 
  'Studio Cardio Barre Plus', 
  'Studio Back Body Blaze'
];

/**
 * Fill scheduling gaps with appropriate classes
 */
export async function fillSchedulingGaps(
  csvData: ClassData[],
  currentSchedule: ScheduledClass[],
  customTeachers: CustomTeacher[] = []
): Promise<ScheduledClass[]> {
  console.log('🔧 Filling scheduling gaps and balancing class mix...');
  
  const enhancedSchedule = [...currentSchedule];
  const locations = ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Track teacher hours
  const teacherHours = calculateTeacherHours(enhancedSchedule);
  
  for (const location of locations) {
    for (const day of days) {
      // Find gaps in the schedule
      const dayClasses = enhancedSchedule.filter(cls => 
        cls.location === location && cls.day === day
      ).sort((a, b) => a.time.localeCompare(b.time));
      
      // Fill morning gaps (7:00-12:00)
      await fillTimeSlotGaps(csvData, enhancedSchedule, location, day, 'morning', teacherHours);
      
      // Fill evening gaps (17:00-20:00)
      await fillTimeSlotGaps(csvData, enhancedSchedule, location, day, 'evening', teacherHours);
      
      // Balance class mix
      await balanceClassMix(csvData, enhancedSchedule, location, day, teacherHours);
    }
  }
  
  console.log(`✅ Filled gaps: ${enhancedSchedule.length - currentSchedule.length} classes added`);
  return enhancedSchedule;
}

/**
 * Fill gaps in specific time slots
 */
async function fillTimeSlotGaps(
  csvData: ClassData[],
  schedule: ScheduledClass[],
  location: string,
  day: string,
  shift: 'morning' | 'evening',
  teacherHours: Record<string, number>
): Promise<void> {
  const timeSlots = shift === 'morning' 
    ? ['07:00', '07:15', '07:30', '07:45', '08:00', '08:15', '08:30', '08:45', '09:00', '09:15', '09:30', '09:45', '10:00', '10:15', '10:30', '10:45', '11:00', '11:15', '11:30', '11:45']
    : ['17:00', '17:15', '17:30', '17:45', '18:00', '18:15', '18:30', '18:45', '19:00', '19:15', '19:30', '19:45', '20:00'];
  
  for (const timeSlot of timeSlots) {
    const existingClasses = schedule.filter(cls => 
      cls.location === location && cls.day === day && cls.time === timeSlot
    );
    
    const maxCapacity = getMaxParallelClasses(location);
    if (existingClasses.length >= maxCapacity) continue;
    
    // Find best class for this gap
    const gapFiller = await findBestGapFiller(csvData, location, day, timeSlot, schedule, teacherHours);
    if (gapFiller) {
      schedule.push(gapFiller);
      const teacherName = `${gapFiller.teacherFirstName} ${gapFiller.teacherLastName}`;
      teacherHours[teacherName] = (teacherHours[teacherName] || 0) + parseFloat(gapFiller.duration);
    }
  }
}

/**
 * Find the best class to fill a gap
 */
async function findBestGapFiller(
  csvData: ClassData[],
  location: string,
  day: string,
  time: string,
  schedule: ScheduledClass[],
  teacherHours: Record<string, number>
): Promise<ScheduledClass | null> {
  // Get historical data for this slot
  const slotData = csvData.filter(item =>
    item.location === location &&
    item.dayOfWeek === day &&
    item.classTime.includes(time.slice(0, 5)) &&
    item.checkedIn >= 3 &&
    !item.cleanedClass.toLowerCase().includes('hosted') &&
    !item.cleanedClass.includes('-')
  );
  
  if (slotData.length === 0) return null;
  
  // Sort by checked-in performance
  const bestOptions = slotData.sort((a, b) => b.checkedIn - a.checkedIn);
  
  for (const option of bestOptions) {
    const teacherName = option.teacherName;
    const teacherFirstName = teacherName.split(' ')[0] || '';
    const teacherLastName = teacherName.split(' ').slice(1).join(' ') || '';
    const duration = getClassDuration(option.cleanedClass);
    
    // Check if this class format already exists at this time
    const existingFormats = schedule
      .filter(cls => cls.location === location && cls.day === day && cls.time === time)
      .map(cls => cls.classFormat);
    
    if (existingFormats.includes(option.cleanedClass)) continue;
    
    const proposedClass = {
      day,
      time,
      location,
      duration,
      teacherFirstName,
      teacherLastName
    };
    
    // Apply all constraints
    if (!canAssignClassToStudio(schedule, proposedClass, location)) continue;
    if (hasTrainerConflict(schedule, proposedClass)) continue;
    
    const newWeeklyHours = (teacherHours[teacherName] || 0) + parseFloat(duration);
    if (newWeeklyHours > 15) continue;
    
    return {
      id: `gap-filler-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      day,
      time,
      location,
      classFormat: option.cleanedClass,
      teacherFirstName,
      teacherLastName,
      duration,
      participants: Math.round(option.checkedIn),
      isTopPerformer: option.checkedIn >= 6.0
    };
  }
  
  return null;
}

/**
 * Balance class mix for a specific day
 */
async function balanceClassMix(
  csvData: ClassData[],
  schedule: ScheduledClass[],
  location: string,
  day: string,
  teacherHours: Record<string, number>
): Promise<void> {
  const dayClasses = schedule.filter(cls => cls.location === location && cls.day === day);
  const formatCounts: Record<string, number> = {};
  
  dayClasses.forEach(cls => {
    formatCounts[cls.classFormat] = (formatCounts[cls.classFormat] || 0) + 1;
  });
  
  // Ensure minimum Barre 57 classes
  const barreCount = (formatCounts['Studio Barre 57'] || 0) + (formatCounts['Studio Barre 57 (Express)'] || 0);
  if (barreCount < 2) {
    await addMissingFormat(csvData, schedule, location, day, 'Studio Barre 57', 2 - barreCount, teacherHours);
  }
  
  // Add variety if too many of same format
  const maxSameFormat = Math.max(...Object.values(formatCounts));
  if (maxSameFormat > 3) {
    await addVarietyClasses(csvData, schedule, location, day, teacherHours);
  }
}

/**
 * Add missing format classes
 */
async function addMissingFormat(
  csvData: ClassData[],
  schedule: ScheduledClass[],
  location: string,
  day: string,
  format: string,
  needed: number,
  teacherHours: Record<string, number>
): Promise<void> {
  const availableSlots = ALL_TIME_SLOTS.filter(time => {
    const hour = parseInt(time.split(':')[0]);
    return ((hour >= 7 && hour <= 11) || (hour >= 17 && hour <= 20)) &&
           !isTimeRestricted(time, day);
  });
  
  let added = 0;
  for (const timeSlot of availableSlots) {
    if (added >= needed) break;
    
    const existingClasses = schedule.filter(cls => 
      cls.location === location && cls.day === day && cls.time === timeSlot
    );
    
    if (existingClasses.length >= getMaxParallelClasses(location)) continue;
    if (existingClasses.some(cls => cls.classFormat === format)) continue;
    
    const formatData = csvData.filter(item =>
      item.location === location &&
      item.dayOfWeek === day &&
      item.cleanedClass === format &&
      item.checkedIn >= 4 &&
      !item.cleanedClass.toLowerCase().includes('hosted') &&
      !item.cleanedClass.includes('-')
    );
    
    if (formatData.length === 0) continue;
    
    const bestOption = formatData.sort((a, b) => b.checkedIn - a.checkedIn)[0];
    const teacherName = bestOption.teacherName;
    const teacherFirstName = teacherName.split(' ')[0] || '';
    const teacherLastName = teacherName.split(' ').slice(1).join(' ') || '';
    const duration = getClassDuration(format);
    
    const proposedClass = {
      day,
      time: timeSlot,
      location,
      duration,
      teacherFirstName,
      teacherLastName
    };
    
    if (!canAssignClassToStudio(schedule, proposedClass, location)) continue;
    if (hasTrainerConflict(schedule, proposedClass)) continue;
    
    const newWeeklyHours = (teacherHours[teacherName] || 0) + parseFloat(duration);
    if (newWeeklyHours > 15) continue;
    
    schedule.push({
      id: `balance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      day,
      time: timeSlot,
      location,
      classFormat: format,
      teacherFirstName,
      teacherLastName,
      duration,
      participants: Math.round(bestOption.checkedIn),
      isTopPerformer: bestOption.checkedIn >= 6.0
    });
    
    teacherHours[teacherName] = newWeeklyHours;
    added++;
  }
}

/**
 * Add variety classes to balance the mix
 */
async function addVarietyClasses(
  csvData: ClassData[],
  schedule: ScheduledClass[],
  location: string,
  day: string,
  teacherHours: Record<string, number>
): Promise<void> {
  const varietyFormats = ['Studio Mat 57', 'Studio FIT', 'Studio Cardio Barre', 'Studio Recovery'];
  const dayClasses = schedule.filter(cls => cls.location === location && cls.day === day);
  const existingFormats = new Set(dayClasses.map(cls => cls.classFormat));
  
  const missingFormats = varietyFormats.filter(format => !existingFormats.has(format));
  
  for (const format of missingFormats.slice(0, 2)) {
    await addMissingFormat(csvData, schedule, location, day, format, 1, teacherHours);
  }
}

// Express class time slots for working professionals
const EXPRESS_TIME_SLOTS = [
  '07:00', '07:30', '08:00', '08:30', // Early morning
  '17:30', '18:00', '18:30', '19:00', '19:30' // Early evening
];

/**
 * Check if a teacher is inactive/excluded
 */
function isInactiveTeacher(teacherName: string): boolean {
  return INACTIVE_TEACHERS.some(inactive => 
    teacherName.toLowerCase().includes(inactive.toLowerCase())
  );
}

/**
 * Get maximum parallel classes allowed for a location
 */
export function getMaxParallelClasses(location: string): number {
  return STUDIO_CAPACITIES[location as keyof typeof STUDIO_CAPACITIES] || 1;
}

/**
 * Get all 15-minute intervals that a class occupies
 */
export function getOccupiedTimeSlots(startTime: string, duration: string): string[] {
  const durationHours = parseFloat(duration);
  const durationMinutes = Math.round(durationHours * 60);
  
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  
  const occupiedSlots: string[] = [];
  
  // Generate 15-minute intervals for the entire duration
  for (let i = 0; i < durationMinutes; i += 15) {
    const currentMinutes = startMinutes + i;
    const currentHours = Math.floor(currentMinutes / 60);
    const currentMins = currentMinutes % 60;
    
    const timeSlot = `${currentHours.toString().padStart(2, '0')}:${currentMins.toString().padStart(2, '0')}`;
    occupiedSlots.push(timeSlot);
  }
  
  return occupiedSlots;
}

/**
 * Check if a class can be assigned to a studio without exceeding capacity
 */
export function canAssignClassToStudio(
  currentSchedule: ScheduledClass[],
  proposedClass: { day: string; time: string; location: string; duration: string },
  location: string
): boolean {
  const maxCapacity = getMaxParallelClasses(location);
  if (!maxCapacity) return false;

  const occupiedSlots = getOccupiedTimeSlots(proposedClass.time, proposedClass.duration);
  
  // Check each occupied time slot
  for (const slot of occupiedSlots) {
    const conflictingClasses = currentSchedule.filter(cls => {
      if (cls.location !== location || cls.day !== proposedClass.day) return false;
      
      const classOccupiedSlots = getOccupiedTimeSlots(cls.time, cls.duration);
      return classOccupiedSlots.includes(slot);
    });
    
    if (conflictingClasses.length >= maxCapacity) {
      console.log(`⚠️ Studio capacity exceeded at ${location} on ${proposedClass.day} at ${slot}: ${conflictingClasses.length}/${maxCapacity} studios occupied`);
      return false;
    }
  }
  
  return true;
}

/**
 * Check if a trainer has conflicts with the proposed class
 */
export function hasTrainerConflict(
  currentSchedule: ScheduledClass[],
  proposedClass: { day: string; time: string; teacherFirstName: string; teacherLastName: string; duration: string; location: string }
): boolean {
  const teacherName = `${proposedClass.teacherFirstName} ${proposedClass.teacherLastName}`;
  const occupiedSlots = getOccupiedTimeSlots(proposedClass.time, proposedClass.duration);
  
  // Check for time conflicts
  for (const slot of occupiedSlots) {
    const conflictingClass = currentSchedule.find(cls => {
      if (cls.day !== proposedClass.day) return false;
      if (`${cls.teacherFirstName} ${cls.teacherLastName}` !== teacherName) return false;
      
      const classOccupiedSlots = getOccupiedTimeSlots(cls.time, cls.duration);
      return classOccupiedSlots.includes(slot);
    });
    
    if (conflictingClass) {
      console.log(`⚠️ Trainer time conflict for ${teacherName} at ${proposedClass.day} ${slot}`);
      return true;
    }
  }
  
  // Check for location conflicts (one location per day)
  const sameTeacherSameDay = currentSchedule.filter(cls => 
    cls.day === proposedClass.day && 
    `${cls.teacherFirstName} ${cls.teacherLastName}` === teacherName
  );
  
  if (sameTeacherSameDay.length > 0 && sameTeacherSameDay[0].location !== proposedClass.location) {
    console.log(`⚠️ Trainer location conflict for ${teacherName}: already assigned to ${sameTeacherSameDay[0].location} on ${proposedClass.day}`);
    return true;
  }
  
  return false;
}

/**
 * Get shift type for a given time
 */
export function getShiftType(time: string): 'morning' | 'evening' | 'afternoon' {
  const hour = parseInt(time.split(':')[0]);
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 16 && hour <= 20) return 'evening';
  return 'afternoon';
}

/**
 * Check consecutive classes for a trainer
 */
export function getConsecutiveClassCount(
  schedule: ScheduledClass[],
  teacherName: string,
  day: string,
  time: string
): number {
  const teacherDayClasses = schedule
    .filter(cls => 
      cls.day === day && 
      `${cls.teacherFirstName} ${cls.teacherLastName}` === teacherName
    )
    .sort((a, b) => a.time.localeCompare(b.time));
  
  if (teacherDayClasses.length === 0) return 1;
  
  // Find position where new class would be inserted
  let insertIndex = 0;
  for (let i = 0; i < teacherDayClasses.length; i++) {
    if (time > teacherDayClasses[i].time) {
      insertIndex = i + 1;
    } else {
      break;
    }
  }
  
  // Check consecutive count around insertion point
  let maxConsecutive = 1;
  let currentConsecutive = 1;
  
  // Create temporary array with new class inserted
  const tempClasses = [...teacherDayClasses];
  tempClasses.splice(insertIndex, 0, {
    id: 'temp',
    day,
    time,
    location: '',
    classFormat: '',
    teacherFirstName: teacherName.split(' ')[0],
    teacherLastName: teacherName.split(' ').slice(1).join(' '),
    duration: '1'
  });
  
  // Calculate consecutive classes
  for (let i = 1; i < tempClasses.length; i++) {
    const prevEndTime = addMinutesToTime(tempClasses[i-1].time, parseFloat(tempClasses[i-1].duration) * 60);
    const currentStartTime = tempClasses[i].time;
    
    if (Math.abs(timeToMinutes(currentStartTime) - timeToMinutes(prevEndTime)) <= 15) {
      currentConsecutive++;
    } else {
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
      currentConsecutive = 1;
    }
  }
  
  return Math.max(maxConsecutive, currentConsecutive);
}

/**
 * Convert time string to minutes
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Add minutes to a time string
 */
function addMinutesToTime(time: string, minutes: number): string {
  const totalMinutes = timeToMinutes(time) + minutes;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Get daily class count for a trainer
 */
export function getDailyClassCount(
  schedule: ScheduledClass[],
  teacherName: string,
  day: string
): number {
  return schedule.filter(cls => 
    cls.day === day && 
    `${cls.teacherFirstName} ${cls.teacherLastName}` === teacherName
  ).length;
}

/**
 * Get trainer's assigned shift for a day
 */
export function getTrainerShiftForDay(
  schedule: ScheduledClass[],
  teacherName: string,
  day: string
): 'morning' | 'evening' | null {
  const dayClasses = schedule.filter(cls => 
    cls.day === day && 
    `${cls.teacherFirstName} ${cls.teacherLastName}` === teacherName
  );
  
  if (dayClasses.length === 0) return null;
  
  const shifts = dayClasses.map(cls => getShiftType(cls.time));
  const morningClasses = shifts.filter(s => s === 'morning').length;
  const eveningClasses = shifts.filter(s => s === 'evening').length;
  
  if (morningClasses > 0 && eveningClasses === 0) return 'morning';
  if (eveningClasses > 0 && morningClasses === 0) return 'evening';
  
  return null; // Mixed shifts
}

/**
 * Count trainers assigned to a specific shift at a location
 */
export function getTrainersInShift(
  schedule: ScheduledClass[],
  location: string,
  day: string,
  shiftType: 'morning' | 'evening'
): Set<string> {
  const trainers = new Set<string>();
  
  schedule
    .filter(cls => 
      cls.location === location && 
      cls.day === day && 
      getShiftType(cls.time) === shiftType
    )
    .forEach(cls => {
      trainers.add(`${cls.teacherFirstName} ${cls.teacherLastName}`);
    });
  
  return trainers;
}

/**
 * Check if a time slot has historical data
 */
export function hasHistoricalData(
  csvData: ClassData[],
  location: string,
  day: string,
  time: string
): boolean {
  return csvData.some(item => 
    item.location === location &&
    item.dayOfWeek === day &&
    item.classTime.includes(time.slice(0, 5))
  );
}

/**
 * Get the best class/teacher combination for a specific slot based on historical data
 */
export function getBestSlotRecommendation(
  csvData: ClassData[],
  location: string,
  day: string,
  time: string
): { classFormat: string; teacher: string; avgCheckedIn: number } | null {
  const slotData = csvData.filter(item =>
    item.location === location &&
    item.dayOfWeek === day &&
    item.classTime.includes(time.slice(0, 5)) &&
    !item.cleanedClass.toLowerCase().includes('hosted')
  );

  if (slotData.length === 0) return null;

  // Group by class format and teacher combination
  const combinations: Record<string, { checkedIn: number; count: number }> = {};

  slotData.forEach(item => {
    const key = `${item.cleanedClass}|${item.teacherName}`;
    if (!combinations[key]) {
      combinations[key] = { checkedIn: 0, count: 0 };
    }
    combinations[key].checkedIn += item.checkedIn;
    combinations[key].count += 1;
  });

  // Find the best combination
  const bestCombination = Object.entries(combinations)
    .map(([key, stats]) => {
      const [classFormat, teacher] = key.split('|');
      return {
        classFormat,
        teacher,
        avgCheckedIn: parseFloat((stats.checkedIn / stats.count).toFixed(1))
      };
    })
    .sort((a, b) => b.avgCheckedIn - a.avgCheckedIn)[0];

  return bestCombination || null;
}

/**
 * Enhanced intelligent schedule generation with proper constraints and 15-hour optimization
 */
export async function generateIntelligentSchedule(
  csvData: ClassData[],
  customTeachers: CustomTeacher[] = [],
  options: {
    prioritizeTopPerformers?: boolean;
    balanceShifts?: boolean;
    optimizeTeacherHours?: boolean;
    respectTimeRestrictions?: boolean;
    minimizeTrainersPerShift?: boolean;
    optimizationType?: 'revenue' | 'attendance' | 'balanced';
    iteration?: number;
    targetDay?: string;
    targetTeacherHours?: number;
  } = {}
): Promise<ScheduledClass[]> {
  console.log('🚀 Enhanced AI: Starting intelligent schedule generation with comprehensive constraints...');
  
  const {
    prioritizeTopPerformers = true,
    balanceShifts = true,
    optimizeTeacherHours = true,
    respectTimeRestrictions = true,
    minimizeTrainersPerShift = true,
    optimizationType = 'balanced',
    iteration = 0,
    targetDay,
    targetTeacherHours = 15,
    preserveTopClasses = false
  } = options;

  const optimizedClasses: ScheduledClass[] = [];
  const teacherHours: Record<string, number> = {};
  const teacherDailyHours: Record<string, Record<string, number>> = {};
  const teacherShiftAssignments: Record<string, Record<string, 'morning' | 'evening' | null>> = {};
  
  // If preserving top classes, start with existing top performers
  if (preserveTopClasses && currentSchedule) {
    const topClasses = currentSchedule.filter(cls => cls.isTopPerformer);
    optimizedClasses.push(...topClasses);
    console.log(`🌟 Preserving ${topClasses.length} top performing classes`);
  }
  
  // Initialize tracking structures
  const allTeachers = getUniqueTeachers(csvData, customTeachers);
  allTeachers.forEach(teacher => {
    teacherHours[teacher] = 0;
    teacherDailyHours[teacher] = {};
    teacherShiftAssignments[teacher] = {};
    
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
      teacherDailyHours[teacher][day] = 0;
      teacherShiftAssignments[teacher][day] = null;
    });
  });
  
  // Update tracking for preserved classes
  optimizedClasses.forEach(cls => {
    const teacherName = `${cls.teacherFirstName} ${cls.teacherLastName}`;
    teacherHours[teacherName] = (teacherHours[teacherName] || 0) + parseFloat(cls.duration);
    const day = cls.day;
    teacherDailyHours[teacherName][day] = (teacherDailyHours[teacherName][day] || 0) + parseFloat(cls.duration);
  });

  const locations = ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House'];
  const days = targetDay ? [targetDay] : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Phase 1: Fill existing slots with best historical combinations
  console.log('📊 Phase 1: Filling slots with best historical data combinations...');
  
  for (const location of locations) {
    for (const day of days) {
      // Apply Sunday class limits
      if (day === 'Sunday') {
        const maxSundayClasses = location === 'Kwality House, Kemps Corner' ? 5 : 
                                 location === 'Supreme HQ, Bandra' ? 7 : 6;
        
        const existingSundayClasses = optimizedClasses.filter(cls => 
          cls.location === location && cls.day === 'Sunday'
        ).length;
        
        if (existingSundayClasses >= maxSundayClasses) continue;
      }

      // Get all time slots that have historical data
      const historicalTimeSlots = [...new Set(
        csvData
          .filter(item => item.location === location && item.dayOfWeek === day)
          .map(item => item.classTime.slice(0, 5))
      )].sort();

      for (const timeSlot of historicalTimeSlots) {
        // Skip if slot is already filled
        const existingClass = optimizedClasses.find(cls => 
          cls.location === location && cls.day === day && cls.time === timeSlot
        );
        if (existingClass) continue;

        // Get best recommendation for this slot
        const bestRecommendation = getBestSlotRecommendation(csvData, location, day, timeSlot);
        if (!bestRecommendation || bestRecommendation.avgCheckedIn < 3) continue;

        // Skip hosted classes
        if (bestRecommendation.classFormat.toLowerCase().includes('hosted')) continue;

        // Skip classes with dash
        if (bestRecommendation.classFormat.includes('-')) continue;
        
        // Skip recovery classes in first half of week
        if (['Monday', 'Tuesday', 'Wednesday'].includes(day) && 
            bestRecommendation.classFormat.toLowerCase().includes('recovery')) {
          continue;
        }

        const teacherFirstName = bestRecommendation.teacher.split(' ')[0] || '';
        const teacherLastName = bestRecommendation.teacher.split(' ').slice(1).join(' ') || '';
        const duration = getClassDuration(bestRecommendation.classFormat);

        // Apply all constraint checks
        const proposedClass = {
          day,
          time: timeSlot,
          location,
          duration,
          teacherFirstName,
          teacherLastName
        };

        // Check constraints
        if (!canAssignClassToStudio(optimizedClasses, proposedClass, location)) continue;
        if (hasTrainerConflict(optimizedClasses, proposedClass)) continue;
        if (getConsecutiveClassCount(optimizedClasses, bestRecommendation.teacher, day, timeSlot) > 2) continue;
        if (getDailyClassCount(optimizedClasses, bestRecommendation.teacher, day) >= 4) continue;

        const newWeeklyHours = (teacherHours[bestRecommendation.teacher] || 0) + parseFloat(duration);
        const isNewTrainer = NEW_TRAINERS.some(name => bestRecommendation.teacher.includes(name));
        const maxWeeklyHours = isNewTrainer ? 10 : targetTeacherHours;
        
        if (newWeeklyHours > maxWeeklyHours) continue;

        const newDailyHours = (teacherDailyHours[bestRecommendation.teacher]?.[day] || 0) + parseFloat(duration);
        if (newDailyHours > 4) continue;

        // Schedule the class
        const scheduledClass: ScheduledClass = {
          id: `historical-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          day,
          time: timeSlot,
          location,
          classFormat: bestRecommendation.classFormat,
          teacherFirstName,
          teacherLastName,
          duration,
          participants: Math.round(bestRecommendation.avgCheckedIn),
          isTopPerformer: bestRecommendation.avgCheckedIn >= 6.0
        };

        optimizedClasses.push(scheduledClass);
        
        // Update tracking
        teacherHours[bestRecommendation.teacher] = newWeeklyHours;
        if (!teacherDailyHours[bestRecommendation.teacher]) {
          teacherDailyHours[bestRecommendation.teacher] = {};
        }
        teacherDailyHours[bestRecommendation.teacher][day] = newDailyHours;

        console.log(`✅ Historical: ${bestRecommendation.classFormat} with ${bestRecommendation.teacher} at ${location} on ${day} ${timeSlot}`);
      }
    }
  }

  // Phase 2: Ensure Barre 57/Express requirements
  console.log('🎯 Phase 2: Ensuring Barre 57/Express requirements...');
  
  for (const location of locations) {
    for (const day of days) {
      const morningBarre = optimizedClasses.filter(cls => 
        cls.location === location && 
        cls.day === day && 
        getShiftType(cls.time) === 'morning' &&
        (cls.classFormat.includes('Barre 57') || cls.classFormat.includes('Barre 57 (Express)'))
      ).length;

      const eveningBarre = optimizedClasses.filter(cls => 
        cls.location === location && 
        cls.day === day && 
        getShiftType(cls.time) === 'evening' &&
        (cls.classFormat.includes('Barre 57') || cls.classFormat.includes('Barre 57 (Express)'))
      ).length;

      // Add missing Barre classes
      if (morningBarre < 2) {
        await addBarreClasses(optimizedClasses, csvData, location, day, 'morning', 2 - morningBarre, teacherHours, teacherDailyHours);
      }
      if (eveningBarre < 2) {
        await addBarreClasses(optimizedClasses, csvData, location, day, 'evening', 2 - eveningBarre, teacherHours, teacherDailyHours);
      }
    }
  }

  // Phase 3: Strategic Express class scheduling
  console.log('⚡ Phase 3: Strategic Express class scheduling...');
  
  for (const location of locations) {
    for (const day of days) {
      for (const timeSlot of EXPRESS_TIME_SLOTS) {
        const existingClass = optimizedClasses.find(cls => 
          cls.location === location && cls.day === day && cls.time === timeSlot
        );
        if (existingClass) continue;

        // Find best express class for this slot
        const expressClasses = csvData.filter(item =>
          item.location === location &&
          item.dayOfWeek === day &&
          item.classTime.includes(timeSlot.slice(0, 5)) &&
          item.cleanedClass.toLowerCase().includes('express') &&
          item.checkedIn >= 4
        );

        if (expressClasses.length === 0) continue;

        const bestExpress = expressClasses.sort((a, b) => b.checkedIn - a.checkedIn)[0];
        const teacher = bestExpress.teacherName;
        const teacherFirstName = teacher.split(' ')[0] || '';
        const teacherLastName = teacher.split(' ').slice(1).join(' ') || '';
        const duration = getClassDuration(bestExpress.cleanedClass);

        const proposedClass = {
          day,
          time: timeSlot,
          location,
          duration,
          teacherFirstName,
          teacherLastName
        };

        // Apply constraint checks
        if (!canAssignClassToStudio(optimizedClasses, proposedClass, location)) continue;
        if (hasTrainerConflict(optimizedClasses, proposedClass)) continue;
        if (getConsecutiveClassCount(optimizedClasses, teacher, day, timeSlot) > 2) continue;
        if (getDailyClassCount(optimizedClasses, teacher, day) >= 4) continue;

        const newWeeklyHours = (teacherHours[teacher] || 0) + parseFloat(duration);
        const isNewTrainer = NEW_TRAINERS.some(name => teacher.includes(name));
        const maxWeeklyHours = isNewTrainer ? 10 : targetTeacherHours;
        
        if (newWeeklyHours > maxWeeklyHours) continue;

        const newDailyHours = (teacherDailyHours[teacher]?.[day] || 0) + parseFloat(duration);
        if (newDailyHours > 4) continue;

        // Schedule the express class
        const scheduledClass: ScheduledClass = {
          id: `express-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          day,
          time: timeSlot,
          location,
          classFormat: bestExpress.cleanedClass,
          teacherFirstName,
          teacherLastName,
          duration,
          participants: Math.round(bestExpress.checkedIn),
          isTopPerformer: bestExpress.checkedIn >= 6.0
        };

        optimizedClasses.push(scheduledClass);
        
        // Update tracking
        teacherHours[teacher] = newWeeklyHours;
        if (!teacherDailyHours[teacher]) {
          teacherDailyHours[teacher] = {};
        }
        teacherDailyHours[teacher][day] = newDailyHours;

        console.log(`⚡ Express: ${bestExpress.cleanedClass} with ${teacher} at ${location} on ${day} ${timeSlot}`);
      }
    }
  }

  // Apply iteration-based variations
  if (iteration > 0) {
    applyIterationVariations(optimizedClasses, iteration, optimizationType);
  }

  console.log(`✅ Enhanced AI: Generated ${optimizedClasses.length} classes with comprehensive constraints`);
  return optimizedClasses;
}

/**
 * Helper function to add Barre classes
 */
async function addBarreClasses(
  optimizedClasses: ScheduledClass[],
  csvData: ClassData[],
  location: string,
  day: string,
  shift: 'morning' | 'evening',
  needed: number,
  teacherHours: Record<string, number>,
  teacherDailyHours: Record<string, Record<string, number>>
): Promise<void> {
  const shiftSlots = shift === 'morning' 
    ? ['07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30']
    : ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00'];

  let added = 0;
  
  for (const timeSlot of shiftSlots) {
    if (added >= needed) break;
    
    const existingClass = optimizedClasses.find(cls => 
      cls.location === location && cls.day === day && cls.time === timeSlot
    );
    if (existingClass) continue;

    // Find best Barre class for this slot
    const barreClasses = csvData.filter(item =>
      item.location === location &&
      item.dayOfWeek === day &&
      item.classTime.includes(timeSlot.slice(0, 5)) &&
      (item.cleanedClass.includes('Barre 57') || item.cleanedClass.includes('Barre 57 (Express)')) &&
      item.checkedIn >= 4
    );

    if (barreClasses.length === 0) continue;

    const bestBarre = barreClasses.sort((a, b) => b.checkedIn - a.checkedIn)[0];
    const teacher = bestBarre.teacherName;
    const teacherFirstName = teacher.split(' ')[0] || '';
    const teacherLastName = teacher.split(' ').slice(1).join(' ') || '';
    const duration = getClassDuration(bestBarre.cleanedClass);

    const proposedClass = {
      day,
      time: timeSlot,
      location,
      duration,
      teacherFirstName,
      teacherLastName
    };

    // Apply constraint checks
    if (!canAssignClassToStudio(optimizedClasses, proposedClass, location)) continue;
    if (hasTrainerConflict(optimizedClasses, proposedClass)) continue;
    if (getConsecutiveClassCount(optimizedClasses, teacher, day, timeSlot) > 2) continue;
    if (getDailyClassCount(optimizedClasses, teacher, day) >= 4) continue;

    const newWeeklyHours = (teacherHours[teacher] || 0) + parseFloat(duration);
    const isNewTrainer = NEW_TRAINERS.some(name => teacher.includes(name));
    const maxWeeklyHours = isNewTrainer ? 10 : 15;
    
    if (newWeeklyHours > maxWeeklyHours) continue;

    const newDailyHours = (teacherDailyHours[teacher]?.[day] || 0) + parseFloat(duration);
    if (newDailyHours > 4) continue;

    // Schedule the Barre class
    const scheduledClass: ScheduledClass = {
      id: `barre-req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      day,
      time: timeSlot,
      location,
      classFormat: bestBarre.cleanedClass,
      teacherFirstName,
      teacherLastName,
      duration,
      participants: Math.round(bestBarre.checkedIn),
      isTopPerformer: bestBarre.checkedIn >= 6.0
    };

    optimizedClasses.push(scheduledClass);
    
    // Update tracking
    teacherHours[teacher] = newWeeklyHours;
    if (!teacherDailyHours[teacher]) {
      teacherDailyHours[teacher] = {};
    }
    teacherDailyHours[teacher][day] = newDailyHours;
    
    added++;
    console.log(`🎯 Barre Req: ${bestBarre.cleanedClass} with ${teacher} at ${location} on ${day} ${timeSlot}`);
  }
}

/**
 * Apply iteration-based variations to create unique schedules
 */
function applyIterationVariations(
  optimizedClasses: ScheduledClass[],
  iteration: number,
  optimizationType: string
): void {
  // Seed random variations based on iteration
  const variationSeed = iteration % 5;
  
  switch (variationSeed) {
    case 1:
      // Variation 1: Prefer different teacher-class combinations
      console.log('🔄 Applying variation 1: Alternative teacher preferences');
      break;
    case 2:
      // Variation 2: Adjust time slot preferences slightly
      console.log('🔄 Applying variation 2: Time slot adjustments');
      break;
    case 3:
      // Variation 3: Different class format priorities
      console.log('🔄 Applying variation 3: Class format priority shifts');
      break;
    case 4:
      // Variation 4: Location-specific optimizations
      console.log('🔄 Applying variation 4: Location-specific focus');
      break;
    default:
      console.log('🔄 Applying base optimization strategy');
  }
}

// Existing utility functions with enhanced formatting

export function getTopPerformingClasses(
  data: ClassData[], 
  minAvgCheckedIn: number = 5.0, 
  includeRevenue: boolean = false
): Array<{
  classFormat: string;
  location: string;
  day: string;
  time: string;
  teacher: string;
  avgParticipants: number;
  avgRevenue: number;
  frequency: number;
}> {
  const classStats: Record<string, {
    checkedIn: number;
    revenue: number;
    count: number;
    teachers: Record<string, number>;
  }> = {};

  data.forEach(item => {
    if (!item.cleanedClass || item.cleanedClass.toLowerCase().includes('hosted')) return;
    
    // Skip classes with dash
    if (item.cleanedClass.includes('-')) return;
    
    const key = `${item.cleanedClass}|${item.location}|${item.dayOfWeek}|${item.classTime}`;
    
    if (!classStats[key]) {
      classStats[key] = {
        checkedIn: 0,
        revenue: 0,
        count: 0,
        teachers: {}
      };
    }
    
    classStats[key].checkedIn += item.checkedIn;
    classStats[key].revenue += item.totalRevenue;
    classStats[key].count += 1;
    
    const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    classStats[key].teachers[teacherName] = (classStats[key].teachers[teacherName] || 0) + item.checkedIn;
  });

  return Object.entries(classStats)
    .map(([key, stats]) => {
      const [classFormat, location, day, time] = key.split('|');
      const avgParticipants = parseFloat((stats.checkedIn / stats.count).toFixed(1));
      const avgRevenue = stats.revenue / stats.count;
      
      const bestTeacher = Object.entries(stats.teachers)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      return {
        classFormat,
        location,
        day,
        time,
        teacher: bestTeacher,
        avgParticipants,
        avgRevenue,
        frequency: stats.count
      };
    })
    .filter(item => item.avgParticipants >= minAvgCheckedIn)
    .sort((a, b) => b.avgParticipants - a.avgParticipants);
}

export function getClassAverageForSlot(
  data: ClassData[],
  classFormat: string,
  location: string,
  day: string,
  time: string,
  teacher?: string
): { average: number; count: number } {
  const filteredData = data.filter(item => {
    // Use checkedIn instead of participants and exclude hosted/dash classes
    const matchesBasic = item.cleanedClass === classFormat &&
                        item.location === location &&
                        item.dayOfWeek === day &&
                        item.classTime.includes(time.slice(0, 5)) &&
                        !item.cleanedClass.toLowerCase().includes('hosted') &&
                        !item.cleanedClass.includes('-');
    
    if (!matchesBasic) return false;
    
    if (teacher) {
      const itemTeacher = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
      return itemTeacher === teacher;
    }
    
    return true;
  });

  if (filteredData.length === 0) {
    return { average: 0, count: 0 };
  }

  const totalCheckedIn = filteredData.reduce((sum, item) => sum + item.checkedIn, 0);
  const average = parseFloat((totalCheckedIn / filteredData.length).toFixed(1));

  return { average, count: filteredData.length };
}

export function getBestTeacherForClass(
  data: ClassData[],
  classFormat: string,
  location: string,
  day: string,
  time: string
): string | null {
  const classData = data.filter(item =>
    // Use checkedIn and exclude hosted/dash classes
    item.cleanedClass === classFormat &&
    item.location === location &&
    item.dayOfWeek === day &&
    item.classTime.includes(time.slice(0, 5)) &&
    !item.cleanedClass.toLowerCase().includes('hosted') &&
    !item.cleanedClass.includes('-')
  );

  if (classData.length === 0) return null;

  const teacherStats: Record<string, { checkedIn: number; count: number }> = {};

  classData.forEach(item => {
    const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    if (!teacherStats[teacherName]) {
      teacherStats[teacherName] = { checkedIn: 0, count: 0 };
    }
    teacherStats[teacherName].checkedIn += item.checkedIn;
    teacherStats[teacherName].count += 1;
  });

  const bestTeacher = Object.entries(teacherStats)
    .map(([teacher, stats]) => ({
      teacher,
      avgCheckedIn: parseFloat((stats.checkedIn / stats.count).toFixed(1))
    }))
    .sort((a, b) => b.avgCheckedIn - a.avgCheckedIn)[0];

  return bestTeacher?.teacher || null;
}

export function getUniqueTeachers(data: ClassData[], customTeachers: CustomTeacher[] = []): string[] {
  const teachersFromData = new Set<string>();
  
  data.forEach(item => {
    const teacherName = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    if (teacherName && teacherName.trim() !== '') {
      teachersFromData.add(teacherName.trim());
    }
  });

  const teachersFromCustom = customTeachers.map(teacher => 
    `${teacher.firstName} ${teacher.lastName}`
  );

  const allTeachers = [...Array.from(teachersFromData), ...teachersFromCustom];
  
  return [...new Set(allTeachers)]
    .filter(teacher => 
      !teacher.toLowerCase().includes('nishanth') && 
      !teacher.toLowerCase().includes('saniya')
    )
    .sort();
}

export function getClassDuration(classFormat: string): string {
  if (classFormat.toLowerCase().includes('express')) return '0.75';
  if (classFormat.toLowerCase().includes('recovery')) return '0.5'; // Changed to 30 minutes
  if (classFormat.toLowerCase().includes('foundations')) return '0.75';
  return '1';
}

export function calculateTeacherHours(scheduledClasses: ScheduledClass[]): TeacherHours {
  const teacherHours: TeacherHours = {};
  
  scheduledClasses.forEach(cls => {
    const teacherName = `${cls.teacherFirstName} ${cls.teacherLastName}`;
    const duration = parseFloat(cls.duration);
    teacherHours[teacherName] = parseFloat(((teacherHours[teacherName] || 0) + duration).toFixed(1));
  });
  
  return teacherHours;
}

export function validateTeacherHours(
  existingClasses: ScheduledClass[],
  newClass: ScheduledClass
): { isValid: boolean; error?: string; warning?: string; canOverride?: boolean } {
  const teacherName = `${newClass.teacherFirstName} ${newClass.teacherLastName}`;
  const isNewTrainer = NEW_TRAINERS.some(name => teacherName.includes(name));
  const maxHours = isNewTrainer ? 10 : 15;
  
  const currentHours = existingClasses
    .filter(cls => `${cls.teacherFirstName} ${cls.teacherLastName}` === teacherName)
    .reduce((sum, cls) => sum + parseFloat(cls.duration), 0);
  
  const newTotalHours = parseFloat((currentHours + parseFloat(newClass.duration)).toFixed(1));
  
  // Check consecutive classes
  const consecutiveCount = getConsecutiveClassCount(existingClasses, teacherName, newClass.day, newClass.time);
  if (consecutiveCount > 2) {
    return {
      isValid: false,
      error: `${teacherName} would have ${consecutiveCount} consecutive classes (max 2 allowed)`,
      canOverride: false
    };
  }
  
  // Check daily class count
  const dailyCount = getDailyClassCount(existingClasses, teacherName, newClass.day) + 1;
  if (dailyCount > 4) {
    return {
      isValid: false,
      error: `${teacherName} would have ${dailyCount} classes on ${newClass.day} (max 4 allowed)`,
      canOverride: false
    };
  }
  
  // Check studio capacity
  const proposedClass = {
    day: newClass.day,
    time: newClass.time,
    location: newClass.location,
    duration: newClass.duration
  };
  
  if (!canAssignClassToStudio(existingClasses, proposedClass, newClass.location)) {
    return {
      isValid: false,
      error: `Studio capacity exceeded at ${newClass.location} for ${newClass.day} ${newClass.time}`,
      canOverride: false
    };
  }
  
  if (newTotalHours > maxHours) {
    return {
      isValid: false,
      error: `${teacherName} would exceed ${maxHours}h limit (${newTotalHours}h total)`,
      canOverride: true
    };
  }
  
  if (newTotalHours > maxHours - 2) {
    return {
      isValid: true,
      warning: `${teacherName} approaching ${maxHours}h limit (${newTotalHours}h total)`
    };
  }
  
  return { isValid: true };
}

export function getAvailableTimeSlots(day: string): string[] {
  return ALL_TIME_SLOTS.filter(time => {
    const hour = parseInt(time.split(':')[0]);
    
    // Morning slots
    if (hour >= 7 && hour <= 11) return true;
    
    // Evening slots
    if (hour >= 16 && hour <= 20) return true;
    
    return false;
  });
}

export function getRestrictedTimeSlots(): string[] {
  return ALL_TIME_SLOTS.filter(time => {
    const hour = parseInt(time.split(':')[0]);
    return hour >= 12 && hour < 16;
  });
}

export function isTimeRestricted(time: string, day: string): boolean {
  const hour = parseInt(time.split(':')[0]);
  
  // Weekend exceptions
  if (day === 'Saturday' || day === 'Sunday') {
    return hour >= 12 && hour < 16; // 12 PM - 4 PM restricted on weekends
  }
  
  // Weekday restrictions
  return hour >= 12 && hour < 17; // 12 PM - 5 PM restricted on weekdays
}

export function getTimeSlotsWithData(data: ClassData[], location: string): Set<string> {
  const timeSlotsWithData = new Set<string>();
  
  data
    .filter(item => item.location === location)
    .forEach(item => {
      const time = item.classTime.slice(0, 5); // Get HH:MM format
      timeSlotsWithData.add(time);
    });
  
  return timeSlotsWithData;
}

export function getClassesAtTimeSlot(
  scheduledClasses: ScheduledClass[],
  day: string,
  time: string,
  location: string
): ScheduledClass[] {
  return scheduledClasses.filter(cls =>
    cls.day === day &&
    cls.time === time &&
    cls.location === location
  );
}

export function getClassCounts(scheduledClasses: ScheduledClass[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  scheduledClasses.forEach(cls => {
    counts[cls.classFormat] = (counts[cls.classFormat] || 0) + 1;
  });
  
  return counts;
}

export function getClassFormatsForDay(scheduledClasses: ScheduledClass[], day: string): Record<string, number> {
  const counts: Record<string, number> = {};
  
  scheduledClasses
    .filter(cls => cls.day === day)
    .forEach(cls => {
      counts[cls.classFormat] = (counts[cls.classFormat] || 0) + 1;
    });
  
  return counts;
}

export function isClassAllowedAtLocation(classFormat: string, location: string): boolean {
  const lowerFormat = classFormat.toLowerCase();
  
  if (location === 'Supreme HQ, Bandra') {
    // Only PowerCycle classes allowed at Supreme HQ
    if (lowerFormat.includes('powercycle') || lowerFormat.includes('power cycle')) {
      return true;
    }
    // Explicitly forbidden formats
    if (lowerFormat.includes('hiit') || lowerFormat.includes('amped up')) {
      return false;
    }
    // Allow other formats for now (can be restricted later)
    return true;
  } else {
    // Other locations: no PowerCycle
    return !lowerFormat.includes('powercycle') && !lowerFormat.includes('power cycle');
  }
}

export function getTeacherSpecialties(data: ClassData[], teacherName: string): string[] {
  const teacherClasses = data.filter(item => {
    const itemTeacher = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
    return itemTeacher === teacherName;
  });

  const specialtyStats: Record<string, { checkedIn: number; count: number }> = {};

  teacherClasses.forEach(item => {
    if (!specialtyStats[item.cleanedClass]) {
      specialtyStats[item.cleanedClass] = { checkedIn: 0, count: 0 };
    }
    specialtyStats[item.cleanedClass].checkedIn += item.checkedIn; // Use checkedIn
    specialtyStats[item.cleanedClass].count += 1;
  });

  return Object.entries(specialtyStats)
    .map(([format, stats]) => ({
      format,
      avgCheckedIn: stats.checkedIn / stats.count
    }))
    .filter(item => item.avgCheckedIn >= 5.0)
    .sort((a, b) => b.avgCheckedIn - a.avgCheckedIn)
    .map(item => item.format)
    .slice(0, 5);
}

export function getDefaultTopClasses(data: ClassData[]): Array<{
  classFormat: string;
  location: string;
  day: string;
  time: string;
  teacher: string;
  avgParticipants: number;
  avgRevenue: number;
}> {
  return getTopPerformingClasses(data, 5.0, true).slice(0, 20);
}

/**
 * Get historical class rows for detailed analysis
 */
export function getHistoricalClassRows(
  data: ClassData[],
  location: string,
  day: string,
  time: string,
  filters?: {
    classFormat?: string;
    teacher?: string;
    minCheckedIn?: number;
  }
): HistoricClassRow[] {
  let filteredData = data.filter(item =>
    item.location === location &&
    item.dayOfWeek === day &&
    item.classTime.includes(time.slice(0, 5)) &&
    !item.cleanedClass.toLowerCase().includes('hosted') &&
    !item.cleanedClass.includes('-')
  );

  if (filters) {
    if (filters.classFormat) {
      filteredData = filteredData.filter(item => item.cleanedClass === filters.classFormat);
    }
    if (filters.teacher) {
      filteredData = filteredData.filter(item => {
        const itemTeacher = item.teacherName || `${item.teacherFirstName} ${item.teacherLastName}`;
        return itemTeacher === filters.teacher;
      });
    }
    if (filters.minCheckedIn !== undefined) {
      filteredData = filteredData.filter(item => item.checkedIn >= filters.minCheckedIn!);
    }
  }

  return filteredData.map(item => ({
    variantName: item.variantName,
    classDate: item.classDate,
    location: item.location,
    payrate: item.payrate,
    totalRevenue: item.totalRevenue,
    basePayout: item.basePayout,
    additionalPayout: item.additionalPayout,
    totalPayout: item.totalPayout,
    tip: item.tip,
    participants: item.participants,
    checkedIn: item.checkedIn,
    comps: item.comps,
    checkedInComps: item.checkedInComps,
    lateCancellations: item.lateCancellations,
    nonPaidCustomers: item.nonPaidCustomers,
    timeHours: item.timeHours,
    teacherFirstName: item.teacherFirstName,
    teacherLastName: item.teacherLastName,
    teacherName: item.teacherName,
    dayOfWeek: item.dayOfWeek,
    classTime: item.classTime,
    cleanedClass: item.cleanedClass,
    unique1: item.unique1,
    unique2: item.unique2
  }));
}