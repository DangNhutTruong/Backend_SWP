# 🚀 DEMO CODE CHO PHỎNG VẤN FRONTEND

## 📋 CODE EXAMPLES ĐỂ DEMO TRONG PHỎNG VẤN

### 1. 🎯 REACT COMPONENT WITH HOOKS
```jsx
// Achievement Component - Thể hiện React Hooks và State Management
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Achievement = () => {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  // useEffect để fetch data khi component mount
  useEffect(() => {
    if (user?.id) {
      fetchAchievements();
    }
  }, [user?.id]);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/achievements/${user.id}`);
      setAchievements(response.data);
    } catch (err) {
      setError('Không thể tải achievements');
      console.error('Error fetching achievements:', err);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="achievements-container">
      <h2 className="text-2xl font-bold mb-6">Your Achievements</h2>
      
      {achievements.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Chưa có achievements nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map(achievement => (
            <AchievementCard 
              key={achievement.id} 
              achievement={achievement}
              onUpdate={fetchAchievements}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Child component để thể hiện component composition
const AchievementCard = ({ achievement, onUpdate }) => {
  const [isUnlocked, setIsUnlocked] = useState(achievement.unlocked);

  const handleUnlock = async () => {
    try {
      await axios.post(`/api/achievements/${achievement.id}/unlock`);
      setIsUnlocked(true);
      onUpdate(); // Callback để update parent component
    } catch (error) {
      console.error('Error unlocking achievement:', error);
    }
  };

  return (
    <div className={`
      achievement-card p-6 rounded-lg shadow-lg transition-all duration-300
      ${isUnlocked 
        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white' 
        : 'bg-gray-100 text-gray-600'
      }
      hover:transform hover:scale-105
    `}>
      <div className="text-center">
        <div className="text-4xl mb-3">
          {isUnlocked ? achievement.icon : '🔒'}
        </div>
        <h3 className="font-bold text-lg mb-2">{achievement.title}</h3>
        <p className="text-sm mb-4">{achievement.description}</p>
        
        {isUnlocked ? (
          <span className="inline-block bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
            +{achievement.points} điểm
          </span>
        ) : (
          <button 
            onClick={handleUnlock}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            Mở khóa
          </button>
        )}
      </div>
    </div>
  );
};

export default Achievement;
```

### 2. 🎨 RESPONSIVE CSS WITH TAILWIND
```css
/* Custom CSS cho animations và responsive design */
.achievements-container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}

.achievement-card {
  @apply relative overflow-hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  /* Responsive breakpoints */
  @apply p-4 sm:p-6;
  
  /* Hover effects */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.achievement-card:hover {
  @apply shadow-2xl;
  transform: translateY(-5px) scale(1.02);
}

.achievement-card::before {
  content: '';
  @apply absolute top-0 left-0 w-full h-full;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform 0.5s;
}

.achievement-card:hover::before {
  transform: translateX(100%);
}

/* Mobile-first responsive design */
@media (max-width: 640px) {
  .achievements-container {
    @apply px-4 py-4;
  }
  
  .achievement-card {
    @apply p-4;
    font-size: 0.9rem;
  }
}

@media (min-width: 768px) {
  .achievement-card {
    @apply p-6;
  }
}

@media (min-width: 1024px) {
  .achievements-container {
    @apply px-8;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .achievement-card {
    background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
  }
}
```

### 3. 🔄 CONTEXT API USAGE
```jsx
// AuthContext.jsx - Global State Management
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING'
};

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    
    case AUTH_ACTIONS.LOGOUT:
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    default:
      return state;
  }
};

// AuthProvider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      try {
        const response = await fetch('/api/auth/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const userData = await response.json();
          dispatch({ 
            type: AUTH_ACTIONS.LOGIN_SUCCESS, 
            payload: userData 
          });
        } else {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        dispatch({ 
          type: AUTH_ACTIONS.LOGIN_SUCCESS, 
          payload: data.user 
        });
        return { success: true };
      } else {
        const error = await response.json();
        dispatch({ 
          type: AUTH_ACTIONS.LOGIN_FAILURE, 
          payload: error.message 
        });
        return { success: false, error: error.message };
      }
    } catch (error) {
      dispatch({ 
        type: AUTH_ACTIONS.LOGIN_FAILURE, 
        payload: 'Network error' 
      });
      return { success: false, error: 'Network error' };
    }
  };

  // Logout function
  const logout = () => {
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  };

  // Update user function
  const updateUser = (userData) => {
    dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: userData });
  };

  const value = {
    ...state,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
```

### 4. 🛡️ PROTECTED ROUTE COMPONENT
```jsx
// ProtectedRoute.jsx - Route protection với authentication
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Render children if authenticated
  return children;
};

export default ProtectedRoute;
```

### 5. 🎮 CUSTOM HOOKS
```jsx
// useLocalStorage.js - Custom hook for localStorage
import { useState, useEffect } from 'react';

