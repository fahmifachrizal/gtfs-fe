import React, { useState, useEffect, useRef } from 'react';
import { Upload, Plus, Edit3, Save, Download, MapPin, Route, Calendar, Clock, DollarSign, Navigation, FileText, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';

const SidebarSection = ({ title, icon: Icon, children, isOpen, onToggle, count = 0 }) => {
  return (
    <div className="border-b border-gray-200">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center">
          <Icon className="w-5 h-5 mr-3 text-gray-600" />
          <span className="font-medium">{title}</span>
          {count > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {count}
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="pb-4 px-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default SidebarSection;