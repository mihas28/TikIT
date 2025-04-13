import { defineStore } from 'pinia';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

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
        },
        async refreshAccessToken() {
            try {
              const response = await axios.post(
                'http://localhost:3000/refresh',
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
        startInactivityTracking() {
            this.stopInactivityTracking();

            const resetTimer = () => {
                clearTimeout(this.inactivityTimeout!);
                this.inactivityTimeout = setTimeout(() => {
                    this.logout();
                }, INACTIVITY_TIMEOUT_MINUTES * 60 * 1000); // n minut brez aktivnosti
            };

            ['mousemove', 'keydown', 'click'].forEach((event) => {
                window.addEventListener(event, resetTimer);
            });

            resetTimer();
        },
        stopInactivityTracking() {
            if (this.inactivityTimeout) {
                clearTimeout(this.inactivityTimeout);
                this.inactivityTimeout = null;
            }
        },
    },
});
