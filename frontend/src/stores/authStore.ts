import { defineStore } from 'pinia';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
    userId: number;
    role: string;
    iat: number;
    exp: number;
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        accessToken: localStorage.getItem('accessToken') || '',
        refreshToken: localStorage.getItem('refreshToken') || '',
        userRole: localStorage.getItem('userRole') || '', // Dodaj shranjeno vlogo
    }),
    getters: {
        isAuthenticated: (state) => !!state.accessToken, // Preveri ali je uporabnik prijavljen
        getUserRole: (state) => {
            if (state.accessToken) {
                try {
                    const decoded: DecodedToken = jwtDecode(state.accessToken);
                    return decoded.role; // Vrnemo vlogo iz tokena
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

            try {
                const decoded: DecodedToken = jwtDecode(accessToken);
                this.userRole = decoded.role;
                localStorage.setItem('userRole', decoded.role);
            } catch (error) {
                console.error('Napaka pri dekodiranju tokena:', error);
                this.userRole = '';
            }

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
        },
        logout() {
            this.accessToken = '';
            this.refreshToken = '';
            this.userRole = '';
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userRole');
        }
    }
});

