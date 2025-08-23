import { DynamicWidget, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';

export function WalletConnect() {
  const { primaryWallet, user: dynamicUser } = useDynamicContext();
  const { isAuthenticated, isDemoMode } = useAuth();
  const [showAuthFlow, setShowAuthFlow] = useState(false);

  // Handle auth flow completion
  useEffect(() => {
    if (dynamicUser && showAuthFlow) {
      setShowAuthFlow(false);
    }
  }, [dynamicUser, showAuthFlow]);

  // Show user status
  const getUserDisplay = () => {
    if (isAuthenticated) {
      if (isDemoMode) {
        return 'Get Started';
      } else if (primaryWallet) {
        return `${primaryWallet.address.slice(0, 6)}...${primaryWallet.address.slice(-4)}`;
      }
    }
    return 'Connect Wallet';
  };

  const getButtonStyle = () => {
    if (isAuthenticated) {
      if (isDemoMode) {
        return 'bg-gradient-to-r from-[#10b981] to-[#059669]'; // Green for demo mode
      } else {
        return 'bg-gradient-to-r from-[#e9407a] to-[#ff8a00]'; // Original gradient for connected wallet
      }
    }
    return 'bg-gradient-to-r from-[#e9407a] to-[#ff8a00]'; // Default gradient
  };

  return (
    <DynamicWidget
      innerButtonComponent={
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${getButtonStyle()} text-white font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 text-sm`}
        >
          {getUserDisplay()}
        </div>
      }
      buttonClassName="!bg-transparent !p-0"
    />
  );
}
