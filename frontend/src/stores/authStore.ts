import { defineStore } from 'pinia';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    userId: number;
    role: string;
    exp: number;
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: localStorage.getItem('accessToken') || '',
        refreshToken: localStorage.getItem('refreshToken') || '',
    }),
    getters: {
        isAuthenticated: (state) => !!state.accessToken,
        getUserRole: (state) => {
            if (state.accessToken) {
                try {
                    const decoded: DecodedToken = jwtDecode(state.accessToken);
                    return decoded.role; // Vedno dekodira `role` iz JWT tokena
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
        },
        logout() {
            this.accessToken = '';
            this.refreshToken = '';
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        }
    }
});
