import React, { useEffect, useRef } from 'react';
import { driver, Driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useUser } from '../context/UserContext';

export const ProductTour: React.FC = () => {
  const { hasSeenOnboarding, isLoadingAuth, completeOnboarding, isTourOpen, setIsTourOpen, tourTriggerCount } = useUser();
  const driverInstanceRef = useRef<Driver | null>(null);
  const isRunningRef = useRef<boolean>(false);

  useEffect(() => {
    // Only auto-trigger when auth is ready and user has not completed onboarding
    // Or if triggered manually via tourTriggerCount
    if (isLoadingAuth) return;

    const shouldAutoStart = !hasSeenOnboarding;
    const isManualTrigger = tourTriggerCount > 0 && isTourOpen;

    if (!shouldAutoStart && !isManualTrigger) {
      return;
    }

    // Small delay to ensure all DOM elements are mounted and rendered
    const timer = setTimeout(() => {
      startTour();
    }, 600);

    return () => {
      clearTimeout(timer);
      if (driverInstanceRef.current && isRunningRef.current) {
        try {
          driverInstanceRef.current.destroy();
        } catch (_) {}
      }
    };
  }, [isLoadingAuth, hasSeenOnboarding, tourTriggerCount, isTourOpen]);

  const startTour = () => {
    if (isRunningRef.current) {
      try {
        driverInstanceRef.current?.destroy();
      } catch (_) {}
    }

    // Define all steps with non-obvious core features
    const allSteps = [
      {
        element: '#tour-mode-switcher',
        popover: {
          title: '3-Domain Knowledge Switcher',
          description:
            'Toggle seamlessly between <b>Concept</b> (intuitive analogies & first-principles theory), <b>Exam</b> (board-specific rubrics & rigorous mark schemes), and <b>Research</b> (academic literature, citations & state-of-the-art papers).',
          side: 'bottom' as const,
          align: 'start' as const,
        },
      },
      {
        element: '#tour-persona-toggle',
        popover: {
          title: 'Specialist Mentors & Auto-Routing',
          description:
            'Consult dedicated expert personas across STEM, Medicine, and Law. G-AGE also intelligently auto-routes your questions to the optimal specialist mentor.',
          side: 'bottom' as const,
          align: 'end' as const,
        },
      },
      {
        element: '#tour-specs-btn',
        popover: {
          title: 'Rigor & Exam Specifications',
          description:
            'Fine-tune pedagogical depth from intuitive ELI5 to graduate research rigor, dial mathematical formalism, and target specific academic boards (MDCAT, Cambridge, JEE, USMLE).',
          side: 'bottom' as const,
          align: 'start' as const,
        },
      },
      {
        element: '#tour-quick-tools',
        popover: {
          title: 'Interactive Study Accelerators',
          description:
            'Generate instant practice MCQs to verify retention, trigger structured multi-tier concept definitions, or launch interactive knowledge graphs.',
          side: 'bottom' as const,
          align: 'start' as const,
        },
      },
      {
        element: '#tour-notes-btn',
        popover: {
          title: 'Smart Notebook & PDF Export',
          description:
            'Save key formulas, diagrams, and derivations directly into your personal revision notebook, compile multi-turn summaries, and export clean PDF study guides.',
          side: 'bottom' as const,
          align: 'end' as const,
        },
      },
      {
        element: '#tour-quota-badge',
        popover: {
          title: 'Daily Allowance & Multimodal Vision',
          description:
            'Monitor your daily query quota. Attach complex diagrams, textbook problems, or past papers for step-by-step visual solution breakdown.',
          side: 'top' as const,
          align: 'center' as const,
        },
      },
    ];

    // Filter to steps whose target elements exist in DOM and are visible
    const availableSteps = allSteps.filter((step) => {
      const el = document.querySelector(step.element);
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    if (availableSteps.length === 0) {
      console.warn('[Tour] No tour elements found on stage.');
      return;
    }

    isRunningRef.current = true;
    setIsTourOpen(true);

    const driverObj = driver({
      showProgress: true,
      progressText: '{{current}} of {{total}}',
      animate: true,
      allowClose: true,
      overlayColor: '#020617',
      overlayOpacity: 0.72,
      stagePadding: 8,
      stageRadius: 12,
      popoverClass: 'gage-tour-popover',
      nextBtnText: 'Next →',
      prevBtnText: '← Back',
      doneBtnText: 'Got It 🚀',
      showButtons: ['next', 'previous', 'close'],
      steps: availableSteps,
      onDestroyStarted: () => {
        driverObj.destroy();
      },
      onDestroyed: () => {
        isRunningRef.current = false;
        setIsTourOpen(false);
        completeOnboarding();
      },
      onPopoverRender: (popover) => {
        // Inject a dedicated "Skip Tour" button if not already present
        const footer = popover.footer;
        if (footer && !footer.querySelector('.gage-tour-skip-btn')) {
          const skipBtn = document.createElement('button');
          skipBtn.className = 'gage-tour-skip-btn';
          skipBtn.textContent = 'Skip tour';
          skipBtn.type = 'button';
          skipBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            driverObj.destroy();
          };
          footer.prepend(skipBtn);
        }
      },
    });

    driverInstanceRef.current = driverObj;
    driverObj.drive();
  };

  // Auto-dismiss tour gracefully if user focuses or starts typing in chat input
  useEffect(() => {
    const handleInputInteraction = () => {
      if (isRunningRef.current && driverInstanceRef.current) {
        try {
          driverInstanceRef.current.destroy();
        } catch (_) {}
      }
    };

    const inputElements = document.querySelectorAll('textarea, input[type="text"], #tour-chat-input');
    inputElements.forEach((el) => {
      el.addEventListener('focusin', handleInputInteraction);
      el.addEventListener('keydown', handleInputInteraction);
    });

    return () => {
      inputElements.forEach((el) => {
        el.removeEventListener('focusin', handleInputInteraction);
        el.removeEventListener('keydown', handleInputInteraction);
      });
    };
  }, [isTourOpen]);

  return null;
};