export const useLocalStorage = (key, initialValue) => {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

// useApi.js - Custom hook for API calls
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(url, options);
        
        if (!isCancelled) {
          setData(response.data);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.response?.data?.message || err.message);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      isCancelled = true;
    };
  }, [url]);

  const refetch = () => {
    setLoading(true);
    // Re-trigger useEffect by updating a dependency
  };

  return { data, loading, error, refetch };
};

// useDebounce.js - Custom hook for debouncing
import { useState, useEffect } from 'react';

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};
```

### 6. 🎯 SEARCH COMPONENT WITH DEBOUNCE
```jsx
// SearchComponent.jsx - Thể hiện performance optimization
import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { useApi } from '../hooks/useApi';

const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Effect for API call when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      searchData(debouncedSearchTerm);
    } else {
      setResults([]);
    }
  }, [debouncedSearchTerm]);

  const searchData = async (term) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtered results for performance
  const filteredResults = useMemo(() => {
    return results.filter(result => 
      result.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [results, searchTerm]);

  return (
    <div className="search-container max-w-2xl mx-auto p-6">
      <div className="relative">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-all duration-200"
        />
        
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
          {loading ? (
            <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full"></div>
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {/* Search Results */}
      {searchTerm && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {filteredResults.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {filteredResults.map((result) => (
                <li key={result.id} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {result.title}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {result.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {result.category}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-500">
              {loading ? 'Đang tìm kiếm...' : 'Không tìm thấy kết quả nào'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
```

## 🎯 TECHNICAL CONCEPTS ĐỂ GIẢI THÍCH

### 1. **React Hooks**
- `useState`: Quản lý state trong functional components
- `useEffect`: Side effects và lifecycle methods
- `useContext`: Global state management
- `useMemo`: Performance optimization với memoization
- `useCallback`: Memoize functions to prevent unnecessary re-renders

### 2. **Component Architecture**
- Functional components vs Class components
- Component composition pattern
- Props drilling và cách giải quyết
- Higher-Order Components (HOC)
- Render props pattern

### 3. **State Management**
- Local state với useState
- Global state với Context API
- Props drilling problem
- State lifting
- Immutable state updates

### 4. **Performance Optimization**
- React.memo() để prevent unnecessary re-renders
- useMemo() và useCallback() hooks
- Code splitting với React.lazy()
- Bundle optimization
- Image optimization

### 5. **Modern JavaScript (ES6+)**
- Arrow functions và lexical this
- Destructuring assignment
- Spread operator
- Template literals
- Async/await
- Modules (import/export)

### 6. **CSS & Styling**
- CSS-in-JS vs traditional CSS
- Tailwind CSS utility-first approach
- Responsive design principles
- CSS Grid vs Flexbox
- CSS animations và transitions

## 🚀 LIVE CODING CHALLENGES

### Challenge 1: Todo List Component
```jsx
const TodoList = () => {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim()) {
      setTodos([...todos, { 
        id: Date.now(), 
        text: inputValue, 
        completed: false 
      }]);
      setInputValue('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="flex mb-4">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          className="flex-1 px-3 py-2 border rounded-l"
          placeholder="Add new todo..."
        />
        <button
          onClick={addTodo}
          className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600"
        >
          Add
        </button>
      </div>
      
      <ul className="space-y-2">
        {todos.map(todo => (
          <li key={todo.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
            />
            <span className={todo.completed ? 'line-through text-gray-500' : ''}>
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### Challenge 2: Counter with Custom Hook
```jsx
// Custom hook
const useCounter = (initialValue = 0) => {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(c => c + 1);
  const decrement = () => setCount(c => c - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
};

// Component using custom hook
const Counter = () => {
  const { count, increment, decrement, reset } = useCounter(0);
  
  return (
    <div className="text-center p-6">
      <h2 className="text-2xl font-bold mb-4">Count: {count}</h2>
      <div className="space-x-2">
        <button onClick={decrement} className="px-4 py-2 bg-red-500 text-white rounded">
          -
        </button>
        <button onClick={reset} className="px-4 py-2 bg-gray-500 text-white rounded">
          Reset
        </button>
        <button onClick={increment} className="px-4 py-2 bg-green-500 text-white rounded">
          +
        </button>
      </div>
    </div>
  );
};
```

---

## 💡 TIPS KHI DEMO CODE

1. **Giải thích từng bước:** Đừng chỉ viết code, hãy giải thích tại sao
2. **Nhấn mạnh best practices:** Clean code, naming conventions, performance
3. **Thể hiện problem-solving:** Giải thích cách approach problems
4. **Show debugging skills:** Làm thế nào handle errors và debug
5. **Demonstrate testing mindset:** Nghĩ về edge cases và error handling

**GOOD LUCK! 🚀**
