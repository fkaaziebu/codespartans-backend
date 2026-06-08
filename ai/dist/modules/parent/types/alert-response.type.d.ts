import { AlertAction } from './alert-action.type';
export declare class AlertResponse {
    id: string;
    alert_type: string;
    icon: string;
    icon_bg: string;
    title: string;
    description: string;
    time_label: string;
    is_unread: boolean;
    actions: AlertAction[];
}
