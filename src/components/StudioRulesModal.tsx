import React, { useState, useEffect } from 'react';
import { X, Settings, Save, Plus, Trash2, Clock, Users, MapPin, Target, Shield, Zap } from 'lucide-react';

interface StudioRule {
  id: string;
  name: string;
  description: string;
  value: string | number | boolean;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
}

interface LocationRules {
  [location: string]: {
    maxParallelClasses: number;
    allowedFormats: string[];
    restrictedFormats: string[];
    peakHours: string[];
    minClassGap: number;
    preferredTeachers: string[];
    customRules: StudioRule[];
  };
}

interface StudioRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: any;
}

const StudioRulesModal: React.FC<StudioRulesModalProps> = ({ isOpen, onClose, theme }) => {
  const [selectedLocation, setSelectedLocation] = useState('Kwality House, Kemps Corner');
  const [rules, setRules] = useState<LocationRules>({
    'Kwality House, Kemps Corner': {
      maxParallelClasses: 2,
      allowedFormats: [],
      restrictedFormats: ['Studio powerCycle', 'Studio powerCycle (Express)'],
      peakHours: ['09:00', '10:00', '11:00', '18:00', '19:00'],
      minClassGap: 15,
      preferredTeachers: ['Anisha', 'Mrigakshi', 'Pranjali'],
      customRules: []
    },
    'Supreme HQ, Bandra': {
      maxParallelClasses: 3,
      allowedFormats: ['Studio powerCycle', 'Studio powerCycle (Express)'],
      restrictedFormats: ['Studio HIIT', 'Studio Amped Up!'],
      peakHours: ['18:00', '19:00', '20:00'],
      minClassGap: 15,
      preferredTeachers: ['Vivaran', 'Atulan', 'Cauveri'],
      customRules: []
    },
    'Kenkere House': {
      maxParallelClasses: 2,
      allowedFormats: [],
      restrictedFormats: ['Studio powerCycle', 'Studio powerCycle (Express)'],
      peakHours: ['18:00', '19:00', '10:00'],
      minClassGap: 15,
      preferredTeachers: ['Rohan', 'Reshma', 'Richard'],
      customRules: []
    }
  });

  const locations = Object.keys(rules);
  const classFormats = [
    'Studio Barre 57', 'Studio Barre 57 (Express)', 'Studio Mat 57', 'Studio Mat 57 (Express)',
    'Studio powerCycle', 'Studio powerCycle (Express)', 'Studio Cardio Barre', 'Studio Cardio Barre (Express)',
    'Studio FIT', 'Studio Back Body Blaze', 'Studio Back Body Blaze (Express)', 'Studio Recovery',
    'Studio Foundations', 'Studio HIIT', 'Studio Amped Up!', 'Studio Pre/Post Natal Class',
    'Studio SWEAT in 30', 'Studio Trainer\'s Choice'
  ];

  const allTeachers = [
    'Anisha', 'Vivaran', 'Mrigakshi', 'Pranjali', 'Atulan', 'Cauveri', 'Rohan',
    'Reshma', 'Richard', 'Karan', 'Karanvir', 'Kabir', 'Simonelle'
  ];

  const timeSlots = [
    '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  useEffect(() => {
    // Load saved rules from localStorage
    const savedRules = localStorage.getItem('studioRules');
    if (savedRules) {
      setRules(JSON.parse(savedRules));
    }
  }, []);

  const saveRules = () => {
    localStorage.setItem('studioRules', JSON.stringify(rules));
    alert('Studio rules saved successfully!');
  };

  const updateLocationRule = (location: string, field: string, value: any) => {
    setRules(prev => ({
      ...prev,
      [location]: {
        ...prev[location],
        [field]: value
      }
    }));
  };

  const addCustomRule = () => {
    const newRule: StudioRule = {
      id: `custom-${Date.now()}`,
      name: 'New Rule',
      description: 'Custom rule description',
      value: '',
      type: 'text'
    };

    updateLocationRule(selectedLocation, 'customRules', [
      ...rules[selectedLocation].customRules,
      newRule
    ]);
  };

  const updateCustomRule = (ruleId: string, field: string, value: any) => {
    const updatedRules = rules[selectedLocation].customRules.map(rule =>
      rule.id === ruleId ? { ...rule, [field]: value } : rule
    );
    updateLocationRule(selectedLocation, 'customRules', updatedRules);
  };

  const removeCustomRule = (ruleId: string) => {
    const updatedRules = rules[selectedLocation].customRules.filter(rule => rule.id !== ruleId);
    updateLocationRule(selectedLocation, 'customRules', updatedRules);
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) 
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  if (!isOpen) return null;

  const currentRules = rules[selectedLocation];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`${theme.card} rounded-2xl shadow-2xl max-w-6xl w-full m-4 max-h-[95vh] overflow-y-auto border ${theme.border}`}>
        <div className={`flex items-center justify-between p-6 border-b ${theme.border} bg-gradient-to-r from-blue-600/20 to-purple-600/20`}>
          <div className="flex items-center">
            <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
              <Settings className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${theme.text}`}>Studio Rules Configuration</h2>
              <p className={`text-sm ${theme.textSecondary}`}>Configure detailed rules for each studio location</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`${theme.textSecondary} hover:${theme.text} transition-colors p-2 hover:bg-gray-700 rounded-lg`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Location Selector */}
          <div className="mb-6">
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-3`}>
              Select Studio Location
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {locations.map(location => (
                <button
                  key={location}
                  onClick={() => setSelectedLocation(location)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selectedLocation === location
                      ? 'border-blue-500 bg-blue-500/20'
                      : `border-gray-600 ${theme.card} hover:border-gray-500`
                  }`}
                >
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-blue-400 mr-3" />
                    <div>
                      <div className={`font-medium ${theme.text}`}>{location.split(',')[0]}</div>
                      <div className={`text-sm ${theme.textSecondary}`}>{location.split(',')[1]}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Basic Rules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Capacity & Timing Rules */}
            <div className="space-y-6">
              <h3 className={`text-lg font-semibold ${theme.text} flex items-center`}>
                <Users className="h-5 w-5 mr-2 text-green-400" />
                Capacity & Timing Rules
              </h3>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  Maximum Parallel Classes
                </label>
                <input
                  type="number"
                  value={currentRules.maxParallelClasses}
                  onChange={(e) => updateLocationRule(selectedLocation, 'maxParallelClasses', parseInt(e.target.value) || 1)}
                  className={`w-full px-3 py-2 ${theme.card} ${theme.text} border ${theme.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  min="1"
                  max="5"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>
                  Minimum Class Gap (minutes)
                </label>
                <select
                  value={currentRules.minClassGap}
                  onChange={(e) => updateLocationRule(selectedLocation, 'minClassGap', parseInt(e.target.value))}
                  className={`w-full px-3 py-2 ${theme.card} ${theme.text} border ${theme.border} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value={0}>No Gap</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-3`}>
                  Peak Hours
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => updateLocationRule(selectedLocation, 'peakHours', 
                        toggleArrayItem(currentRules.peakHours, time)
                      )}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        currentRules.peakHours.includes(time)
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          : `${theme.card} ${theme.textSecondary} border ${theme.border} hover:bg-gray-700`
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Format & Teacher Rules */}
            <div className="space-y-6">
              <h3 className={`text-lg font-semibold ${theme.text} flex items-center`}>
                <Target className="h-5 w-5 mr-2 text-purple-400" />
                Format & Teacher Rules
              </h3>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-3`}>
                  Allowed Formats (leave empty for all)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {classFormats.map(format => (
                    <button
                      key={format}
                      onClick={() => updateLocationRule(selectedLocation, 'allowedFormats', 
                        toggleArrayItem(currentRules.allowedFormats, format)
                      )}
                      className={`p-2 rounded-lg text-xs font-medium transition-colors text-left ${
                        currentRules.allowedFormats.includes(format)
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                          : `${theme.card} ${theme.textSecondary} border ${theme.border} hover:bg-gray-700`
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-3`}>
                  Restricted Formats
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {classFormats.map(format => (
                    <button
                      key={format}
                      onClick={() => updateLocationRule(selectedLocation, 'restrictedFormats', 
                        toggleArrayItem(currentRules.restrictedFormats, format)
                      )}
                      className={`p-2 rounded-lg text-xs font-medium transition-colors text-left ${
                        currentRules.restrictedFormats.includes(format)
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : `${theme.card} ${theme.textSecondary} border ${theme.border} hover:bg-gray-700`
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-3`}>
                  Preferred Teachers
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {allTeachers.map(teacher => (
                    <button
                      key={teacher}
                      onClick={() => updateLocationRule(selectedLocation, 'preferredTeachers', 
                        toggleArrayItem(currentRules.preferredTeachers, teacher)
                      )}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        currentRules.preferredTeachers.includes(teacher)
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : `${theme.card} ${theme.textSecondary} border ${theme.border} hover:bg-gray-700`
                      }`}
                    >
                      {teacher}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Rules */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme.text} flex items-center`}>
                <Zap className="h-5 w-5 mr-2 text-yellow-400" />
                Custom Rules
              </h3>
              <button
                onClick={addCustomRule}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </button>
            </div>

            <div className="space-y-4">
              {currentRules.customRules.map(rule => (
                <div key={rule.id} className={`p-4 ${theme.card} rounded-xl border ${theme.border}`}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                        Rule Name
                      </label>
                      <input
                        type="text"
                        value={rule.name}
                        onChange={(e) => updateCustomRule(rule.id, 'name', e.target.value)}
                        className={`w-full px-2 py-1 text-sm ${theme.card} ${theme.text} border ${theme.border} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                        Description
                      </label>
                      <input
                        type="text"
                        value={rule.description}
                        onChange={(e) => updateCustomRule(rule.id, 'description', e.target.value)}
                        className={`w-full px-2 py-1 text-sm ${theme.card} ${theme.text} border ${theme.border} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs font-medium ${theme.textSecondary} mb-1`}>
                        Type
                      </label>
                      <select
                        value={rule.type}
                        onChange={(e) => updateCustomRule(rule.id, 'type', e.target.value)}
                        className={`w-full px-2 py-1 text-sm ${theme.card} ${theme.text} border ${theme.border} rounded focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="boolean">Boolean</option>
                        <option value="select">Select</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => removeCustomRule(rule.id)}
                        className="p-2 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rule Summary */}
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 rounded-xl border border-indigo-500/20 mb-6">
            <h4 className="font-medium text-indigo-300 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Current Rules Summary for {selectedLocation.split(',')[0]}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className={`${theme.textSecondary} mb-1`}>Max Parallel Classes:</div>
                <div className={`${theme.text} font-medium`}>{currentRules.maxParallelClasses}</div>
              </div>
              <div>
                <div className={`${theme.textSecondary} mb-1`}>Class Gap:</div>
                <div className={`${theme.text} font-medium`}>{currentRules.minClassGap} minutes</div>
              </div>
              <div>
                <div className={`${theme.textSecondary} mb-1`}>Peak Hours:</div>
                <div className={`${theme.text} font-medium`}>{currentRules.peakHours.join(', ')}</div>
              </div>
              <div>
                <div className={`${theme.textSecondary} mb-1`}>Preferred Teachers:</div>
                <div className={`${theme.text} font-medium`}>{currentRules.preferredTeachers.join(', ')}</div>
              </div>
              {currentRules.restrictedFormats.length > 0 && (
                <div className="md:col-span-2">
                  <div className={`${theme.textSecondary} mb-1`}>Restricted Formats:</div>
                  <div className={`${theme.text} font-medium text-red-300`}>{currentRules.restrictedFormats.join(', ')}</div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className={`px-6 py-3 ${theme.textSecondary} hover:${theme.text} transition-colors`}
            >
              Cancel
            </button>
            <button
              onClick={saveRules}
              className="flex items-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Rules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioRulesModal;