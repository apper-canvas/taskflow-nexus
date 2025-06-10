import { delay } from '../index';

// Mock user data
const mockUsers = [
    {
        id: 'user_1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
        role: 'admin',
        permissions: ['create', 'read', 'update', 'delete', 'assign'],
        createdAt: '2024-01-15T10:00:00.000Z'
    },
    {
        id: 'user_2',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=32&h=32&fit=crop&crop=face',
        role: 'manager',
        permissions: ['create', 'read', 'update', 'assign'],
        createdAt: '2024-01-16T09:30:00.000Z'
    },
    {
        id: 'user_3',
        name: 'Mike Johnson',
        email: 'mike.johnson@example.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
        role: 'member',
        permissions: ['read', 'update'],
        createdAt: '2024-01-17T14:15:00.000Z'
    },
    {
        id: 'user_4',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@example.com',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
        role: 'member',
        permissions: ['read', 'update'],
        createdAt: '2024-01-18T11:45:00.000Z'
    }
];

class UserService {
    constructor() {
        this.users = this.loadFromStorage();
    }

    loadFromStorage() {
        const stored = localStorage.getItem('taskflow-users');
        return stored ? JSON.parse(stored) : [...mockUsers];
    }

    saveToStorage() {
        localStorage.setItem('taskflow-users', JSON.stringify(this.users));
    }

    async getAll() {
        await delay(200);
        return [...this.users];
    }

    async getById(id) {
        await delay(150);
        const user = this.users.find(u => u.id === id);
        return user ? { ...user } : null;
    }

    async create(userData) {
        await delay(300);
        const user = {
            ...userData,
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            permissions: this.getDefaultPermissions(userData.role || 'member')
        };
        this.users.push(user);
        this.saveToStorage();
        return { ...user };
    }

    async update(id, updates) {
        await delay(250);
        const index = this.users.findIndex(u => u.id === id);
        if (index === -1) {
            throw new Error('User not found');
        }

        // Update permissions if role changed
        if (updates.role && updates.role !== this.users[index].role) {
            updates.permissions = this.getDefaultPermissions(updates.role);
        }

        this.users[index] = { ...this.users[index], ...updates };
        this.saveToStorage();
        return { ...this.users[index] };
    }

    async delete(id) {
        await delay(250);
        const index = this.users.findIndex(u => u.id === id);
        if (index === -1) {
            throw new Error('User not found');
        }
        this.users.splice(index, 1);
        this.saveToStorage();
        return true;
    }

    async getByRole(role) {
        await delay(200);
        return this.users.filter(u => u.role === role).map(u => ({ ...u }));
    }

    async checkPermission(userId, permission) {
        await delay(100);
        const user = this.users.find(u => u.id === userId);
        return user ? user.permissions.includes(permission) : false;
    }

    getDefaultPermissions(role) {
        switch (role) {
            case 'admin':
                return ['create', 'read', 'update', 'delete', 'assign', 'manage_users'];
            case 'manager':
                return ['create', 'read', 'update', 'assign'];
            case 'member':
                return ['read', 'update'];
            default:
                return ['read'];
        }
    }

    async getCurrentUser() {
        await delay(100);
        // In a real app, this would be based on authentication
        return { ...this.users[0] }; // Return first user as current user
    }
}

export default UserService;