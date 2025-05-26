module.exports = {
  preset: 'jest-preset-preact',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy', // Para estilos
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/tests/__mocks__/fileMock.js', // Para assets
  },
  testEnvironment: 'jsdom',
  // setupFiles: ['<rootDir>/jest.setup.js'],
};