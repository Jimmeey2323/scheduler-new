import React, { useState } from 'react';
import { Activity, TrendingUp, Users, Clock, Star, MapPin, Calendar, Target, Award, Zap, BarChart3, PieChart } from 'lucide-react';
import { ScheduledClass, ClassData } from '../types';

interface PerformanceInsightsProps {
  scheduledClasses: ScheduledClass[];
  csvData: ClassData[];
  theme: any;
}

const PerformanceInsights: React.FC<PerformanceInsightsProps> = ({ scheduledClasses, csvData, theme }) => {
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  const locations = ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House'];

  const getPerformanceData = () => {
    const filteredScheduled = selectedLocation === 'all' 
      ? scheduledClasses 
      : scheduledClasses.filter(cls => cls.location === selectedLocation);

    const filteredHistoric = selectedLocation === 'all'
      ? csvData
      : csvData.filter(item => item.location === selectedLocation);

    // Performance metrics
    const totalClasses = filteredScheduled.length;
    const topPerformers = filteredScheduled.filter(cls => cls.isTopPerformer).length;
    const privateClasses = filteredScheduled.filter(cls => cls.isPrivate).length;
    const expectedParticipants = filteredScheduled.reduce((sum, cls) => sum + (cls.participants || 0), 0);
    const expectedRevenue = filteredScheduled.reduce((sum, cls) => sum + (cls.revenue || 0), 0);

    // Teacher performance
    const teacherPerformance = filteredScheduled.reduce((acc, cls) => {
      const teacher = `${cls.teacherFirstName} ${cls.teacherLastName}`;
      if (!acc[teacher]) {
        acc[teacher] = {
          classes: 0,
          hours: 0,
          participants: 0,
          topPerformers: 0
        };
      }
      acc[teacher].classes += 1;
      acc[teacher].hours += parseFloat(cls.duration);
      acc[teacher].participants += cls.participants || 0;
      if (cls.isTopPerformer) acc[teacher].topPerformers += 1;
      return acc;
    }, {} as any);

    // Time slot analysis
    const timeSlotPerformance = filteredScheduled.reduce((acc, cls) => {
      const hour = parseInt(cls.time.split(':')[0]);
      const timeSlot = hour < 9 ? 'Early Morning (7-9 AM)' :
                     hour < 12 ? 'Morning (9 AM-12 PM)' :
                     hour < 17 ? 'Afternoon (12-5 PM)' :
                     hour < 20 ? 'Evening (5-8 PM)' : 'Night (8+ PM)';
      
      if (!acc[timeSlot]) {
        acc[timeSlot] = { classes: 0, participants: 0 };
      }
      acc[timeSlot].classes += 1;
      acc[timeSlot].participants += cls.participants || 0;
      return acc;
    }, {} as any);

    // Class format performance
    const formatPerformance = filteredScheduled.reduce((acc, cls) => {
      if (!acc[cls.classFormat]) {
        acc[cls.classFormat] = {
          count: 0,
          participants: 0,
          topPerformers: 0,
          avgDuration: 0
        };
      }
      acc[cls.classFormat].count += 1;
      acc[cls.classFormat].participants += cls.participants || 0;
      acc[cls.classFormat].avgDuration += parseFloat(cls.duration);
      if (cls.isTopPerformer) acc[cls.classFormat].topPerformers += 1;
      return acc;
    }, {} as any);

    // Historic comparison
    const historicAvg = filteredHistoric.length > 0 
      ? filteredHistoric.reduce((sum, item) => sum + item.checkedIn, 0) / filteredHistoric.length 
      : 0;

    return {
      totalClasses,
      topPerformers,
      privateClasses,
      expectedParticipants,
      expectedRevenue,
      teacherPerformance,
      timeSlotPerformance,
      formatPerformance,
      historicAvg,
      avgClassSize: totalClasses > 0 ? expectedParticipants / totalClasses : 0,
      topPerformerRate: totalClasses > 0 ? (topPerformers / totalClasses) * 100 : 0
    };
  };

  const data = getPerformanceData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${theme.card} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-green-400 mr-3" />
            <div>
              <h2 className={`text-2xl font-bold ${theme.text}`}>Performance Insights</h2>
              <p className={theme.textSecondary}>Comprehensive performance analysis and optimization insights</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className={`px-4 py-2 ${theme.card} border ${theme.border} rounded-lg ${theme.text} focus:outline-none focus:ring-2 focus:ring-green-500`}
            >
              <option value="all">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>
                  {location.split(',')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 p-4 rounded-xl border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${theme.text}`}>{data.totalClasses}</div>
                <div className="text-sm text-blue-300">Total Classes</div>
              </div>
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 p-4 rounded-xl border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${theme.text}`}>{data.expectedParticipants}</div>
                <div className="text-sm text-green-300">Expected Participants</div>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-4 rounded-xl border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${theme.text}`}>{data.topPerformers}</div>
                <div className="text-sm text-yellow-300">Top Performers</div>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 p-4 rounded-xl border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${theme.text}`}>{data.avgClassSize.toFixed(1)}</div>
                <div className="text-sm text-purple-300">Avg Class Size</div>
              </div>
              <Target className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 p-4 rounded-xl border border-indigo-500/30">
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-2xl font-bold ${theme.text}`}>{data.topPerformerRate.toFixed(1)}%</div>
                <div className="text-sm text-indigo-300">Top Performer Rate</div>
              </div>
              <Award className="h-8 w-8 text-indigo-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teacher Performance */}
        <div className={`${theme.card} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center`}>
            <Users className="h-5 w-5 mr-2 text-blue-400" />
            Teacher Performance Analysis
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {Object.entries(data.teacherPerformance)
              .sort((a: any, b: any) => b[1].participants - a[1].participants)
              .slice(0, 10)
              .map(([teacher, stats]: [string, any], index) => (
                <div key={teacher} className={`p-4 ${theme.card} rounded-xl border ${theme.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white mr-3 ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' : 'bg-blue-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className={`font-medium ${theme.text}`}>{teacher}</div>
                        <div className={`text-xs ${theme.textSecondary}`}>
                          {stats.classes} classes • {stats.hours.toFixed(1)}h
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">{stats.participants}</div>
                      <div className="text-xs text-gray-400">participants</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className={theme.textSecondary}>
                      Top Performers: {stats.topPerformers}/{stats.classes}
                    </span>
                    <span className="text-blue-400">
                      {((stats.participants / stats.classes) || 0).toFixed(1)} avg/class
                    </span>
                  </div>
                  
                  {/* Performance bar */}
                  <div className={`w-full ${theme.card} rounded-full h-2 mt-2`}>
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
                      style={{ width: `${Math.min((stats.participants / Math.max(...Object.values(data.teacherPerformance).map((s: any) => s.participants))) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Time Slot Performance */}
        <div className={`${theme.card} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
          <h3 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center`}>
            <Clock className="h-5 w-5 mr-2 text-orange-400" />
            Time Slot Performance
          </h3>
          <div className="space-y-4">
            {Object.entries(data.timeSlotPerformance)
              .sort((a: any, b: any) => b[1].participants - a[1].participants)
              .map(([timeSlot, stats]: [string, any]) => {
                const avgParticipants = stats.participants / stats.classes;
                const maxParticipants = Math.max(...Object.values(data.timeSlotPerformance).map((s: any) => s.participants));
                
                return (
                  <div key={timeSlot} className={`p-4 ${theme.card} rounded-xl border ${theme.border}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`font-medium ${theme.text}`}>{timeSlot}</div>
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-orange-400 font-bold">{stats.classes}</div>
                          <div className="text-xs text-gray-400">classes</div>
                        </div>
                        <div className="text-center">
                          <div className="text-green-400 font-bold">{stats.participants}</div>
                          <div className="text-xs text-gray-400">total</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className={theme.textSecondary}>
                        Avg: {avgParticipants.toFixed(1)} participants/class
                      </span>
                      <span className="text-blue-400">
                        {((stats.participants / maxParticipants) * 100).toFixed(0)}% of peak
                      </span>
                    </div>
                    
                    <div className={`w-full ${theme.card} rounded-full h-3`}>
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500"
                        style={{ width: `${(stats.participants / maxParticipants) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Class Format Analysis */}
      <div className={`${theme.card} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
        <h3 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center`}>
          <BarChart3 className="h-5 w-5 mr-2 text-purple-400" />
          Class Format Performance Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(data.formatPerformance)
            .sort((a: any, b: any) => b[1].participants - a[1].participants)
            .slice(0, 9)
            .map(([format, stats]: [string, any]) => {
              const avgParticipants = stats.participants / stats.count;
              const avgDuration = stats.avgDuration / stats.count;
              const topPerformerRate = (stats.topPerformers / stats.count) * 100;
              
              return (
                <div key={format} className={`p-4 ${theme.card} rounded-xl border ${theme.border}`}>
                  <div className="mb-3">
                    <div className={`font-medium ${theme.text} mb-1`}>{format}</div>
                    <div className={`text-xs ${theme.textSecondary}`}>
                      {stats.count} classes scheduled
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-center p-2 bg-blue-500/10 rounded-lg">
                      <div className="text-blue-400 font-bold">{avgParticipants.toFixed(1)}</div>
                      <div className="text-xs text-blue-300">Avg Participants</div>
                    </div>
                    <div className="text-center p-2 bg-green-500/10 rounded-lg">
                      <div className="text-green-400 font-bold">{stats.topPerformers}</div>
                      <div className="text-xs text-green-300">Top Performers</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className={theme.textSecondary}>Duration:</span>
                      <span className={theme.text}>{(avgDuration * 60).toFixed(0)} min avg</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={theme.textSecondary}>Success Rate:</span>
                      <span className="text-yellow-400">{topPerformerRate.toFixed(0)}%</span>
                    </div>
                  </div>
                  
                  <div className={`w-full ${theme.card} rounded-full h-2 mt-3`}>
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                      style={{ width: `${Math.min(topPerformerRate, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Performance Recommendations */}
      <div className={`${theme.card} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
        <h3 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center`}>
          <Zap className="h-5 w-5 mr-2 text-yellow-400" />
          Performance Optimization Recommendations
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className={`font-medium ${theme.text} text-green-400`}>Strengths to Leverage</h4>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-green-500/10 rounded-lg">
                <Award className="h-4 w-4 text-green-400 mr-3" />
                <div>
                  <div className={`text-sm font-medium ${theme.text}`}>High Top Performer Rate</div>
                  <div className={`text-xs ${theme.textSecondary}`}>{data.topPerformerRate.toFixed(1)}% of classes are top performers</div>
                </div>
              </div>
              <div className="flex items-center p-3 bg-blue-500/10 rounded-lg">
                <Users className="h-4 w-4 text-blue-400 mr-3" />
                <div>
                  <div className={`text-sm font-medium ${theme.text}`}>Strong Teacher Utilization</div>
                  <div className={`text-xs ${theme.textSecondary}`}>Teachers are well-distributed across time slots</div>
                </div>
              </div>
              <div className="flex items-center p-3 bg-purple-500/10 rounded-lg">
                <Target className="h-4 w-4 text-purple-400 mr-3" />
                <div>
                  <div className={`text-sm font-medium ${theme.text}`}>Balanced Class Mix</div>
                  <div className={`text-xs ${theme.textSecondary}`}>Good variety of class formats scheduled</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className={`font-medium ${theme.text} text-orange-400`}>Areas for Improvement</h4>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-orange-500/10 rounded-lg">
                <Clock className="h-4 w-4 text-orange-400 mr-3" />
                <div>
                  <div className={`text-sm font-medium ${theme.text}`}>Optimize Peak Hours</div>
                  <div className={`text-xs ${theme.textSecondary}`}>Consider adding more classes during high-demand times</div>
                </div>
              </div>
              <div className="flex items-center p-3 bg-red-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-red-400 mr-3" />
                <div>
                  <div className={`text-sm font-medium ${theme.text}`}>Increase Class Sizes</div>
                  <div className={`text-xs ${theme.textSecondary}`}>Focus on formats with higher attendance potential</div>
                </div>
              </div>
              <div className="flex items-center p-3 bg-yellow-500/10 rounded-lg">
                <Star className="h-4 w-4 text-yellow-400 mr-3" />
                <div>
                  <div className={`text-sm font-medium ${theme.text}`}>Promote Top Performers</div>
                  <div className={`text-xs ${theme.textSecondary}`}>Schedule more classes with proven high-performing combinations</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceInsights;