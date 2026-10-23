import { useState, type ReactNode } from 'react';
import { ArrowLeft, Home, MessageCircle, NotebookText, UserRound, UsersRound } from 'lucide-react';
import './MobileShell.css';

export type MobileScreen = 'home' | 'mentors' | 'notes' | 'profile' | 'chat';

interface MobileShellProps {
  renderScreen: (screen: MobileScreen, navigate: (screen: MobileScreen) => void) => ReactNode;
}

const tabs: { screen: Exclude<MobileScreen, 'chat'>; label: string; icon: typeof Home }[] = [
  { screen: 'home', label: 'Home', icon: Home },
  { screen: 'mentors', label: 'Mentors', icon: UsersRound },
  { screen: 'notes', label: 'Notes', icon: NotebookText },
  { screen: 'profile', label: 'Profile', icon: UserRound },
];

export function MobileShell({ renderScreen }: MobileShellProps) {
  const [screen, setScreen] = useState<MobileScreen>('home');

  return (
    <div className="mobile-shell">
      {screen === 'chat' && (
        <header className="mobile-chat-header">
          <button type="button" onClick={() => setScreen('home')} aria-label="Back to Home">
            <ArrowLeft aria-hidden="true" />
          </button>
          <span>Chat</span>
          <MessageCircle aria-hidden="true" />
        </header>
      )}
      <main className={`mobile-screen mobile-screen-${screen}`}>
        {renderScreen(screen, setScreen)}
      </main>
      {screen !== 'chat' && (
        <nav className="mobile-bottom-nav" aria-label="Main navigation">
          {tabs.map(({ screen: tabScreen, label, icon: Icon }) => (
            <button
              key={tabScreen}
              type="button"
              className={screen === tabScreen ? 'is-active' : ''}
              aria-current={screen === tabScreen ? 'page' : undefined}
              onClick={() => setScreen(tabScreen)}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
