// Mock for telegramService

const telegramService = {
  connect: jest.fn(),
  submitVerificationCode: jest.fn(),
  disconnect: jest.fn(),
  getDialogs: jest.fn(),
  getMessages: jest.fn(),
  searchMessages: jest.fn()
};

export default telegramService; 