import React, { useState } from 'react';
import { PieChart, BarChart3, TrendingUp, Users, Clock, Star, MapPin, Calendar, Target, Award, Zap, Activity, Filter } from 'lucide-react';
import { ScheduledClass, ClassData } from '../types';

interface ClassMixAnalyzerProps {
  scheduledClasses: ScheduledClass[];
  csvData: ClassData[];
  theme: any;
}

const ClassMixAnalyzer: React.FC<ClassMixAnalyzerProps> = ({ scheduledClasses, csvData, theme }) => {
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'comparison'>('overview');

  const locations = ['Kwality House, Kemps Corner', 'Supreme HQ, Bandra', 'Kenkere House'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const getClassMixData = () => {
    let filteredClasses = scheduledClasses;
    
    if (selectedLocation !== 'all') {
      filteredClasses = filteredClasses.filter(cls => cls.location === selectedLocation);
    }
    
    if (selectedDay !== 'all') {
      filteredClasses = filteredClasses.filter(cls => cls.day === selectedDay);
    }

    // Format distribution
    const formatDistribution = filteredClasses.reduce((acc, cls) => {
      const format = cls.classFormat;
      if (!acc[format]) {
        acc[format] = {
          count: 0,
          participants: 0,
          hours: 0,
          topPerformers: 0,
          locations: new Set(),
          days: new Set(),
          teachers: new Set()
        };
      }
      acc[format].count += 1;
      acc[format].participants += cls.participants || 0;
      acc[format].hours += parseFloat(cls.duration);
      if (cls.isTopPerformer) acc[format].topPerformers += 1;
      acc[format].locations.add(cls.location);
      acc[format].days.add(cls.day);
      acc[format].teachers.add(`${cls.teacherFirstName} ${cls.teacherLastName}`);
      return acc;
    }, {} as any);

    // Convert sets to arrays for easier handling
    Object.keys(formatDistribution).forEach(format => {
      formatDistribution[format].locations = Array.from(formatDistribution[format].locations);
      formatDistribution[format].days = Array.from(formatDistribution[format].days);
      formatDistribution[format].teachers = Array.from(formatDistribution[format].teachers);
    });

    // Time distribution
    const timeDistribution = filteredClasses.reduce((acc, cls) => {
      const hour = parseInt(cls.time.split(':')[0]);
      const timeSlot = hour < 9 ? 'Early Morning' :
                     hour < 12 ? 'Morning' :
                     hour < 17 ? 'Afternoon' :
                     hour < 20 ? 'Evening' : 'Night';
      
      if (!acc[timeSlot]) {
        acc[timeSlot] = { count: 0, formats: new Set() };
      }
      acc[timeSlot].count += 1;
      acc[timeSlot].formats.add(cls.classFormat);
      return acc;
    }, {} as any);

    // Convert format sets to arrays
    Object.keys(timeDistribution).forEach(slot => {
      timeDistribution[slot].formats = Array.from(timeDistribution[slot].formats);
    });

    // Day-wise distribution
    const dayDistribution = days.reduce((acc, day) => {
      const dayClasses = filteredClasses.filter(cls => cls.day === day);
      acc[day] = {
        total: dayClasses.length,
        formats: dayClasses.reduce((formatAcc, cls) => {
          formatAcc[cls.classFormat] = (formatAcc[cls.classFormat] || 0) + 1;
          return formatAcc;
        }, {} as any),
        participants: dayClasses.reduce((sum, cls) => sum + (cls.participants || 0), 0),
        topPerformers: dayClasses.filter(cls => cls.isTopPerformer).length
      };
      return acc;
    }, {} as any);

    // Location distribution
    const locationDistribution = locations.reduce((acc, location) => {
      const locationClasses = filteredClasses.filter(cls => cls.location === location);
      acc[location] = {
        total: locationClasses.length,
        formats: locationClasses.reduce((formatAcc, cls) => {
          formatAcc[cls.classFormat] = (formatAcc[cls.classFormat] || 0) + 1;
          return formatAcc;
        }, {} as any),
        participants: locationClasses.reduce((sum, cls) => sum + (cls.participants || 0), 0),
        topPerformers: locationClasses.filter(cls => cls.isTopPerformer).length
      };
      return acc;
    }, {} as any);

    return {
      formatDistribution,
      timeDistribution,
      dayDistribution,
      locationDistribution,
      totalClasses: filteredClasses.length,
      totalFormats: Object.keys(formatDistribution).length
    };
  };

  const data = getClassMixData();

  const getFormatColor = (index: number) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-purple-500 to-pink-500',
      'from-yellow-500 to-orange-500',
      'from-red-500 to-rose-500',
      'from-indigo-500 to-blue-500',
      'from-teal-500 to-green-500',
      'from-orange-500 to-red-500',
      'from-pink-500 to-purple-500',
      'from-cyan-500 to-blue-500'
    ];
    return colors[index % colors.length];
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Format Distribution Chart */}
      <div className={`${theme.card} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
        <h3 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center`}>
          <PieChart className="h-5 w-5 mr-2 text-blue-400" />
          Class Format Distribution
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {Object.entries(data.formatDistribution)
              .sort((a: any, b: any) => b[1].count - a[1].count)
              .slice(0, 8)
              .map(([format, stats]: [string, any], index) => {
                const percentage = (stats.count / data.totalClasses) * 100;
                return (
                  <div key={format} className={`p-4 ${theme.card} rounded-xl border ${theme.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`font-medium ${theme.text} text-sm`}>{format}</div>
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-400 font-bold">{stats.count}</span>
                        <span className={`text-xs ${theme.textSecondary}`}>({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className={`w-full ${theme.card} rounded-full h-2 mb-2`}>
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${getFormatColor(index)} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className={theme.textSecondary}>Participants: </span>
                        <span className="text-green-400">{stats.participants}</span>
                      </div>
                      <div>
                        <span className={theme.textSecondary}>Hours: </span>
                        <span className="text-purple-400">{stats.hours.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className={theme.textSecondary}>Top: </span>
                        <span className="text-yellow-400">{stats.topPerformers}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
          
          <div className="space-y-4">
            <h4 className={`font-medium ${theme.text}`}>Mix Analysis</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <div className={`text-2xl font-bold ${theme.text}`}>{data.totalFormats}</div>
                <div className="text-sm text-blue-300">Unique Formats</div>
              </div>
              <div className="text-center p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                <div className={`text-2xl font-bold ${theme.text}`}>{data.totalClasses}</div>
                <div className="text-sm text-green-300">Total Classes</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <div className="text-sm text-purple-300 mb-1">Most Popular Format</div>
                <div className={`font-medium ${theme.text}`}>
                  {Object.entries(data.formatDistribution)
                    .sort((a: any, b: any) => b[1].count - a[1].count)[0]?.[0] || 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <div className="text-sm text-yellow-300 mb-1">Best Performing Format</div>
                <div className={`font-medium ${theme.text}`}>
                  {Object.entries(data.formatDistribution)
                    .sort((a: any, b: any) => b[1].topPerformers - a[1].topPerformers)[0]?.[0] || 'N/A'}
                </div>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <div className="text-sm text-green-300 mb-1">Highest Participation</div>
                <div className={`font-medium ${theme.text}`}>
                  {Object.entries(data.formatDistribution)
                    .sort((a: any, b: any) => b[1].participants - a[1].participants)[0]?.[0] || 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Distribution */}
      <div className={`${theme.card} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
        <h3 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center`}>
          <Clock className="h-5 w-5 mr-2 text-orange-400" />
          Time Slot Distribution
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(data.timeDistribution)
            .sort((a: any, b: any) => b[1].count - a[1].count)
            .map(([timeSlot, stats]: [string, any], index) => (
              <div key={timeSlot} className={`p-4 ${theme.card} rounded-xl border ${theme.border}`}>
                <div className="text-center mb-3">
                  <div className={`text-2xl font-bold ${theme.text}`}>{stats.count}</div>
                  <div className="text-sm text-orange-300">{timeSlot}</div>
                </div>
                <div className="space-y-1">
                  <div className={`text-xs ${theme.textSecondary}`}>
                    {stats.formats.length} unique formats
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {stats.formats.slice(0, 3).map((format: string, i: number) => (
                      <span key={i} className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">
                        {format.split(' ').pop()}
                      </span>
                    ))}
                    {stats.formats.length > 3 && (
                      <span className="text-xs text-gray-400">+{stats.formats.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );

  const renderDetailed = () => (
    <div className="space-y-6">
      {/* Day-wise Analysis */}
      <div className={`${theme.card} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
        <h3 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center`}>
          <Calendar className="h-5 w-5 mr-2 text-green-400" />
          Day-wise Class Mix Analysis
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {days.map(day => {
            const dayData = data.dayDistribution[day];
            const topFormat = Object.entries(dayData.formats)
              .sort((a: any, b: any) => b[1] - a[1])[0];
            
            return (
              <div key={day} className={`p-4 ${theme.card} rounded-xl border ${theme.border}`}>
                <div className="text-center mb-3">
                  <div className={`font-semibold ${theme.text}`}>{day.slice(0, 3)}</div>
                  <div className="text-green-400 font-bold text-xl">{dayData.total}</div>
                  <div className="text-xs text-green-300">classes</div>
                </div>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className={theme.textSecondary}>Participants:</span>
                    <span className="text-blue-400">{dayData.participants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme.textSecondary}>Top Performers:</span>
                    <span className="text-yellow-400">{dayData.topPerformers}</span>
                  </div>
                  {topFormat && (
                    <div className="mt-2 p-2 bg-green-500/10 rounded">
                      <div className="text-green-300 font-medium">Top Format:</div>
                      <div className={`text-xs ${theme.text}`}>{topFormat[0].split(' ').pop()}</div>
                      <div className="text-xs text-green-400">({topFormat[1]} classes)</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Location Analysis */}
      <div className={`${theme.card} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
        <h3 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center`}>
          <MapPin className="h-5 w-5 mr-2 text-purple-400" />
          Location-wise Class Mix
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {locations.map(location => {
            const locationData = data.locationDistribution[location];
            const topFormats = Object.entries(locationData.formats)
              .sort((a: any, b: any) => b[1] - a[1])
              .slice(0, 5);
            
            return (
              <div key={location} className={`p-6 ${theme.card} rounded-xl border ${theme.border}`}>
                <div className="text-center mb-4">
                  <div className={`font-semibold ${theme.text} mb-2`}>{location.split(',')[0]}</div>
                  <div className="text-purple-400 font-bold text-2xl">{locationData.total}</div>
                  <div className="text-sm text-purple-300">total classes</div>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center p-2 bg-blue-500/10 rounded">
                      <div className="text-blue-400 font-bold">{locationData.participants}</div>
                      <div className="text-xs text-blue-300">Participants</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-500/10 rounded">
                      <div className="text-yellow-400 font-bold">{locationData.topPerformers}</div>
                      <div className="text-xs text-yellow-300">Top Performers</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className={`text-sm font-medium ${theme.text} mb-2`}>Top Formats:</div>
                    <div className="space-y-1">
                      {topFormats.map(([format, count]: [string, any], index) => (
                        <div key={format} className="flex justify-between text-xs">
                          <span className={theme.textSecondary}>{format.split(' ').pop()}</span>
                          <span className="text-purple-400">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderComparison = () => (
    <div className="space-y-6">
      {/* Format Comparison Table */}
      <div className={`${theme.card} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
        <h3 className={`text-lg font-semibold ${theme.text} mb-4 flex items-center`}>
          <BarChart3 className="h-5 w-5 mr-2 text-indigo-400" />
          Format Performance Comparison
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theme.border}`}>
                <th className={`text-left p-3 ${theme.textSecondary}`}>Format</th>
                <th className={`text-center p-3 ${theme.textSecondary}`}>Classes</th>
                <th className={`text-center p-3 ${theme.textSecondary}`}>Participants</th>
                <th className={`text-center p-3 ${theme.textSecondary}`}>Hours</th>
                <th className={`text-center p-3 ${theme.textSecondary}`}>Top Performers</th>
                <th className={`text-center p-3 ${theme.textSecondary}`}>Locations</th>
                <th className={`text-center p-3 ${theme.textSecondary}`}>Teachers</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(data.formatDistribution)
                .sort((a: any, b: any) => b[1].count - a[1].count)
                .map(([format, stats]: [string, any], index) => (
                  <tr key={format} className={`border-b ${theme.border} hover:bg-gray-700/30`}>
                    <td className={`p-3 ${theme.text} font-medium`}>{format}</td>
                    <td className="p-3 text-center text-blue-400 font-bold">{stats.count}</td>
                    <td className="p-3 text-center text-green-400 font-bold">{stats.participants}</td>
                    <td className="p-3 text-center text-purple-400 font-bold">{stats.hours.toFixed(1)}</td>
                    <td className="p-3 text-center text-yellow-400 font-bold">{stats.topPerformers}</td>
                    <td className="p-3 text-center text-cyan-400">{stats.locations.length}</td>
                    <td className="p-3 text-center text-pink-400">{stats.teachers.length}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${theme.card} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
          <h4 className={`text-lg font-semibold ${theme.text} mb-4`}>Efficiency Metrics</h4>
          <div className="space-y-4">
            {Object.entries(data.formatDistribution)
              .sort((a: any, b: any) => (b[1].participants / b[1].count) - (a[1].participants / a[1].count))
              .slice(0, 5)
              .map(([format, stats]: [string, any]) => {
                const avgParticipants = stats.participants / stats.count;
                const successRate = (stats.topPerformers / stats.count) * 100;
                
                return (
                  <div key={format} className={`p-4 ${theme.card} rounded-xl border ${theme.border}`}>
                    <div className={`font-medium ${theme.text} mb-2`}>{format}</div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className={theme.textSecondary}>Avg Participants: </span>
                        <span className="text-green-400 font-bold">{avgParticipants.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className={theme.textSecondary}>Success Rate: </span>
                        <span className="text-yellow-400 font-bold">{successRate.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className={`${theme.card} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
          <h4 className={`text-lg font-semibold ${theme.text} mb-4`}>Optimization Opportunities</h4>
          <div className="space-y-3">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <div className="text-blue-300 font-medium text-sm">Underutilized Formats</div>
              <div className={`text-xs ${theme.textSecondary} mt-1`}>
                Formats with low class counts but high success rates
              </div>
            </div>
            <div className="p-3 bg-green-500/10 rounded-lg">
              <div className="text-green-300 font-medium text-sm">Peak Time Optimization</div>
              <div className={`text-xs ${theme.textSecondary} mt-1`}>
                Schedule popular formats during high-demand time slots
              </div>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <div className="text-purple-300 font-medium text-sm">Location Balance</div>
              <div className={`text-xs ${theme.textSecondary} mt-1`}>
                Distribute successful formats across all locations
              </div>
            </div>
            <div className="p-3 bg-orange-500/10 rounded-lg">
              <div className="text-orange-300 font-medium text-sm">Teacher Specialization</div>
              <div className={`text-xs ${theme.textSecondary} mt-1`}>
                Match teachers with their highest-performing formats
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`${theme.card} rounded-2xl p-6 border ${theme.border} shadow-lg`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <PieChart className="h-8 w-8 text-purple-400 mr-3" />
            <div>
              <h2 className={`text-2xl font-bold ${theme.text}`}>Class Mix Analyzer</h2>
              <p className={theme.textSecondary}>Comprehensive analysis of class format distribution and performance</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className={`px-4 py-2 ${theme.card} border ${theme.border} rounded-lg ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              <option value="all">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>
                  {location.split(',')[0]}
                </option>
              ))}
            </select>
            
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className={`px-4 py-2 ${theme.card} border ${theme.border} rounded-lg ${theme.text} focus:outline-none focus:ring-2 focus:ring-purple-500`}
            >
              <option value="all">All Days</option>
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex space-x-1 bg-gray-800/30 backdrop-blur-xl rounded-2xl p-1 shadow-lg border border-gray-700/50">
          {[
            { id: 'overview', name: 'Overview', icon: PieChart },
            { id: 'detailed', name: 'Detailed', icon: BarChart3 },
            { id: 'comparison', name: 'Comparison', icon: TrendingUp }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 flex-1 justify-center ${
                viewMode === mode.id
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg transform scale-105'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <mode.icon className="h-5 w-5 mr-2" />
              {mode.name}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'overview' && renderOverview()}
      {viewMode === 'detailed' && renderDetailed()}
      {viewMode === 'comparison' && renderComparison()}
    </div>
  );
};

export default ClassMixAnalyzer;