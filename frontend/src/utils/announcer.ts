/**
 * Accessible Live Announcer for Screen Readers (WCAG 2.1 Success Criteria 4.1.3: Status Messages).
 * Programmatically announces dynamic changes (ward selection, alerts, agent results)
 * without stealing focus or disrupting cognitive flow.
 */

type AnnouncementPriority = 'polite' | 'assertive';

class ScreenReaderAnnouncer {
  private politeElement: HTMLDivElement | null = null;
  private assertiveElement: HTMLDivElement | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.initElements();
    }
  }

  private initElements() {
    if (this.politeElement && this.assertiveElement) return;

    this.politeElement = document.createElement('div');
    this.politeElement.setAttribute('role', 'status');
    this.politeElement.setAttribute('aria-live', 'polite');
    this.politeElement.setAttribute('aria-atomic', 'true');
    this.politeElement.className = 'sr-only';
    this.politeElement.id = 'a11y-live-polite';
    document.body.appendChild(this.politeElement);

    this.assertiveElement = document.createElement('div');
    this.assertiveElement.setAttribute('role', 'alert');
    this.assertiveElement.setAttribute('aria-live', 'assertive');
    this.assertiveElement.setAttribute('aria-atomic', 'true');
    this.assertiveElement.className = 'sr-only';
    this.assertiveElement.id = 'a11y-live-assertive';
    document.body.appendChild(this.assertiveElement);
  }

  public announce(message: string, priority: AnnouncementPriority = 'polite') {
    if (typeof document === 'undefined') return;
    this.initElements();

    const target = priority === 'assertive' ? this.assertiveElement : this.politeElement;
    if (!target) return;

    // Clear then set message with slight delay to ensure assistive technology announces repeatedly if needed
    target.textContent = '';
    setTimeout(() => {
      target.textContent = message;
    }, 50);
  }
}

export const liveAnnouncer = new ScreenReaderAnnouncer();
