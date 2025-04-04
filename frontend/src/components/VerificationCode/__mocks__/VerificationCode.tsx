import React from 'react';
import { TelegramCredentials } from '../../../types/telegram';

interface VerificationCodeProps {
  credentials: TelegramCredentials;
  onSuccess: () => void;
  onBack: () => void;
}

const VerificationCode: React.FC<VerificationCodeProps> = ({
  credentials,
  onSuccess,
  onBack,
}) => {
  return (
    <div data-testid='mock-verification-code'>
      <button onClick={onBack}>Back</button>
      <button onClick={onSuccess}>Success</button>
    </div>
  );
};

export default VerificationCode;
