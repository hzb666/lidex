class LidexError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LidexError';
  }
}

module.exports = {
  LidexError,
};

