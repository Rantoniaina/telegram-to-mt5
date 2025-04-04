import React from 'react';
// Remove the problematic import
// import { render } from '@testing-library/react';
import App from '../App';
import ReactDOM from 'react-dom';

// Mock ReactDOM
jest.mock('react-dom', () => ({
  render: jest.fn(),
}));

// Mock App component
jest.mock('../App', () => () => (
  <div data-testid='mock-app'>App Component</div>
));

// Mock CSS import
jest.mock('../index.css', () => ({}));

// Mock document.getElementById
const mockElement = document.createElement('div');
const getElementByIdSpy = jest
  .spyOn(document, 'getElementById')
  .mockImplementation(() => mockElement);

describe('main', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders App component inside StrictMode to the root element', () => {
    // Import the main file which executes the code
    require('../main');

    // Check that ReactDOM.render was called
    expect(ReactDOM.render).toHaveBeenCalledTimes(1);

    // Verify first argument is a StrictMode with App component
    const [element] = (ReactDOM.render as jest.Mock).mock.calls[0];
    expect(element.type).toBe(React.StrictMode);

    // Instead of using render, we'll check the props directly
    expect(element.props.children.type).toBe(App);

    // Verify second argument is the 'root' element
    expect(document.getElementById).toHaveBeenCalledWith('root');
    expect((ReactDOM.render as jest.Mock).mock.calls[0][1]).toBe(mockElement);
  });

  afterAll(() => {
    getElementByIdSpy.mockRestore();
  });
});
