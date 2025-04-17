import { render, screen } from '@testing-library/react';
import { DashboardSection } from '../DashboardSection';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/test-i18n';

describe('DashboardSection', () => {
  const renderWithI18n = (component: React.ReactNode) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  it('renders welcome message', () => {
    renderWithI18n(
      <DashboardSection loadingDialogs={false} dialogsCount={0} />
    );
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
  });

  it('shows loading state when loadingDialogs is true', () => {
    renderWithI18n(<DashboardSection loadingDialogs={true} dialogsCount={0} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows dialogs count when not loading', () => {
    const dialogsCount = 5;
    renderWithI18n(
      <DashboardSection loadingDialogs={false} dialogsCount={dialogsCount} />
    );
    expect(
      screen.getByText(new RegExp(dialogsCount.toString()))
    ).toBeInTheDocument();
  });

  it('shows credentials when provided', () => {
    const credentials = { api_id: '12345' };
    renderWithI18n(
      <DashboardSection
        loadingDialogs={false}
        dialogsCount={0}
        credentials={credentials}
      />
    );
    expect(
      screen.getByText(new RegExp(credentials.api_id))
    ).toBeInTheDocument();
  });

  it('does not show credentials section when not provided', () => {
    renderWithI18n(
      <DashboardSection loadingDialogs={false} dialogsCount={0} />
    );
    expect(screen.queryByText(/connected/i)).not.toBeInTheDocument();
  });
});
