import { render, screen, fireEvent } from '@testing-library/react';
import { MetaTraderSection } from '../MetaTraderSection';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../i18n/test-i18n';

describe('MetaTraderSection', () => {
  const renderWithI18n = (component: React.ReactNode) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  it('renders title and description', () => {
    renderWithI18n(<MetaTraderSection onCreateClick={() => {}} />);
    expect(screen.getByText(/Metatrader 5 Sync/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Configure your Metatrader 5 integration settings here/i)
    ).toBeInTheDocument();
  });

  it('renders create card', () => {
    renderWithI18n(<MetaTraderSection onCreateClick={() => {}} />);
    expect(screen.getByText(/create/i)).toBeInTheDocument();
  });

  it('calls onCreateClick when create card is clicked', () => {
    const handleCreateClick = jest.fn();
    renderWithI18n(<MetaTraderSection onCreateClick={handleCreateClick} />);

    const createCard = screen.getByText(/create/i).closest('div');
    if (createCard) {
      fireEvent.click(createCard);
    }

    expect(handleCreateClick).toHaveBeenCalledTimes(1);
  });

  it('renders add icon', () => {
    renderWithI18n(<MetaTraderSection onCreateClick={() => {}} />);
    expect(screen.getByTestId('AddIcon')).toBeInTheDocument();
  });
});
