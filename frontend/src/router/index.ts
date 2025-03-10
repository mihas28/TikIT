import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import { useAuthStore } from '@/stores/authStore';
import AdminPanel from '@/views/AdminPanel.vue';
import CreateCustom from '@/views/CreateCustom.vue';
import CreateTicket from '@/views/CreateTicket.vue';
import AllTickets from '@/views/AllTickets.vue';

const routes = [
    { path: '/', redirect: '/login' }, // Privzeta stran je login
    { path: '/login', component: LoginView },
    { 
        path: '/dashboard', 
        component: DashboardView,
        beforeEnter: (to: any, from: any, next: any) => {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated) {
                next('/login'); // Če ni prijavljen, ga preusmeri na login
            } else {
                next();
            }
        }
    },
    { 
        path: '/custom-ticket', 
        component: CreateCustom,
        beforeEnter: (to: any, from: any, next: any) => {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated) {
                next('/login'); // Če ni prijavljen, ga preusmeri na login
            } else {
                next();
            }
        }
    },
    { 
        path: '/admin-panel', 
        component: AdminPanel,
        beforeEnter: (to: any, from: any, next: any) => {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated) {
                next('/login'); // Če ni prijavljen, ga preusmeri na login
            } else {
                next();
            }
        }
    },
    { 
        path: '/create-ticket', 
        component: CreateTicket,
        beforeEnter: (to: any, from: any, next: any) => {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated) {
                next('/login'); // Če ni prijavljen, ga preusmeri na login
            } else {
                next();
            }
        }
    },
    { 
        path: '/ticket/:id', 
        name: 'TicketDetails',
        component: () => import('@/views/TicketDetails.vue'),
        beforeEnter: (to: any, from: any, next: any) => {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated) {
                next('/login'); // Če ni prijavljen, ga preusmeri na login
            } else {
                next();
            }
        }
    },
    { 
        path: '/all-tickets', 
        component: AllTickets,
        beforeEnter: (to: any, from: any, next: any) => {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated) {
                next('/login'); // Če ni prijavljen, ga preusmeri na login
            } else {
                next();
            }
        }
    },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
