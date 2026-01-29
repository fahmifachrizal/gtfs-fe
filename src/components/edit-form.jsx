import React, { useState, useEffect, useRef } from 'react';
import { Upload, Plus, Edit3, Save, Download, MapPin, Route, Calendar, Clock, DollarSign, Navigation, FileText, ChevronRight, ChevronDown, Trash2 } from 'lucide-react';

const EditForm = ({ fields, data, onSave, onCancel, title }) => {
  const [formData, setFormData] = useState(data || {})

  const handleSubmit = () => {
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
        <h3 className="text-lg font-medium mb-4">{title}</h3>
        <div className="space-y-3">
          {fields.map((field) => (
            <div key={field.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}{" "}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  value={formData[field.key] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                  required={field.required}
                  title="Text Area"
                />
              ) : field.type === "select" ? (
                <select
                  title="Select"
                  value={formData[field.key] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  required={field.required}>
                  <option value="">Select...</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  title={"Input"}
                  type={field.type || "text"}
                  value={formData[field.key] || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [field.key]: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  required={field.required}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditForm