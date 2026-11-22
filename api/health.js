module.exports = async (req, res) => {
  res.json({
    status: 'ok',
    message: 'API is operational',
    timestamp: new Date().toISOString()
  });
};
