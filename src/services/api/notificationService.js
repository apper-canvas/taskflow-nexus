import { delay } from '../index';

class NotificationService {
    constructor() {
        this.notifications = this.loadFromStorage();
    }

    loadFromStorage() {
        const stored = localStorage.getItem('taskflow-notifications');
        return stored ? JSON.parse(stored) : [];
    }

    saveToStorage() {
        localStorage.setItem('taskflow-notifications', JSON.stringify(this.notifications));
    }

    async getAll() {
        await delay(200);
        return [...this.notifications];
    }

    async getByUserId(userId) {
        await delay(150);
        return this.notifications
            .filter(n => n.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map(n => ({ ...n }));
    }

    async create(notificationData) {
        await delay(250);
        const notification = {
            ...notificationData,
            id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            read: false,
            createdAt: new Date().toISOString()
        };
        this.notifications.push(notification);
        this.saveToStorage();
        
        // In a real app, this would trigger real-time notifications
        this.triggerBrowserNotification(notification);
        
        return { ...notification };
    }

    async markAsRead(id) {
        await delay(150);
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) {
            throw new Error('Notification not found');
        }
        this.notifications[index].read = true;
        this.saveToStorage();
        return { ...this.notifications[index] };
    }

    async markAllAsRead(userId) {
        await delay(200);
        this.notifications.forEach(notification => {
            if (notification.userId === userId) {
                notification.read = true;
            }
        });
        this.saveToStorage();
        return true;
    }

    async delete(id) {
        await delay(150);
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) {
            throw new Error('Notification not found');
        }
        this.notifications.splice(index, 1);
        this.saveToStorage();
        return true;
    }

    async getUnreadCount(userId) {
        await delay(100);
        return this.notifications.filter(n => n.userId === userId && !n.read).length;
    }

    triggerBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                tag: notification.id
            });
        }
    }

    async requestPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    // Schedule deadline reminders
    async scheduleDeadlineReminders() {
        await delay(100);
        const { taskService } = await import('./taskService');
        const tasks = await taskService.getAll();
        
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        for (const task of tasks) {
            if (task.dueDate && task.status !== 'done') {
                const dueDate = new Date(task.dueDate);
                const timeDiff = dueDate - now;
                
                // Schedule reminder for tasks due in 24 hours
                if (timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000) {
                    await this.create({
                        userId: task.assignedTo?.id || 'user_1',
                        type: 'deadline_reminder',
                        title: 'Task Due Soon',
                        message: `Task "${task.title}" is due ${dueDate.toLocaleDateString()}`,
                        taskId: task.id,
                        priority: 'high'
                    });
                }
            }
        }
    }
}

export default NotificationService;