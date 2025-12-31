import notifee, { AndroidImportance, EventType, TriggerType, TimeUnit } from '@notifee/react-native';
import { Platform } from 'react-native';

class NotificationService {
    constructor() {
        this.configure();
    }

    async configure() {
        if (Platform.OS === 'android') {
            await notifee.createChannel({
                id: 'session_alerts',
                name: 'Session Alerts',
                importance: AndroidImportance.HIGH,
                sound: 'default',
            });
        }

        // Request permissions (iOS)
        await notifee.requestPermission();
    }

    async scheduleNotification(title: string, body: string, delaySeconds: number, id: string) {
        if (delaySeconds <= 0) return;

        const trigger: any = {
            type: TriggerType.TIMESTAMP,
            timestamp: Date.now() + (delaySeconds * 1000),
        };

        await notifee.createTriggerNotification(
            {
                id,
                title,
                body,
                android: {
                    channelId: 'session_alerts',
                    pressAction: {
                        id: 'default',
                    },
                },
                ios: {
                    sound: 'default',
                },
            },
            trigger,
        );
    }

    async cancelNotification(id: string) {
        await notifee.cancelNotification(id);
    }

    async cancelAll() {
        await notifee.cancelAllNotifications();
    }
}

export const notificationService = new NotificationService();
