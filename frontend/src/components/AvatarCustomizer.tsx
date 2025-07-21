import React, { useState } from 'react';
import { useMetaverseStore } from '../stores/metaverseStore';

const AvatarCustomizer: React.FC = () => {
  const { currentUser, updateAvatar } = useMetaverseStore();
  const [isOpen, setIsOpen] = useState(false);

  const avatarColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  const accessories = [
    { id: 'hat-1', name: 'Baseball Cap', icon: '🧢' },
    { id: 'hat-2', name: 'Crown', icon: '👑' },
    { id: 'glasses-1', name: 'Sunglasses', icon: '🕶️' },
    { id: 'glasses-2', name: 'Glasses', icon: '👓' },
    { id: 'none', name: 'None', icon: '❌' }
  ];

  const handleColorChange = (color: string) => {
    if (currentUser) {
      updateAvatar({ color });
    }
  };

  const handleAccessoryChange = (accessoryId: string) => {
    if (currentUser) {
      const newAccessories = accessoryId === 'none' 
        ? [] 
        : [accessoryId];
      updateAvatar({ accessories: newAccessories });
    }
  };

  const handleNameChange = (name: string) => {
    if (currentUser) {
      updateAvatar({ name });
    }
  };

  if (!currentUser) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 bg-secondary-600 hover:bg-secondary-700 text-white p-3 rounded-full shadow-lg transition-colors duration-200 z-50"
        aria-label="Open avatar customizer"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-primary-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <h3 className="font-semibold">Customize Avatar</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white hover:text-gray-200 transition-colors duration-200"
            aria-label="Close avatar customizer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar Preview */}
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold text-white"
                 style={{ backgroundColor: currentUser.avatar.color }}>
              {currentUser.avatar.name.charAt(0).toUpperCase()}
            </div>
            <h4 className="font-medium text-gray-900">{currentUser.avatar.name}</h4>
          </div>

          {/* Name Input */}
          <div>
            <label htmlFor="customizerAvatarName" className="block text-sm font-medium text-gray-700 mb-2">
              Avatar Name
            </label>
            <input
              id="customizerAvatarName"
              name="customizerAvatarName"
              type="text"
              value={currentUser.avatar.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="input-field"
              placeholder="Enter avatar name"
              maxLength={20}
              autoComplete="nickname"
            />
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Avatar Color
            </label>
            <div className="grid grid-cols-5 gap-3" role="group" aria-labelledby="customizer-color-group-label">
              <span id="customizer-color-group-label" className="sr-only">Avatar color options</span>
              {avatarColors.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                    currentUser.avatar.color === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Select ${color} color`}
                  aria-label={`Select ${color} color`}
                  aria-pressed={currentUser.avatar.color === color}
                />
              ))}
            </div>
          </div>

          {/* Accessories Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Accessories
            </label>
            <div className="grid grid-cols-3 gap-3" role="group" aria-labelledby="accessories-group-label">
              <span id="accessories-group-label" className="sr-only">Avatar accessories options</span>
              {accessories.map((accessory) => (
                <button
                  key={accessory.id}
                  onClick={() => handleAccessoryChange(accessory.id)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-center ${
                    currentUser.avatar.accessories.includes(accessory.id)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  aria-label={`Select ${accessory.name} accessory`}
                  aria-pressed={currentUser.avatar.accessories.includes(accessory.id)}
                >
                  <div className="text-2xl mb-1" aria-hidden="true">{accessory.icon}</div>
                  <div className="text-xs text-gray-600">{accessory.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Accessories Display */}
          {currentUser.avatar.accessories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Accessories
              </label>
              <div className="flex flex-wrap gap-2">
                {currentUser.avatar.accessories.map((accessoryId) => {
                  const accessory = accessories.find(a => a.id === accessoryId);
                  return accessory ? (
                    <span
                      key={accessoryId}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary-100 text-primary-800"
                    >
                      {accessory.icon} {accessory.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full btn-primary"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCustomizer; 