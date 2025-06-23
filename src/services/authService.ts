import { configService } from './ConfigService';

interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

interface AuthError {
  error: {
    message: string;
    details?: any[];
  };
}

class AuthService {
  private token: string | null = null;
  private user: AuthResponse['user'] | null = null;

  constructor() {
    // Load token from localStorage on init
    this.loadStoredAuth();
  }

  private loadStoredAuth() {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    
    if (storedToken && storedUser) {
      this.token = storedToken;
      this.user = JSON.parse(storedUser);
    }
  }

  async register(email: string, password: string, username: string): Promise<AuthResponse> {
    const response = await fetch(configService.getAuthApiUrl('/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    });

    if (!response.ok) {
      const error: AuthError = await response.json();
      throw new Error(error.error.message || 'Registration failed');
    }

    const data: AuthResponse = await response.json();
    this.setAuth(data.token, data.user);
    return data;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(configService.getAuthApiUrl('/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error: AuthError = await response.json();
      throw new Error(error.error.message || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    this.setAuth(data.token, data.user);
    return data;
  }

  async verifyToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(configService.getAuthApiUrl('/verify'), {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      this.logout();
      return false;
    }
  }

  async refreshToken(): Promise<string | null> {
    if (!this.token) return null;

    try {
      const response = await fetch(configService.getAuthApiUrl('/refresh'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        this.logout();
        return null;
      }

      const data = await response.json();
      this.token = data.token;
      if (this.token) {
        localStorage.setItem('authToken', this.token);
      }
      return this.token;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  private setAuth(token: string, user: AuthResponse['user']) {
    this.token = token;
    this.user = user;
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): AuthResponse['user'] | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // Attach auth token to fetch requests
  getAuthHeaders(): HeadersInit {
    return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
  }
}

export const authService = new AuthService();
export default authService;