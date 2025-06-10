import { delay } from '../index';
import { 
    startOfWeek, 
    endOfWeek, 
    startOfMonth, 
    endOfMonth, 
    eachDayOfInterval, 
    format, 
    isAfter, 
    isBefore 
} from 'date-fns';

class AnalyticsService {
    constructor() {
        this.taskService = null;
        this.userService = null;
    }

    async init() {
        if (!this.taskService) {
            const { taskService } = await import('./taskService');
            this.taskService = taskService;
        }
        if (!this.userService) {
            const { userService } = await import('./userService');
            this.userService = userService;
        }
    }

    async getTaskCompletionRates(timeframe = 'week') {
        await this.init();
        await delay(300);
        
        const now = new Date();
        let startDate, endDate;
        
        switch (timeframe) {
            case 'week':
                startDate = startOfWeek(now);
                endDate = endOfWeek(now);
                break;
            case 'month':
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            default:
                startDate = startOfWeek(now);
                endDate = endOfWeek(now);
        }

        const tasks = await this.taskService.getAll();
        const filteredTasks = tasks.filter(task => {
            const createdAt = new Date(task.createdAt);
            return isAfter(createdAt, startDate) && isBefore(createdAt, endDate);
        });

        const completedTasks = filteredTasks.filter(task => task.status === 'done');
        const totalTasks = filteredTasks.length;
        
        return {
            total: totalTasks,
            completed: completedTasks.length,
            completionRate: totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0,
            timeframe,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
        };
    }

    async getTasksByPriority() {
        await this.init();
        await delay(250);
        
        const tasks = await this.taskService.getAll();
        const priorityCount = {
            high: 0,
            medium: 0,
            low: 0
        };

        tasks.forEach(task => {
            if (task.status !== 'done') {
                priorityCount[task.priority] = (priorityCount[task.priority] || 0) + 1;
            }
        });

        return priorityCount;
    }

    async getTasksByStatus() {
        await this.init();
        await delay(250);
        
        const tasks = await this.taskService.getAll();
        const statusCount = {
            todo: 0,
            'in-progress': 0,
            done: 0
        };

        tasks.forEach(task => {
            statusCount[task.status] = (statusCount[task.status] || 0) + 1;
        });

        return statusCount;
    }

    async getTasksByAssignee() {
        await this.init();
        await delay(250);
        
        const [tasks, users] = await Promise.all([
            this.taskService.getAll(),
            this.userService.getAll()
        ]);

        const assigneeStats = {};
        
        users.forEach(user => {
            assigneeStats[user.id] = {
                name: user.name,
                avatar: user.avatar,
                total: 0,
                completed: 0,
                inProgress: 0,
                todo: 0
            };
        });

        // Add unassigned category
        assigneeStats.unassigned = {
            name: 'Unassigned',
            avatar: null,
            total: 0,
            completed: 0,
            inProgress: 0,
            todo: 0
        };

        tasks.forEach(task => {
            const assigneeId = task.assignedTo?.id || 'unassigned';
            if (assigneeStats[assigneeId]) {
                assigneeStats[assigneeId].total++;
                assigneeStats[assigneeId][task.status === 'done' ? 'completed' : 
                                        task.status === 'in-progress' ? 'inProgress' : 'todo']++;
            }
        });

        return Object.values(assigneeStats).filter(stats => stats.total > 0);
    }

    async getOverdueTasks() {
        await this.init();
        await delay(200);
        
        const tasks = await this.taskService.getAll();
        const now = new Date();
        
        const overdueTasks = tasks.filter(task => {
            if (task.status === 'done' || !task.dueDate) return false;
            return isBefore(new Date(task.dueDate), now);
        });

        return {
            count: overdueTasks.length,
            tasks: overdueTasks.map(task => ({
                id: task.id,
                title: task.title,
                dueDate: task.dueDate,
                priority: task.priority,
                assignedTo: task.assignedTo,
                daysOverdue: Math.ceil((now - new Date(task.dueDate)) / (1000 * 60 * 60 * 24))
            }))
        };
    }

    async getUpcomingDeadlines(days = 7) {
        await this.init();
        await delay(200);
        
        const tasks = await this.taskService.getAll();
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + days);
        
