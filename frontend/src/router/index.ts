import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import { useAuthStore } from '@/stores/authStore';
import AdminPanel from '@/views/AdminPanel.vue';
import CreateCustom from '@/views/CreateCustom.vue';
import CreateTicket from '@/views/CreateTicket.vue';
import AllTickets from '@/views/AllTickets.vue';
import MyTickets from '@/views/MyTickets.vue';
import AssignedTickets from '@/views/AssignedTickets.vue';
import Maintenance from '@/views/Maintenance.vue';
import ReportTicketList from '@/views/ReportTicketList.vue';
import ReportTicketDetails from '@/views/ReportTicketDetails.vue';
import ReportCompanyList from '@/views/ReportCompanyList.vue';
import ReportCompanyDetails from '@/views/ReportCompanyDetails.vue';
import NotFound from '@/views/NotFound.vue';
import Settings from '@/views/Settings.vue';
import Statistics from '@/views/Statistics.vue';

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
        path: '/ticket/user/:id', 
        name: 'TicketUser',
        component: () => import('@/views/TicketUser.vue'),
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
    { 
        path: '/assigned-tickets', 
        component: AssignedTickets,
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
        path: '/my-tickets', 
        component: MyTickets,
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
        path: '/maintenance-calendar', 
        component: Maintenance,
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
        path: '/report', 
        component: ReportTicketList,
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
        path: '/report/:id', 
        name: 'TicketReport',
        component: ReportTicketDetails,
    
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
        path: '/companies', 
        component: ReportCompanyList,
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
        path: '/companies/:id', 
        name: 'CompanyReport',
        component: ReportCompanyDetails,
    
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
        path: '/settings', 
        name: 'Settings',
        component: Settings,
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
        path: '/statistics', 
        name: 'Statistics',
        component: Statistics,
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
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFound,
        beforeEnter: (to: any, from: any, next: any) => {
            const authStore = useAuthStore();
            if (!authStore.isAuthenticated) {
                next('/login'); // Če ni prijavljen, ga preusmeri na login
            } else {
                next();
            }
        }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
