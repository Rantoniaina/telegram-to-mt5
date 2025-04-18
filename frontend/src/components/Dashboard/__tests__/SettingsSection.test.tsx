import { render, screen } from '@testing-library/react';
import { SettingsSection } from '../SettingsSection';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/test-i18n';

describe('SettingsSection', () => {
  const renderWithI18n = (component: React.ReactNode) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  it('renders title', () => {
    renderWithI18n(<SettingsSection />);
    expect(
      screen.getByRole('heading', { name: /Settings/i })
    ).toBeInTheDocument();
  });

  it('renders description', () => {
    renderWithI18n(<SettingsSection />);
    expect(
      screen.getByText(/Manage your application settings here/i)
    ).toBeInTheDocument();
  });
});
