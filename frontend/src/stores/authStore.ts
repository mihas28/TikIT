import { defineStore } from 'pinia';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import router from '../router'; 

const API_URL = import.meta.env.VITE_API_URL;

interface DecodedToken {
    userId: number;
    role: string;
    exp: number;
}

const REFRESH_INTERVAL_MINUTES = Number(import.meta.env.VITE_TOKEN_REFRESH_INTERVAL_MINUTES) || 55
const INACTIVITY_TIMEOUT_MINUTES = Number(import.meta.env.VITE_INACTIVITY_TIMEOUT_MINUTES) || 60

export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: localStorage.getItem('accessToken') || '',
        refreshToken: localStorage.getItem('refreshToken') || '',
        refreshInterval: null as ReturnType<typeof setInterval> | null,
        inactivityTimeout: null as ReturnType<typeof setTimeout> | null,
        _inactivityEvents: [] as string[],
        _inactivityHandler: null as EventListener | null,

    }),
    getters: {
        isAuthenticated: (state) => !!state.accessToken,
        getUserRole: (state) => {
            if (state.accessToken) {
                try {
                    const decoded: DecodedToken = jwtDecode(state.accessToken);
                    return decoded.role;
                } catch (error) {
                    console.error('Napaka pri dekodiranju JWT:', error);
                    return '';
                }
            }
            return '';
        },
    },
    actions: {
        login(accessToken: string, refreshToken: string) {
            this.accessToken = accessToken;
            this.refreshToken = refreshToken;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            this.startAutoRefresh();
            this.startInactivityTracking();
        },
        logout() {
            this.accessToken = '';
            this.refreshToken = '';
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            this.stopAutoRefresh();
            this.stopInactivityTracking();

            router.push('/login');
        },
        async refreshAccessToken() {
            try {
              const response = await axios.post(
                `${API_URL}/refresh`,
                {refreshToken: this.refreshToken,}, // body
                {
                  headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                  },
                }
              )
          
              this.accessToken = response.data.accessToken
              localStorage.setItem('accessToken', this.accessToken)
            } catch (error) {
              console.error('Napaka pri osveževanju tokena:', error)
              this.logout()
            }
          }
          ,
        startAutoRefresh() {
            this.stopAutoRefresh();
            this.refreshInterval = setInterval(() => {
                this.refreshAccessToken();
            }, REFRESH_INTERVAL_MINUTES * 60 * 1000); // osveži vsakih n min
        },
        stopAutoRefresh() {
            if (this.refreshInterval) {
                clearInterval(this.refreshInterval);
                this.refreshInterval = null;
            }
        },
        resetInactivityTimer() {
            if (this.inactivityTimeout) 
                clearTimeout(this.inactivityTimeout);
          
            const timeoutMs = INACTIVITY_TIMEOUT_MINUTES * 60 * 1000
            this.inactivityTimeout = setTimeout(() => {
              this.logout()
            }, timeoutMs)
        },
        startInactivityTracking() {
            this.stopInactivityTracking();

            this._inactivityEvents = ['mousemove', 'keydown', 'click'];
            this._inactivityHandler = this.resetInactivityTimer.bind(this);

            this._inactivityEvents.forEach(event => {
                window.addEventListener(event, this._inactivityHandler!)
            })

            this.resetInactivityTimer();
        },
        stopInactivityTracking() {
            if (this.inactivityTimeout) {
                clearTimeout(this.inactivityTimeout);
                this.inactivityTimeout = null;
            }

            if (this._inactivityEvents && this._inactivityHandler) {
                this._inactivityEvents.forEach(event => {
                  window.removeEventListener(event, this._inactivityHandler!)
                })
            } 
        },
        isAccessTokenValid(): boolean {
            if (!this.accessToken) return false
            try {
              const decoded: DecodedToken = jwtDecode(this.accessToken)
              const currentTime = Math.floor(Date.now() / 1000)
              return decoded.exp > currentTime
            } catch {
              return false
            }
        },          
    },
});
