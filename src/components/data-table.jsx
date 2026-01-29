import React, { useState, useEffect, useRef } from 'react';
import { Upload, Plus, Edit3, Save, Download, MapPin, Route, Calendar, Clock, DollarSign, Navigation, FileText, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';

const DataTable = ({ data, columns, onEdit, onDelete, onAdd, title }) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <button
          onClick={onAdd}
          className="flex items-center px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
          <Plus className="w-3 h-3 mr-1" />
          Add
        </button>
      </div>

      {data.length === 0 ? (
        <p className="text-gray-500 text-sm italic">
          No data available. Click "Add" to create new entries.
        </p>
      ) : (
        <div className="max-h-40 overflow-y-auto border rounded">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-2 py-1 text-left font-medium text-gray-700">
                    {col.label}
                  </th>
                ))}
                <th className="px-2 py-1 w-16">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  {columns.map((col) => (
                    <td key={col.key} className="px-2 py-1 truncate max-w-20">
                      {row[col.key] || "-"}
                    </td>
                  ))}
                  <td className="px-2 py-1">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => onEdit(row, index)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDelete(index)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default DataTable