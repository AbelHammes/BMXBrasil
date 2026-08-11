// Utility for managing Web Browser Notifications for BMX Race Callouts and Heat Results

export interface NotificationPayload {
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  data?: any;
}

/**
 * Check if the browser supports standard Web Notifications
 */
export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

/**
 * Get current notification permission status ('granted' | 'denied' | 'default')
 */
export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

/**
 * Request notification permission from the user
 */
export const solicitarPermissaoNotificacao = async (): Promise<boolean> => {
  if (!isNotificationSupported()) {
    alert('Seu navegador não possui suporte nativo a Notificações Web.');
    return false;
  }

  try {
    const status = await Notification.requestPermission();
    if (status === 'granted') {
      enviarNotificacaoAtleta({
        title: '🔔 Alertas de Chamada Ativados!',
        body: 'Você receberá avisos em tempo real quando suas baterias forem chamadas para alinhamento ou quando os resultados forem publicados.',
        tag: 'bmx-alert-welcome',
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Erro ao solicitar permissão de notificação:', err);
    return false;
  }
};

/**
 * Play a gentle alert tone using Web Audio API
 */
export const tocarSomAlertaBateria = (tipo: 'CHAMADA' | 'RESULTADO' = 'CHAMADA') => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = tipo === 'CHAMADA' ? 'triangle' : 'sine';
    
    // Play dual beep sound
    const now = ctx.currentTime;
    if (tipo === 'CHAMADA') {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.15); // A5
    } else {
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.15); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.3); // G5
    }

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + (tipo === 'CHAMADA' ? 0.4 : 0.6));

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + (tipo === 'CHAMADA' ? 0.4 : 0.6));
  } catch (err) {
    console.log('Audio Context error:', err);
  }
};

/**
 * Send a web notification if permission is granted
 */
export const enviarNotificacaoAtleta = (payload: NotificationPayload) => {
  // Play alert audio tone
  tocarSomAlertaBateria(payload.tag?.includes('resultado') ? 'RESULTADO' : 'CHAMADA');

  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      const notification = new Notification(payload.title, {
        body: payload.body,
        tag: payload.tag || 'bmx-notification',
        icon: payload.icon || '/favicon.ico',
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (err) {
      console.warn('Erro ao disparar Notification object:', err);
    }
  }

  // Also broadcast via custom window event for in-app toast overlays
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('bmx-toast-notification', { detail: payload });
    window.dispatchEvent(event);
  }
};
