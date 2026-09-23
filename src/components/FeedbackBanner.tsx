import React from 'react';
import { TerminalStatus } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import './FeedbackBanner.css';

interface FeedbackBannerProps {
  status: TerminalStatus;
  message: string;
  onNextMission?: () => void;
  hasNextMission?: boolean;
  nextButtonLabel?: string;
}

export const FeedbackBanner: React.FC<FeedbackBannerProps> = ({
  status,
  message,
  onNextMission,
  hasNextMission = false,
  nextButtonLabel,
}) => {
  if (status === 'READY') {
    return null;
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle2 size={24} className="banner-icon-success" aria-hidden="true" />;
      case 'HIT_WALL':
      case 'OUT_OF_BOUNDS':
        return <AlertTriangle size={24} className="banner-icon-warning" aria-hidden="true" />;
      case 'MAX_COMMANDS_EXCEEDED':
        return <XCircle size={24} className="banner-icon-danger" aria-hidden="true" />;
      case 'INCOMPLETE':
      default:
        return <Info size={24} className="banner-icon-info" aria-hidden="true" />;
    }
  };

  const getStatusClass = () => {
    switch (status) {
      case 'SUCCESS':
        return 'feedback-success';
      case 'HIT_WALL':
      case 'OUT_OF_BOUNDS':
        return 'feedback-warning';
      case 'MAX_COMMANDS_EXCEEDED':
        return 'feedback-danger';
      case 'INCOMPLETE':
      default:
        return 'feedback-incomplete';
    }
  };

  return (
    <div
      className={`feedback-banner ${getStatusClass()}`}
      role={status === 'SUCCESS' ? 'status' : 'alert'}
      aria-live="polite"
    >
      <div className="feedback-content">
        <div className="feedback-icon-wrap">{getStatusIcon()}</div>
        <div className="feedback-text-wrap">
          <p className="feedback-message">{message}</p>
        </div>
      </div>

      {status === 'SUCCESS' && hasNextMission && onNextMission && (
        <button
          type="button"
          className="btn-next-mission"
          onClick={onNextMission}
          aria-label={nextButtonLabel || 'Перейти к следующему заданию'}
        >
          {nextButtonLabel || 'Следующее задание →'}
        </button>
      )}
    </div>
  );
};
