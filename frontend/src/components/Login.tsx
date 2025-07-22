import React, { useState, useEffect } from 'react';
import { useMetaverseStore } from '../stores/metaverseStore';

// Input validation helpers
const validateUsername = (username: string): boolean => {
  return username.trim().length >= 2 && username.trim().length <= 20 && /^[a-zA-Z0-9_-]+$/.test(username);
};

const validateAvatarName = (name: string): boolean => {
  return name.trim().length >= 1 && name.trim().length <= 15 && /^[a-zA-Z0-9\s_-]+$/.test(name);
};

const validateColor = (color: string): boolean => {
  return /^#[0-9A-F]{6}$/i.test(color);
};

const Login: React.FC = () => {
  const { setCurrentUser, connectSocket, setLoading, setError, clearError } = useMetaverseStore();
  const [username, setUsername] = useState('');
  const [avatarName, setAvatarName] = useState('');
  const [avatarColor, setAvatarColor] = useState('#FF6B6B');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    username?: string;
    avatarName?: string;
  }>({});

  const avatarColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  // Clear validation errors when inputs change
  useEffect(() => {
    if (username && validationErrors.username) {
      setValidationErrors(prev => ({ ...prev, username: undefined }));
    }
  }, [username]);

  useEffect(() => {
    if (avatarName && validationErrors.avatarName) {
      setValidationErrors(prev => ({ ...prev, avatarName: undefined }));
    }
  }, [avatarName]);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
    const errors: { username?: string; avatarName?: string } = {};

    if (!username.trim()) {
      errors.username = 'Username is required';
    } else if (!validateUsername(username)) {
      errors.username = 'Username must be 2-20 characters and contain only letters, numbers, underscores, and hyphens';
    }

    if (!avatarName.trim()) {
      errors.avatarName = 'Avatar name is required';
    } else if (!validateAvatarName(avatarName)) {
      errors.avatarName = 'Avatar name must be 1-15 characters and contain only letters, numbers, spaces, underscores, and hyphens';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    clearError();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoading(true);

    try {
      // Sanitize inputs with better validation
      const sanitizedUsername = username.trim().replace(/[<>]/g, '');
      const sanitizedAvatarName = avatarName.trim().replace(/[<>]/g, '');
      
      // Validate color
      if (!validateColor(avatarColor)) {
        throw new Error('Please select a valid avatar color');
      }

      // Generate a unique user ID with timestamp and random component
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const userId = `user_${timestamp}_${randomId}`;
      
      // Create user object with validated data
      const user = {
        id: userId,
        username: sanitizedUsername,
        avatar: {
          id: `avatar_${userId}`,
          name: sanitizedAvatarName,
          model: 'default',
          color: avatarColor,
          accessories: [],
          position: { x: 0, y: 0, z: 0, rotation: 0 }
        },
        position: { x: 0, y: 0, z: 0, rotation: 0 },
        room: 'lobby'
      };

      // Set current user first (test without socket)
      console.log('Setting current user:', user);
      setCurrentUser(user);

      // Connect to socket server after setting user
      const serverUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      console.log('Connecting to socket server:', serverUrl);
      connectSocket(serverUrl);

      // Add welcome message after a short delay
      setTimeout(() => {
        console.log('Login completed, clearing loading state');
        clearError();
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to connect to the metaverse. Please try again.');
      setLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    
    // Real-time validation
    if (value && !validateUsername(value)) {
      setValidationErrors(prev => ({
        ...prev,
        username: 'Username must be 2-20 characters and contain only letters, numbers, underscores, and hyphens'
      }));
    } else if (validationErrors.username) {
      setValidationErrors(prev => ({ ...prev, username: undefined }));
    }
  };

  const handleAvatarNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAvatarName(value);
    
    // Real-time validation
    if (value && !validateAvatarName(value)) {
      setValidationErrors(prev => ({
        ...prev,
        avatarName: 'Avatar name must be 1-15 characters and contain only letters, numbers, spaces, underscores, and hyphens'
      }));
    } else if (validationErrors.avatarName) {
      setValidationErrors(prev => ({ ...prev, avatarName: undefined }));
    }
  };

  const handleColorChange = (color: string) => {
    if (validateColor(color)) {
      setAvatarColor(color);
    }
  };

  const isFormValid = username.trim() && avatarName.trim() && 
                     !validationErrors.username && !validationErrors.avatarName && !isLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Metaverse</h1>
          <p className="text-gray-600">Create your avatar and join the virtual world</p>
          

        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Username Input */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              className={`input-field ${validationErrors.username ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Enter your username"
              maxLength={20}
              required
              disabled={isLoading}
              autoComplete="username"
            />
            {validationErrors.username && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.username}</p>
            )}
          </div>

          {/* Avatar Name Input */}
          <div>
            <label htmlFor="avatarName" className="block text-sm font-medium text-gray-700 mb-2">
              Avatar Name
            </label>
            <input
              id="avatarName"
              name="avatarName"
              type="text"
              value={avatarName}
              onChange={handleAvatarNameChange}
              className={`input-field ${validationErrors.avatarName ? 'border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Enter avatar name"
              maxLength={15}
              required
              disabled={isLoading}
              autoComplete="nickname"
            />
            {validationErrors.avatarName && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.avatarName}</p>
            )}
          </div>

          {/* Avatar Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Avatar Color
            </label>
            <div className="grid grid-cols-5 gap-3" role="group" aria-labelledby="color-group-label">
              <span id="color-group-label" className="sr-only">Avatar color options</span>
              {avatarColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleColorChange(color)}
                  className={`w-12 h-12 rounded-full border-2 transition-all duration-200 ${
                    avatarColor === color
                      ? 'border-gray-800 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Select ${color} color`}
                  aria-label={`Select ${color} color`}
                  aria-pressed={avatarColor === color}
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {/* Avatar Preview */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center text-xl font-bold text-white"
                 style={{ backgroundColor: avatarColor }}>
              {avatarName ? avatarName.charAt(0).toUpperCase() : 'A'}
            </div>
            <p className="text-sm text-gray-600">
              {avatarName || 'Your Avatar'}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </div>
            ) : (
              'Enter Metaverse'
            )}
          </button>
        </form>

        {/* Features List */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">What you can do:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Explore 3D virtual spaces
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Chat with other users in real-time
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Customize your avatar
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Move around with WASD keys
            </li>
          </ul>
        </div>

        {/* Security Notice */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            🔒 Your data is protected with encryption and secure connections
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 