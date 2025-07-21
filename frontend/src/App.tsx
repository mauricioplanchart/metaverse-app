
import React from 'react';
import { useMetaverseStore } from './stores/metaverseStore';
import Login from './components/Login';
import World3D from './components/World3D';
import Chat from './components/Chat';
import AvatarCustomizer from './components/AvatarCustomizer';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-lg max-w-md w-full mx-4">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
              <p className="text-gray-600 mb-6">
                The application encountered an unexpected error. Please refresh the page to try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const { isAuthenticated, currentUser, error, isLoading } = useMetaverseStore();

  console.log('🎮 App render - isAuthenticated:', isAuthenticated, 'currentUser:', currentUser?.username, 'error:', error, 'isLoading:', isLoading);

  // Show login if not authenticated
  if (!isAuthenticated) {
    console.log('🔒 User not authenticated, showing Login component');
    return (
      <ErrorBoundary>
        <Login />
      </ErrorBoundary>
    );
  }

  console.log('🌍 User authenticated, showing World3D component');
  return (
    <ErrorBoundary>
      <div className="w-full h-full relative overflow-hidden">
        {/* Main 3D World */}
        <World3D />
        
        {/* Chat Component */}
        <Chat />
        
        {/* Avatar Customizer */}
        <AvatarCustomizer />
        
        {/* User Info Panel */}
        {currentUser && (
          <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="flex items-center space-x-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: currentUser.avatar.color }}
              >
                {currentUser.avatar.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-medium text-gray-900">{currentUser.username}</div>
                <div className="text-xs text-gray-600">Room: {currentUser.room}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Controls Info */}
        <div className="absolute bottom-4 left-4 z-10 bg-black/50 text-white p-3 rounded-lg backdrop-blur-sm">
          <div className="text-sm">
            <div className="font-medium mb-1">Controls:</div>
            <div className="text-xs space-y-1">
              <div>WASD - Move</div>
              <div>Mouse - Look around</div>
              <div>Scroll - Zoom</div>
            </div>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
            <div className="flex items-center space-x-2">
              <span className="text-sm">{error}</span>
              <button
                onClick={() => useMetaverseStore.getState().setError(null)}
                className="text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        )}
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg">
              <div className="flex items-center space-x-3">
                <svg className="animate-spin h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-700">Loading...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
