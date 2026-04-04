class LydexError extends Error {
  constructor(message) {
    super(message);
    this.name = 'LydexError';
  }
}

module.exports = {
  LydexError,
};

