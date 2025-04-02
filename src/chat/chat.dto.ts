export interface Message {
    title: string;
    position: 'RIGHT' | 'LEFT';
    text: string;
    call?: boolean;
}