        const upcomingTasks = tasks.filter(task => {
            if (task.status === 'done' || !task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            return isAfter(dueDate, now) && isBefore(dueDate, futureDate);
        });

        return {
            count: upcomingTasks.length,
            tasks: upcomingTasks.map(task => ({
                id: task.id,
                title: task.title,
                dueDate: task.dueDate,
                priority: task.priority,
                assignedTo: task.assignedTo,
                daysUntilDue: Math.ceil((new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24))
            }))
        };
    }

    async getProductivityTrends(timeframe = 'month') {
        await this.init();
        await delay(400);
        
        const now = new Date();
        let startDate, endDate;
        
        switch (timeframe) {
            case 'week':
                startDate = startOfWeek(now);
                endDate = endOfWeek(now);
                break;
            case 'month':
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
                break;
            default:
                startDate = startOfMonth(now);
                endDate = endOfMonth(now);
        }

        const tasks = await this.taskService.getAll();
        const days = eachDayOfInterval({ start: startDate, end: endDate });
        
        const trends = days.map(day => {
            const dayStart = new Date(day);
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);
            
            const completedTasks = tasks.filter(task => {
                if (!task.completedAt) return false;
                const completedDate = new Date(task.completedAt);
                return isAfter(completedDate, dayStart) && isBefore(completedDate, dayEnd);
            });
            
            const createdTasks = tasks.filter(task => {
                const createdDate = new Date(task.createdAt);
                return isAfter(createdDate, dayStart) && isBefore(createdDate, dayEnd);
            });

            return {
                date: format(day, 'yyyy-MM-dd'),
                completed: completedTasks.length,
                created: createdTasks.length,
                productivity: createdTasks.length > 0 ? (completedTasks.length / createdTasks.length) * 100 : 0
            };
        });

        return trends;
    }

    async getProjectProgress() {
        await this.init();
        await delay(300);
        
        const { projectService } = await import('./projectService');
        const [projects, tasks] = await Promise.all([
            projectService.getAll(),
            this.taskService.getAll()
        ]);

        const projectStats = projects.map(project => {
            const projectTasks = tasks.filter(task => task.projectId === project.id);
            const completedTasks = projectTasks.filter(task => task.status === 'done');
            
            return {
                id: project.id,
                name: project.name,
                totalTasks: projectTasks.length,
                completedTasks: completedTasks.length,
                progress: projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0,
                status: project.archived ? 'archived' : 'active'
            };
        });

        return projectStats.filter(stats => stats.status === 'active');
    }

    async getDependencyAnalysis() {
        await this.init();
        await delay(350);
        
        const tasks = await this.taskService.getAll();
        
        const dependencyStats = {
            tasksWithDependencies: 0,
            averageDependencies: 0,
            blockedTasks: 0,
            criticalPath: []
        };

        const tasksWithDeps = tasks.filter(task => task.dependencies && task.dependencies.length > 0);
        dependencyStats.tasksWithDependencies = tasksWithDeps.length;
        
        if (tasksWithDeps.length > 0) {
            const totalDeps = tasksWithDeps.reduce((sum, task) => sum + task.dependencies.length, 0);
            dependencyStats.averageDependencies = totalDeps / tasksWithDeps.length;
        }

        // Find blocked tasks (tasks with incomplete dependencies)
        dependencyStats.blockedTasks = tasksWithDeps.filter(task => {
            return task.dependencies.some(depId => {
                const depTask = tasks.find(t => t.id === depId);
                return depTask && depTask.status !== 'done';
            });
        }).length;

        return dependencyStats;
    }

    async getComprehensiveReport() {
        await this.init();
        await delay(500);
        
        const [
            completionRates,
            priorityBreakdown,
            statusBreakdown,
            assigneeStats,
            overdueTasks,
            upcomingDeadlines,
            productivityTrends,
            projectProgress,
            dependencyAnalysis
        ] = await Promise.all([
            this.getTaskCompletionRates(),
            this.getTasksByPriority(),
            this.getTasksByStatus(),
            this.getTasksByAssignee(),
            this.getOverdueTasks(),
            this.getUpcomingDeadlines(),
            this.getProductivityTrends(),
            this.getProjectProgress(),
            this.getDependencyAnalysis()
        ]);

        return {
            completionRates,
            priorityBreakdown,
            statusBreakdown,
            assigneeStats,
            overdueTasks,
            upcomingDeadlines,
            productivityTrends,
            projectProgress,
            dependencyAnalysis,
            generatedAt: new Date().toISOString()
        };
    }
}

export default AnalyticsService;